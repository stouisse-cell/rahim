import { Router, type IRouter } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { z } from "zod/v4";
import { db, leadsTable } from "@workspace/db";
import { requireAdmin } from "../lib/auth";

const router: IRouter = Router();

const LeadBody = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(200),
  phone: z.string().max(60).optional().nullable(),
  message: z.string().max(5000).optional().nullable(),
  sourcePage: z.string().max(500).optional().nullable(),
  sourceLang: z.string().max(8).optional().nullable(),
  utmSource: z.string().max(120).optional().nullable(),
  utmMedium: z.string().max(120).optional().nullable(),
  utmCampaign: z.string().max(120).optional().nullable(),
});

router.post("/leads", async (req, res): Promise<void> => {
  const parsed = LeadBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .insert(leadsTable)
    .values(parsed.data)
    .returning({ id: leadsTable.id });
  req.log.info({ leadId: row?.id }, "New lead captured");
  res.status(201).json({ ok: true, id: row?.id });
});

router.get("/admin/leads", requireAdmin, async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(leadsTable)
    .orderBy(desc(leadsTable.createdAt))
    .limit(500);
  res.json(rows);
});

router.get("/admin/leads/stats", requireAdmin, async (_req, res): Promise<void> => {
  const byStatus = await db
    .select({
      status: leadsTable.status,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(leadsTable)
    .groupBy(leadsTable.status);

  const byLang = await db
    .select({
      lang: leadsTable.sourceLang,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(leadsTable)
    .groupBy(leadsTable.sourceLang);

  const total = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(leadsTable);

  const last7 = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(leadsTable)
    .where(sql`${leadsTable.createdAt} > NOW() - INTERVAL '7 days'`);

  const last30 = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(leadsTable)
    .where(sql`${leadsTable.createdAt} > NOW() - INTERVAL '30 days'`);

  res.json({
    total: total[0]?.count ?? 0,
    last7: last7[0]?.count ?? 0,
    last30: last30[0]?.count ?? 0,
    byStatus,
    byLang,
  });
});

const LeadUpdate = z.object({
  status: z
    .enum(["new", "contacted", "qualified", "closed", "lost"])
    .optional(),
  notes: z.string().max(5000).nullable().optional(),
});

router.patch(
  "/admin/leads/:id",
  requireAdmin,
  async (req, res): Promise<void> => {
    const idRaw = Array.isArray(req.params["id"])
      ? req.params["id"][0]
      : req.params["id"];
    const id = parseInt(idRaw ?? "", 10);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const parsed = LeadUpdate.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const [row] = await db
      .update(leadsTable)
      .set(parsed.data)
      .where(eq(leadsTable.id, id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "Lead not found" });
      return;
    }
    res.json(row);
  },
);

router.delete(
  "/admin/leads/:id",
  requireAdmin,
  async (req, res): Promise<void> => {
    const idRaw = Array.isArray(req.params["id"])
      ? req.params["id"][0]
      : req.params["id"];
    const id = parseInt(idRaw ?? "", 10);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    await db.delete(leadsTable).where(eq(leadsTable.id, id));
    res.sendStatus(204);
  },
);

export default router;

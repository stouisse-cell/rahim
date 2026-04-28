import { Router, type IRouter } from "express";
import { eq, desc, and, gte, lte, sql, type SQL } from "drizzle-orm";
import { z } from "zod/v4";
import { db, propertiesTable } from "@workspace/db";
import { requireAdmin } from "../lib/auth";

const router: IRouter = Router();

const PropertyBody = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, digits, and dashes"),
  title: z.string().min(1),
  titleFr: z.string().nullable().optional(),
  titleAr: z.string().nullable().optional(),
  description: z.string().min(1),
  descriptionFr: z.string().nullable().optional(),
  descriptionAr: z.string().nullable().optional(),
  city: z.string().min(1),
  neighborhood: z.string().nullable().optional(),
  propertyType: z.string().min(1),
  status: z.enum(["off-plan", "ready", "sold", "rented"]).default("ready"),
  price: z.coerce.number().int().min(0),
  bedrooms: z.coerce.number().int().min(0).default(0),
  bathrooms: z.coerce.number().int().min(0).default(0),
  areaSqm: z.coerce.number().int().min(0).default(0),
  yearBuilt: z.coerce.number().int().nullable().optional(),
  images: z.array(z.string().url()).default([]),
  features: z.array(z.string()).default([]),
  locationLat: z.coerce.number().nullable().optional(),
  locationLng: z.coerce.number().nullable().optional(),
  featured: z.coerce.boolean().default(false),
  published: z.coerce.boolean().default(true),
});

const PropertyUpdate = PropertyBody.partial();

const ListQuery = z.object({
  city: z.string().optional(),
  status: z.string().optional(),
  propertyType: z.string().optional(),
  minPrice: z.coerce.number().int().optional(),
  maxPrice: z.coerce.number().int().optional(),
  minBedrooms: z.coerce.number().int().optional(),
  featured: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((v) => (v === "true" ? true : v === "false" ? false : undefined)),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

router.get("/properties", async (req, res): Promise<void> => {
  const parsed = ListQuery.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const q = parsed.data;
  const conditions: SQL[] = [eq(propertiesTable.published, true)];
  if (q.city) conditions.push(eq(propertiesTable.city, q.city));
  if (q.status) conditions.push(eq(propertiesTable.status, q.status));
  if (q.propertyType)
    conditions.push(eq(propertiesTable.propertyType, q.propertyType));
  if (q.minPrice !== undefined)
    conditions.push(gte(propertiesTable.price, q.minPrice));
  if (q.maxPrice !== undefined)
    conditions.push(lte(propertiesTable.price, q.maxPrice));
  if (q.minBedrooms !== undefined)
    conditions.push(gte(propertiesTable.bedrooms, q.minBedrooms));
  if (q.featured !== undefined)
    conditions.push(eq(propertiesTable.featured, q.featured));

  const rows = await db
    .select()
    .from(propertiesTable)
    .where(and(...conditions))
    .orderBy(desc(propertiesTable.featured), desc(propertiesTable.createdAt))
    .limit(q.limit);

  res.json(rows);
});

router.get("/properties/facets", async (_req, res): Promise<void> => {
  const cities = await db
    .selectDistinct({ city: propertiesTable.city })
    .from(propertiesTable)
    .where(eq(propertiesTable.published, true));
  const types = await db
    .selectDistinct({ propertyType: propertiesTable.propertyType })
    .from(propertiesTable)
    .where(eq(propertiesTable.published, true));
  const priceRange = await db
    .select({
      min: sql<number>`COALESCE(MIN(${propertiesTable.price}), 0)::int`,
      max: sql<number>`COALESCE(MAX(${propertiesTable.price}), 0)::int`,
    })
    .from(propertiesTable)
    .where(eq(propertiesTable.published, true));

  res.json({
    cities: cities.map((c) => c.city).sort(),
    propertyTypes: types.map((t) => t.propertyType).sort(),
    price: priceRange[0] ?? { min: 0, max: 0 },
  });
});

router.get("/properties/:slug", async (req, res): Promise<void> => {
  const slugRaw = Array.isArray(req.params["slug"])
    ? req.params["slug"][0]
    : req.params["slug"];
  if (!slugRaw) {
    res.status(400).json({ error: "Slug required" });
    return;
  }
  const [row] = await db
    .select()
    .from(propertiesTable)
    .where(
      and(
        eq(propertiesTable.slug, slugRaw),
        eq(propertiesTable.published, true),
      ),
    );
  if (!row) {
    res.status(404).json({ error: "Property not found" });
    return;
  }
  res.json(row);
});

router.get("/admin/properties", requireAdmin, async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(propertiesTable)
    .orderBy(desc(propertiesTable.createdAt));
  res.json(rows);
});

router.post("/admin/properties", requireAdmin, async (req, res): Promise<void> => {
  const parsed = PropertyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const [row] = await db
      .insert(propertiesTable)
      .values(parsed.data)
      .returning();
    res.status(201).json(row);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Insert failed";
    if (message.includes("unique")) {
      res.status(409).json({ error: "A property with this slug already exists" });
      return;
    }
    req.log.error({ err }, "Failed to create property");
    res.status(500).json({ error: "Failed to create property" });
  }
});

router.patch(
  "/admin/properties/:id",
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
    const parsed = PropertyUpdate.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const [row] = await db
      .update(propertiesTable)
      .set(parsed.data)
      .where(eq(propertiesTable.id, id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "Property not found" });
      return;
    }
    res.json(row);
  },
);

router.delete(
  "/admin/properties/:id",
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
    const [row] = await db
      .delete(propertiesTable)
      .where(eq(propertiesTable.id, id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "Property not found" });
      return;
    }
    res.sendStatus(204);
  },
);

export default router;

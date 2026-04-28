import { Router, type IRouter } from "express";
import { z } from "zod/v4";
import { checkAdminPassword } from "../lib/auth";

const router: IRouter = Router();

const LoginBody = z.object({
  password: z.string().min(1),
});

router.post("/admin/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Password required" });
    return;
  }

  if (!checkAdminPassword(parsed.data.password)) {
    req.log.warn(
      { ip: req.ip },
      "Admin login failed",
    );
    res.status(401).json({ error: "Invalid password" });
    return;
  }

  if (!req.session) {
    res.status(500).json({ error: "Session not configured" });
    return;
  }

  req.session.isAdmin = true;
  req.session.loginAt = Date.now();
  req.log.info("Admin logged in");
  res.json({ ok: true });
});

router.post("/admin/logout", async (req, res): Promise<void> => {
  if (req.session) {
    req.session.destroy(() => {
      res.clearCookie("rahim.sid");
      res.json({ ok: true });
    });
    return;
  }
  res.json({ ok: true });
});

router.get("/admin/me", async (req, res): Promise<void> => {
  res.json({ isAdmin: req.session?.isAdmin === true });
});

export default router;

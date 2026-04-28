import type { Request, Response, NextFunction } from "express";
import { timingSafeEqual } from "node:crypto";

declare module "express-session" {
  interface SessionData {
    isAdmin?: boolean;
    loginAt?: number;
  }
}

export function checkAdminPassword(input: unknown): boolean {
  if (typeof input !== "string") return false;
  const expected = process.env["ADMIN_PASSWORD"];
  if (!expected) return false;

  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (req.session?.isAdmin === true) {
    next();
    return;
  }
  res.status(401).json({ error: "Unauthorized" });
}

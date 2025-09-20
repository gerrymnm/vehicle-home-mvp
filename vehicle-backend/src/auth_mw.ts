import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { RequestUser, Role } from "./types/shims";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

export function signAccessToken(user: RequestUser): string {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, dealerId: user.dealerId ?? null },
    JWT_SECRET,
    { expiresIn: "30m" }
  );
}
export function signRefreshToken(user: RequestUser): string {
  return jwt.sign({ sub: user.id, type: "refresh" }, JWT_SECRET, { expiresIn: "30d" });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET) as any;
    req.user = {
      id: Number(payload.sub),
      email: payload.email,
      role: payload.role as Role,
      dealerId: payload.dealerId ?? null,
    };
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: "Forbidden" });
    next();
  };
}

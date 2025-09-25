// vehicle-backend/src/auth_mw.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export default function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const hdr = req.headers.authorization || "";
    const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
    if (!token) return res.status(401).json({ error: "missing_token" });

    const decoded = jwt.verify(token, JWT_SECRET) as Express.UserPayload | any;
    req.user = {
      id: decoded?.id ?? "unknown",
      role: decoded?.role ?? "consumer",
      email: decoded?.email
    };
    return next();
  } catch (e) {
    return res.status(401).json({ error: "invalid_token" });
  }
}

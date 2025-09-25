import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

/** What we store in JWTs (keep minimal for now). */
export type UserPayload = {
  sub: string;        // unique user id (email for now)
  role?: string;      // e.g. "dealer", "consumer"
  email?: string;
};

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const ACCESS_TTL = process.env.JWT_ACCESS_TTL || "15m";
const REFRESH_TTL = process.env.JWT_REFRESH_TTL || "7d";

/** Create short-lived access token */
export function signAccessToken(payload: UserPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TTL });
}

/** Create refresh token (tagged) */
export function signRefreshToken(payload: UserPayload) {
  return jwt.sign({ ...payload, typ: "refresh" }, JWT_SECRET, {
    expiresIn: REFRESH_TTL,
  });
}

/** Express middleware: require valid Bearer token and attach req.user */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : "";

  if (!token) return res.status(401).json({ error: "missing_token" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "invalid_token" });
  }
}

/** Augment Express.Request so req.user is typed */
declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

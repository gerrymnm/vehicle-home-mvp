import type { Request, Response, NextFunction } from "express";
import jwt, { type Secret, type SignOptions } from "jsonwebtoken";

/** JWT payload we use everywhere */
export type UserPayload = {
  sub: string;       // unique user id (email for now)
  role?: string;
  email?: string;
};

const JWT_SECRET: Secret = (process.env.JWT_SECRET || "dev_secret") as Secret;

// jsonwebtoken@^9 types use a branded template type for expiresIn.
// Coerce env strings to the exact type expected.
const ACCESS_TTL: SignOptions["expiresIn"] = (process.env.JWT_ACCESS_TTL || "15m") as any;
const REFRESH_TTL: SignOptions["expiresIn"] = (process.env.JWT_REFRESH_TTL || "7d") as any;

/** Create short-lived access token */
export function signAccessToken(payload: UserPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TTL } as SignOptions);
}

/** Create refresh token */
export function signRefreshToken(payload: UserPayload) {
  return jwt.sign({ ...payload, typ: "refresh" }, JWT_SECRET, { expiresIn: REFRESH_TTL } as SignOptions);
}

/** Require a valid Bearer token and attach req.user */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : "";
  if (!token) return res.status(401).json({ error: "missing_token" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
    (req as any).user = decoded;
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

export default requireAuth;

import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { getPool } from "./db";
import { signAccessToken, signRefreshToken, requireAuth } from "./auth_mw";
import type { RequestUser, Role } from "./types/shims";

export const authRouter = Router();

function toUser(row: any): RequestUser {
  return { id: row.id, email: row.email, role: row.role as Role, dealerId: row.dealer_id ?? null };
}

/** POST /api/auth/register */
authRouter.post("/auth/register", async (req: Request, res: Response) => {
  const { email, password, role, dealerName } = req.body || {};
  if (!email || !password || !role) return res.status(400).json({ error: "email, password, role required" });
  if (!["dealer", "consumer", "admin"].includes(role)) return res.status(400).json({ error: "invalid role" });

  const db = getPool();
  const client = await db.connect();
  try {
    const exists = await client.query("SELECT id FROM users WHERE email=$1", [email]);
    if (exists.rowCount) return res.status(409).json({ error: "email already exists" });

    await client.query("BEGIN");
    let dealerId: number | null = null;
    if (role === "dealer") {
      if (!dealerName) return res.status(400).json({ error: "dealerName required for dealer role" });
      const d = await client.query(`INSERT INTO dealers(name) VALUES ($1) RETURNING id`, [dealerName]);
      dealerId = Number(d.rows[0].id);
    }
    const hash = await bcrypt.hash(password, 10);
    const u = await client.query(
      `INSERT INTO users(email, password_hash, role, dealer_id)
       VALUES ($1,$2,$3,$4) RETURNING id, email, role, dealer_id`,
      [email, hash, role, dealerId]
    );
    await client.query("COMMIT");

    const user = toUser(u.rows[0]);
    const access = signAccessToken(user);
    const refresh = signRefreshToken(user);
    res.status(201).json({ user, access, refresh });
  } catch (e) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "registration failed" });
  } finally {
    client.release();
  }
});

/** POST /api/auth/login */
authRouter.post("/auth/login", async (req: Request, res: Response) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "email and password required" });

  const db = getPool();
  const r = await db.query(`SELECT * FROM users WHERE email=$1`, [email]);
  if (!r.rowCount) return res.status(401).json({ error: "invalid credentials" });

  const row = r.rows[0];
  const ok = await bcrypt.compare(password, row.password_hash);
  if (!ok) return res.status(401).json({ error: "invalid credentials" });

  const user = toUser(row);
  const access = signAccessToken(user);
  const refresh = signRefreshToken(user);
  res.json({ user, access, refresh });
});

/** POST /api/auth/refresh */
authRouter.post("/auth/refresh", async (req: Request, res: Response) => {
  const { refresh } = req.body || {};
  if (!refresh) return res.status(400).json({ error: "refresh token required" });
  try {
    const jwt = require("jsonwebtoken");
    const payload = jwt.verify(refresh, process.env.JWT_SECRET || "dev-secret-change-me") as any;
    if (payload.type !== "refresh") throw new Error("bad token");
    const db = getPool();
    const r = await db.query(`SELECT * FROM users WHERE id=$1`, [Number(payload.sub)]);
    if (!r.rowCount) return res.status(401).json({ error: "invalid token" });
    const user = toUser(r.rows[0]);
    const access = signAccessToken(user);
    res.json({ access });
  } catch {
    res.status(401).json({ error: "invalid token" });
  }
});

/** GET /api/auth/me */
authRouter.get("/auth/me", requireAuth, (req: Request, res: Response) => {
  res.json({ user: req.user });
});

import { Router, Request, Response } from "express";
import pool from "./db";

const router = Router();

/**
 * POST /api/leads
 * Body: { vin: string, name?: string, email?: string, phone?: string, message?: string }
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const { vin, name, email, phone, message } = (req.body ?? {}) as {
      vin?: string;
      name?: string;
      email?: string;
      phone?: string;
      message?: string;
    };

    if (!vin || typeof vin !== "string") {
      return res.status(400).json({ error: "vin_required" });
    }

    const sql =
      `INSERT INTO leads (vin, name, email, phone, message, status)
       VALUES ($1,$2,$3,$4,$5,'new')
       RETURNING id, created_at`;

    const r = await pool.query(sql, [
      vin,
      name ?? null,
      email ?? null,
      phone ?? null,
      message ?? null,
    ]);

    return res.json({
      ok: true,
      id: r.rows?.[0]?.id,
      created_at: r.rows?.[0]?.created_at,
    });
  } catch (e: any) {
    console.error("[leads] create failed:", e);
    return res.status(500).json({ ok: false, error: "lead_failed" });
  }
});

/**
 * GET /api/leads
 * Returns the most recent leads (basic list).
 */
router.get("/", async (_req: Request, res: Response) => {
  try {
    const r = await pool.query(
      `SELECT id, vin, name, email, phone, message, status, created_at
       FROM leads
       ORDER BY created_at DESC
       LIMIT 100`
    );
    return res.json({ ok: true, rows: r.rows });
  } catch (e: any) {
    console.error("[leads] list failed:", e);
    return res.status(500).json({ ok: false, error: "lead_list_failed" });
  }
});

export default router;

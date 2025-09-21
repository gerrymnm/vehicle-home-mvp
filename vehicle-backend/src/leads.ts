import { Router, Request, Response } from "express";
import { query } from "./db";

const leadsRouter = Router();

/**
 * POST /api/leads
 * Body: { vin?, name, email?, phone?, message? }
 */
leadsRouter.post("/", async (req: Request, res: Response) => {
  try {
    const { vin, name, email, phone, message } = req.body || {};
    if (!name || String(name).trim().length === 0) {
      return res.status(400).json({ error: "name is required" });
    }

    const r = await query<{ id: number }>(
      `INSERT INTO leads (vin, name, email, phone, message, source)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        vin ?? null,
        String(name).trim(),
        email ?? null,
        phone ?? null,
        message ?? null,
        "web",
      ]
    );

    return res.json({ ok: true, id: r.rows[0].id });
  } catch (e: any) {
    console.error("[leads] insert failed:", e);
    return res
      .status(500)
      .json({ error: "failed to create lead", detail: e?.code || String(e) });
  }
});

/**
 * GET /api/leads
 * (simple listing for now; lock down later)
 */
leadsRouter.get("/", async (_req: Request, res: Response) => {
  try {
    const r = await query(
      `SELECT id, vin, name, email, phone, message, status, created_at
       FROM leads
       ORDER BY created_at DESC
       LIMIT 200`
    );
    return res.json({ ok: true, rows: r.rows });
  } catch (e: any) {
    console.error("[leads] list failed:", e);
    return res.status(500).json({ error: "failed to list leads" });
  }
});

export default leadsRouter;

// vehicle-backend/src/leads.ts
import { Router, Request, Response } from "express";
import { pool } from "./db";

const router = Router();

router.post("/leads", async (req: Request, res: Response) => {
  try {
    const { vin, name, email, phone, message } = req.body ?? {};
    if (!vin) return res.status(400).json({ error: "vin_required" });

    const result = await pool.query(
      `INSERT INTO leads (vin, name, email, phone, message, status)
       VALUES ($1,$2,$3,$4,$5,'new') RETURNING id, created_at`,
      [vin, name ?? null, email ?? null, phone ?? null, message ?? null]
    );

    res.json({ ok: true, id: result.rows[0].id, created_at: result.rows[0].created_at });
  } catch (e) {
    res.status(500).json({ error: "lead_failed" });
  }
});

router.get("/leads", async (_req: Request, res: Response) => {
  try {
    const r = await pool.query(
      `SELECT id, vin, name, email, phone, message, status, created_at
       FROM leads ORDER BY created_at DESC LIMIT 200`
    );
    res.json({ ok: true, items: r.rows });
  } catch (e) {
    res.status(500).json({ error: "leads_query_failed" });
  }
});

export default router;

import express, { Request, Response } from "express";
import { query } from "./db";
import { requireAuth } from "./auth_mw";

type AuthedRequest = Request & {
  user?: {
    id?: number;
    email?: string;
    role?: "consumer" | "dealer" | "admin";
    dealerId?: number | null;
  };
};

const leadsRouter = express.Router();

/**
 * POST /api/leads
 * Public — accepts an inquiry for a vehicle.
 * Body: { vin, vehicleTitle?, dealerId?, name, email?, phone?, message? }
 */
leadsRouter.post("/leads", async (req: Request, res: Response) => {
  const { vin, vehicleTitle, dealerId, name, email, phone, message } = req.body || {};
  if (!vin || !name) {
    return res.status(400).json({ error: "vin and name are required" });
  }

  try {
    const ins = await query<{ id: number }>(
      `
      INSERT INTO leads (vin, vehicle_title, dealer_id, name, email, phone, message, source)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING id
    `,
      [vin, vehicleTitle || null, dealerId ?? null, name, email || null, phone || null, message || null, "web"]
    );

    // optional: also append an event row for traceability
    await query(
      `INSERT INTO events(vin, type, note) VALUES ($1,$2,$3)`,
      [vin, "lead", `Lead from ${name}${email ? " <" + email + ">" : ""}`]
    );

    return res.json({ ok: true, id: ins.rows[0].id });
  } catch (err) {
    console.error("POST /leads failed:", err);
    return res.status(500).json({ error: "failed to create lead" });
  }
});

/**
 * GET /api/leads
 * Dealer/Admin — list leads scoped to the dealer.
 * Query: ?limit=50&offset=0
 */
leadsRouter.get("/leads", requireAuth, async (req: AuthedRequest, res: Response) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: "unauthorized" });

  const limit = Math.min(parseInt(String(req.query.limit || "50"), 10) || 50, 200);
  const offset = parseInt(String(req.query.offset || "0"), 10) || 0;

  try {
    if (user.role === "admin") {
      // Admin can see all leads, optionally filter by dealerId
      const dealerId = req.query.dealerId ? Number(req.query.dealerId) : undefined;
      const where = dealerId ? "WHERE dealer_id = $1" : "";
      const params: any[] = dealerId ? [dealerId, limit, offset] : [limit, offset];

      const sql = `
        SELECT id, vin, vehicle_title, dealer_id, name, email, phone, message, status, created_at
        FROM leads
        ${where}
        ORDER BY created_at DESC
        LIMIT $${dealerId ? 2 : 1} OFFSET $${dealerId ? 3 : 2}
      `;
      const r = await query(sql, params);
      return res.json({ results: r.rows, paging: { limit, offset } });
    }

    if (user.role !== "dealer" || !user.dealerId) {
      return res.status(403).json({ error: "forbidden" });
    }

    const r = await query(
      `
        SELECT id, vin, vehicle_title, dealer_id, name, email, phone, message, status, created_at
        FROM leads
        WHERE dealer_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `,
      [user.dealerId, limit, offset]
    );
    return res.json({ results: r.rows, paging: { limit, offset } });
  } catch (err) {
    console.error("GET /leads failed:", err);
    return res.status(500).json({ error: "failed to load leads" });
  }
});

/**
 * PATCH /api/leads/:id
 * Dealer/Admin — update status (e.g., new → contacted → closed)
 * Body: { status }
 */
leadsRouter.patch("/leads/:id", requireAuth, async (req: AuthedRequest, res: Response) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: "unauthorized" });

  const id = Number(req.params.id);
  const { status } = req.body || {};
  if (!id || !status) return res.status(400).json({ error: "id and status are required" });

  try {
    // Only update rows the dealer owns, unless admin
    if (user.role === "admin") {
      await query(`UPDATE leads SET status = $1 WHERE id = $2`, [status, id]);
      return res.json({ ok: true });
    }

    if (user.role !== "dealer" || !user.dealerId) {
      return res.status(403).json({ error: "forbidden" });
    }

    const upd = await query(
      `UPDATE leads SET status = $1 WHERE id = $2 AND dealer_id = $3`,
      [status, id, user.dealerId]
    );

    if (upd.rowCount === 0) return res.status(404).json({ error: "not found" });
    return res.json({ ok: true });
  } catch (err) {
    console.error("PATCH /leads/:id failed:", err);
    return res.status(500).json({ error: "failed to update lead" });
  }
});

export default leadsRouter;

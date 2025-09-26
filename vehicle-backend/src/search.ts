// vehicle-backend/src/search.ts
import { Router, Request, Response } from "express";
import pool from "./db";

const router = Router();

/**
 * GET /api/search?q=<query>&page=<n>&pagesize=<n>
 * - Searches vehicles by make/model/trim or VIN (partial match)
 * - No reliance on non-existent columns like created_at
 */
router.get("/", async (req: Request, res: Response) => {
  const q = (req.query.q as string | undefined)?.trim() ?? "";
  const page = Math.max(parseInt(String(req.query.page ?? "1"), 10) || 1, 1);
  const pageSize =
    Math.min(
      Math.max(parseInt(String(req.query.pagesize ?? "20"), 10) || 20, 1),
      100
    ) || 20;
  const offset = (page - 1) * pageSize;

  try {
    const term = `%${q}%`;

    // Count first
    const countSql = `
      SELECT COUNT(*)::int AS count
      FROM vehicles v
      WHERE ($1 = '' OR v.make ILIKE $2 OR v.model ILIKE $2 OR v.trim ILIKE $2 OR v.vin ILIKE $2)
    `;
    const countArgs = [q, term];
    const countR = await pool.query(countSql, countArgs);
    const total = countR.rows[0]?.count ?? 0;
    const totalPages = Math.max(Math.ceil(total / pageSize), 1);

    // Page of results
    const dataSql = `
      SELECT
        v.vin,
        v.make,
        v.model,
        v.trim,
        v.mileage,
        v.price,
        v.location,
        v.year    -- if this column truly doesn't exist for you, drop this line
      FROM vehicles v
      WHERE ($1 = '' OR v.make ILIKE $2 OR v.model ILIKE $2 OR v.trim ILIKE $2 OR v.vin ILIKE $2)
      ORDER BY v.vin ASC
      LIMIT $3 OFFSET $4
    `;
    const dataArgs = [q, term, pageSize, offset];
    const r = await pool.query(dataSql, dataArgs);

    // Normalize for the UI list
    const results = r.rows.map((row: any) => ({
      vin: row.vin,
      year: row.year ?? undefined,         // keep undefined-safe
      make: row.make ?? "",
      model: row.model ?? "",
      trim: row.trim ?? "",
      mileage: row.mileage ?? null,
      price: row.price ?? null,
      location: row.location ?? null,
      title: [
        row.year ? String(row.year) : null,
        row.make,
        row.model,
        row.trim,
      ]
        .filter(Boolean)
        .join(" "),
    }));

    return res.json({
      ok: true,
      query: { q, page, pageSize, dir: "asc" },
      count: results.length,
      total,
      totalPages,
      results,
    });
  } catch (e: any) {
    console.error("[search] error:", e);
    return res.status(500).json({ ok: false, error: e.message || "server_error" });
  }
});

export default router;

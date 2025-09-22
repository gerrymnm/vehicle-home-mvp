import { Router, Request, Response } from "express";
import pool from "./db";

const router = Router();

/**
 * GET /api/search?q=&page=&pagesize=
 * Never references "year" in SQL; selects * and normalizes.
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const q = String(req.query.q ?? "").trim();
    const page = Math.max(parseInt(String(req.query.page ?? "1"), 10) || 1, 1);
    const size = Math.min(Math.max(parseInt(String(req.query.pagesize ?? "20"), 10) || 20, 1), 50);
    const offset = (page - 1) * size;

    let rows: any[] = [];
    if (!q) {
      const r = await pool.query(
        `SELECT * FROM vehicles ORDER BY created_at DESC NULLS LAST OFFSET $1 LIMIT $2`,
        [offset, size]
      );
      rows = r.rows;
    } else {
      const like = `%${q}%`;
      // search only columns we know exist across sources: vin/make/model/trim
      const r = await pool.query(
        `
          SELECT * FROM vehicles
          WHERE vin ILIKE $1 OR make ILIKE $1 OR model ILIKE $1 OR trim ILIKE $1
          ORDER BY created_at DESC NULLS LAST
          OFFSET $2 LIMIT $3
        `,
        [like, offset, size]
      );
      rows = r.rows;
    }

    const toNum = (v: any) => (v == null ? null : Number(v));

    const results = rows.map((row) => ({
      vin: row.vin,
      title: [
        row.model_year ?? row["modelYear"] ?? row["yr"] ?? null,
        row.make,
        row.model,
        row.trim,
      ]
        .filter(Boolean)
        .join(" "),
      subtitle: [
        row.vin,
        toNum(row.mileage ?? row.odometer ?? row.miles ?? row.odometer_mi) != null
          ? `${toNum(row.mileage ?? row.odometer ?? row.miles ?? row.odometer_mi)?.toLocaleString()} miles`
          : null,
        row.location ?? (row.city && row.state ? `${row.city}, ${row.state}` : row.state ?? null),
      ]
        .filter(Boolean)
        .join(" • "),
      price: toNum(row.price ?? row.list_price ?? row.asking_price ?? row.msrp),
    }));

    return res.json({
      ok: true,
      q,
      page,
      pagesize: size,
      results,
      nextPage: rows.length === size ? page + 1 : null,
    });
  } catch (e: any) {
    console.error("[search] error:", e);
    return res.status(500).json({ ok: false, error: e.message || "server_error" });
  }
});

export default router;

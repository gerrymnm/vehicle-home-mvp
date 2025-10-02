// vehicle-backend/src/vehicles.ts
import { Router } from "express";
import type { Request, Response } from "express";
import { Pool } from "pg";

// --- DB pool ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.DATABASE_URL || process.env.DATABASE_URL,
  // Neon/Render usually require SSL
  ssl: process.env.PGSSL ? { rejectUnauthorized: false } : undefined,
});

type Vehicle = {
  vin: string;
  year: number;
  make: string;
  model: string;
  trim?: string | null;
  price?: number | null;
  mileage?: number | null;
  location?: string | null;
  condition?: string | null;
  keywords?: string | null;
  title?: string | null;
};

const router = Router();

/** Health under /api/health */
router.get("/health", async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`select count(*)::int as n from vehicles`);
    res.json({ ok: true, inventory: rows?.[0]?.n ?? 0, lastError: null });
  } catch (e: any) {
    res.json({ ok: true, inventory: 0, lastError: e?.message || String(e) });
  }
});

/** Search: /api/search?q=...&page=&pagesize=&dir=asc|desc */
router.get("/search", async (req: Request, res: Response) => {
  const q = (req.query.q as string) || "";
  const page = Math.max(parseInt(String(req.query.page || "1"), 10) || 1, 1);
  const pagesize = Math.min(
    Math.max(parseInt(String(req.query.pagesize || "20"), 10) || 20, 1),
    50
  );
  const dir = String(req.query.dir || "asc").toLowerCase() === "desc" ? "desc" : "asc";

  const where = q
    ? `where
        vin ilike $1 or
        make ilike $1 or
        model ilike $1 or
        trim ilike $1 or
        coalesce(title,'') ilike $1 or
        coalesce(keywords,'') ilike $1`
    : "";

  const params: any[] = [];
  if (q) params.push(`%${q}%`);

  try {
    const countSql = `select count(*)::int as n from vehicles ${where}`;
    const { rows: cntRows } = await pool.query(countSql, params);
    const total = cntRows?.[0]?.n ?? 0;
    const offset = (page - 1) * pagesize;

    const dataSql = `
      select vin, year, make, model, trim, price, mileage, location,
             condition, keywords,
             coalesce(title, concat(year, ' ', make, ' ', model, ' ', coalesce(trim,''))) as title
      from vehicles
      ${where}
      order by year ${dir}, make ${dir}, model ${dir}, vin ${dir}
      limit $${params.length + 1} offset $${params.length + 2}
    `;
    const { rows } = await pool.query(dataSql, [...params, pagesize, offset]);

    res.json({
      ok: true,
      query: { q, page, pagesize, dir },
      count: rows.length,
      total,
      totalPages: Math.max(Math.ceil(total / pagesize), 1),
      results: rows,
    });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
});

/** VDP: /api/vehicles/:vin */
router.get("/vehicles/:vin", async (req: Request, res: Response) => {
  const vin = String(req.params.vin || "").trim();
  if (!vin) return res.status(400).json({ ok: false, error: "VIN required" });

  try {
    const { rows } = await pool.query(
      `select vin, year, make, model, trim, price, mileage, location, condition, keywords,
              coalesce(title, concat(year, ' ', make, ' ', model, ' ', coalesce(trim,''))) as title
       from vehicles where vin = $1`,
      [vin]
    );
    if (!rows.length) return res.status(404).json({ ok: false, error: "Not found" });
    res.json({ ok: true, vehicle: rows[0] });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
});

/** INSERT helper */
async function upsertVehicle(v: Vehicle) {
  const title =
    v.title ||
    `${v.year ?? ""} ${v.make ?? ""} ${v.model ?? ""}${v.trim ? " " + v.trim : ""}`.trim();

  await pool.query(
    `
    insert into vehicles (vin, year, make, model, trim, price, mileage, location, condition, keywords, title)
    values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    on conflict (vin) do update set
      year=excluded.year,
      make=excluded.make,
      model=excluded.model,
      trim=excluded.trim,
      price=excluded.price,
      mileage=excluded.mileage,
      location=excluded.location,
      condition=excluded.condition,
      keywords=excluded.keywords,
      title=excluded.title
  `,
    [
      v.vin,
      v.year ?? null,
      v.make ?? null,
      v.model ?? null,
      v.trim ?? null,
      v.price ?? null,
      v.mileage ?? null,
      v.location ?? null,
      v.condition ?? null,
      v.keywords ?? null,
      title || null,
    ]
  );
}

/** Add single vehicle: POST /api/vehicles  (expects JSON Vehicle) */
router.post("/vehicles", async (req: Request, res: Response) => {
  const body = req.body as Vehicle;
  if (!body?.vin) return res.status(400).json({ ok: false, error: "vin required" });

  try {
    await upsertVehicle(body);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
});

/** Bulk ingest: POST /api/ingest  (expects { vehicles: Vehicle[] } or Vehicle[]) */
router.post("/ingest", async (req: Request, res: Response) => {
  const payload = Array.isArray(req.body) ? req.body : req.body?.vehicles;
  if (!Array.isArray(payload) || payload.length === 0) {
    return res.status(400).json({ ok: false, error: "Provide array of vehicles" });
  }
  try {
    for (const v of payload) {
      if (v?.vin) await upsertVehicle(v as Vehicle);
    }
    res.json({ ok: true, count: payload.length });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
});

export default router;

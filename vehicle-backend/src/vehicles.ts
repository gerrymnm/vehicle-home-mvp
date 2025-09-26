import { Router, type Request, type Response } from "express";
import pool from "./db";

const router = Router();

/** Safe helpers that don't crash if a table is missing (MVP-friendly). */
async function one<T = any>(sql: string, params: any[]): Promise<T | null> {
  try {
    const r = await pool.query(sql, params);
    return (r.rows[0] as T) ?? null;
  } catch (e) {
    return null;
  }
}
async function many<T = any>(sql: string, params: any[]): Promise<T[]> {
  try {
    const r = await pool.query(sql, params);
    return (r.rows as T[]) ?? [];
  } catch (e) {
    return [];
  }
}

/** Normalize DB row (or partial) into the Vehicle Home shape. */
function normalizeVehicle(r: any, vin: string) {
  const images: string[] = r?.images || r?.photos || [];
  const status = r?.in_stock === false ? "Unavailable" : "In stock";
  return {
    vin,
    year: r?.year ?? 0,
    make: r?.make ?? "",
    model: r?.model ?? "",
    trim: r?.trim ?? "",
    mileage: r?.mileage ?? 0,
    price: r?.price ?? null,
    location: r?.location ?? "",
    status,
    engine: r?.engine ?? null,
    transmission: r?.transmission ?? null,
    images,
  };
}

/** Optional fallbacks for known sample VINs so Vehicle Home always renders. */
function fallbackRow(vin: string) {
  const map: Record<string, any> = {
    "3MZBPACL4PM300002": {
      year: 2023, make: "Mazda", model: "Mazda3", trim: "Select",
      mileage: 5800, price: 23950, location: "Bay Area, CA", in_stock: true,
      engine: "2.5L I4", transmission: "Automatic", photos: []
    },
    "JM1BPBLL9M1300001": {
      year: 2021, make: "Mazda", model: "Mazda3", trim: "Preferred",
      mileage: 24500, price: 20995, location: "Marin County, CA", in_stock: true,
      engine: "2.5L I4", transmission: "Automatic", photos: []
    }
  };
  return map[vin] ?? null;
}

/**
 * GET /api/vehicles/:vin
 * Returns:
 * {
 *   ok: true,
 *   vehicle: {...},
 *   lien: {...}|null,
 *   history: [...],
 *   inspection: {...}|null,
 *   smog: {...}|null,
 *   nmvtis: {...}|null,
 *   ksr: {...}|null
 * }
 */
router.get("/:vin", async (req: Request, res: Response) => {
  const vin = String(req.params.vin);

  try {
    // Try DB first.
    let vrow = await one<any>("SELECT * FROM vehicles WHERE vin = $1 LIMIT 1", [vin]);

    // Fallback to a built-in seed if there is no table or row yet.
    if (!vrow) vrow = fallbackRow(vin);

    if (!vrow) {
      return res.status(404).json({ ok: false, error: "vehicle_not_found" });
    }

    const vehicle = normalizeVehicle(vrow, vin);

    // Pull optional related data—these calls are safe even if tables don't exist.
    const lien = await one<any>(
      "SELECT lender, amount_owed, per_diem, payoff_good_through, title_with, same_day_payoff " +
      "FROM liens WHERE vin = $1 ORDER BY created_at DESC LIMIT 1",
      [vin]
    );

    // Generic history table, payload is JSONB; filter on client.
    const history = await many<any>(
      "SELECT id, type, summary, payload, created_at " +
      "FROM events WHERE vin = $1 ORDER BY created_at DESC LIMIT 100",
      [vin]
    );

    const inspection = await one<any>(
      "SELECT tires, brakes, notes, created_at FROM inspections WHERE vin = $1 " +
      "ORDER BY created_at DESC LIMIT 1",
      [vin]
    );

    const smog = await one<any>(
      "SELECT status, date, station FROM smog WHERE vin = $1 ORDER BY date DESC LIMIT 1",
      [vin]
    );

    const nmvtis = await one<any>(
      "SELECT brands, theft, odometer_brand FROM nmvtis WHERE vin = $1 ORDER BY created_at DESC LIMIT 1",
      [vin]
    );

    const ksr = await one<any>(
      "SELECT data FROM ksr WHERE vin = $1 ORDER BY created_at DESC LIMIT 1",
      [vin]
    );

    return res.json({
      ok: true,
      vehicle,
      lien: lien ?? {
        hasLien: false,
        lender: null,
        amount_owed: null,
        per_diem: null,
        payoff_good_through: null,
        title_with: null,
        same_day_payoff: false,
      },
      history: history.map(h => ({
        id: h.id,
        type: h.type ?? "note",
        at: h.created_at,
        summary: h.summary ?? null,
        details: h.payload ?? null,
      })),
      inspection: inspection ?? { tires: null, brakes: null, notes: null },
      smog: smog ?? { status: "unknown", date: null, station: null },
      nmvtis: nmvtis ?? { brands: [], theft: false, odometer: "Unknown" },
      ksr: ksr?.data ?? null
    });
  } catch (e: any) {
    console.error("[vehicles] error:", e);
    return res.status(500).json({ ok: false, error: e?.message || "server_error" });
  }
});

export default router;

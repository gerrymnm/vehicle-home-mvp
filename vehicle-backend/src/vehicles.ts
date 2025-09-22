import { Router, Request, Response } from "express";
import pool from "./db";

const router = Router();

/**
 * GET /api/vehicles/:vin
 * Returns a normalized record for the VIN, regardless of column names
 * (e.g., model_year vs year, odometer vs mileage, photos vs images, etc).
 */
router.get("/:vin", async (req: Request, res: Response) => {
  try {
    const vin = String(req.params.vin || "").trim().toUpperCase();
    if (!vin) return res.status(400).json({ ok: false, error: "vin_required" });

    // Select all columns to avoid referencing a non-existent column like "year"
    const r = await pool.query(`SELECT * FROM vehicles WHERE vin = $1 LIMIT 1`, [vin]);
    const row = r.rows?.[0];
    if (!row) {
      return res.status(404).json({ ok: false, error: "not_found", vin });
    }

    // Helpers
    const toNum = (v: any) => (v == null ? null : Number(v));
    const toArr = (v: any) => {
      if (!v) return [];
      if (Array.isArray(v)) return v;
      if (typeof v === "string") {
        try {
          const parsed = JSON.parse(v);
          return Array.isArray(parsed) ? parsed : [v];
        } catch {
          // comma/space separated fallback
          return v.split(",").map((s: string) => s.trim()).filter(Boolean);
        }
      }
      return [];
    };

    // Normalize common fields from multiple possible source column names
    const normalized = {
      vin,
      year:
        row.year ??
        row.model_year ??
        row["modelYear"] ??
        row["yr"] ??
        null,

      make:
        row.make ??
        row.brand ??
        row["make_name"] ??
        row["make_display"] ??
        null,

      model:
        row.model ??
        row["model_name"] ??
        row["model_display"] ??
        null,

      trim:
        row.trim ??
        row.series ??
        row["series_name"] ??
        null,

      price: toNum(row.price ?? row.list_price ?? row.asking_price ?? row.msrp),

      mileage: toNum(row.mileage ?? row.odometer ?? row.miles ?? row.odometer_mi),

      transmission:
        row.transmission ??
        row.trans ??
        row.trans_desc ??
        null,

      engine:
        row.engine ??
        row.engine_desc ??
        row.engine_size ??
        null,

      ext_color:
        row.ext_color ??
        row.exterior_color ??
        row.color_exterior ??
        null,

      int_color:
        row.int_color ??
        row.interior_color ??
        row.color_interior ??
        null,

      location:
        row.location ??
        (row.city && row.state ? `${row.city}, ${row.state}` : row.state ?? null),

      status: row.status ?? "In stock",

      images: toArr(row.images ?? row.photos ?? row.image_urls ?? row.pictures),
    };

    // Placeholder history until the on-chain feed is wired
    const history: any[] = [];

    return res.json({ ok: true, vehicle: normalized, history });
  } catch (e: any) {
    console.error("[vehicles] load error:", e);
    return res.status(500).json({ ok: false, error: e.message || "server_error" });
  }
});

export default router;

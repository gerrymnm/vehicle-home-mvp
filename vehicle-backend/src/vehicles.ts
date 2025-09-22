import { Router, Request, Response } from "express";
import pool from "./db";

const router = Router();

/**
 * GET /api/vehicles/:vin
 * Selects * and normalizes in code so we never reference a non-existent SQL column.
 */
router.get("/:vin", async (req: Request, res: Response) => {
  try {
    const vin = String(req.params.vin || "").trim().toUpperCase();
    if (!vin) return res.status(400).json({ ok: false, error: "vin_required" });

    const r = await pool.query(`SELECT * FROM vehicles WHERE vin = $1 LIMIT 1`, [vin]);
    const row = r.rows?.[0];
    if (!row) return res.status(404).json({ ok: false, error: "not_found", vin });

    const toNum = (v: any) => (v == null ? null : Number(v));
    const toArr = (v: any) => {
      if (!v) return [];
      if (Array.isArray(v)) return v;
      if (typeof v === "string") {
        try {
          const parsed = JSON.parse(v);
          return Array.isArray(parsed) ? parsed : [v];
        } catch {
          return v.split(",").map((s: string) => s.trim()).filter(Boolean);
        }
      }
      return [];
    };

    const vehicle = {
      vin,
      year: row.model_year ?? row["modelYear"] ?? row["yr"] ?? row.year ?? null,
      make: row.make ?? row.brand ?? row.make_name ?? null,
      model: row.model ?? row.model_name ?? null,
      trim: row.trim ?? row.series ?? null,
      price: toNum(row.price ?? row.list_price ?? row.asking_price ?? row.msrp),
      mileage: toNum(row.mileage ?? row.odometer ?? row.miles ?? row.odometer_mi),
      transmission: row.transmission ?? row.trans ?? row.trans_desc ?? null,
      engine: row.engine ?? row.engine_desc ?? row.engine_size ?? null,
      ext_color: row.ext_color ?? row.exterior_color ?? row.color_exterior ?? null,
      int_color: row.int_color ?? row.interior_color ?? row.color_interior ?? null,
      location: row.location ?? (row.city && row.state ? `${row.city}, ${row.state}` : row.state ?? null),
      status: row.status ?? "In stock",
      images: toArr(row.images ?? row.photos ?? row.image_urls ?? row.pictures),
    };

    const history: any[] = []; // placeholder; blockchain feed later
    return res.json({ ok: true, vehicle, history });
  } catch (e: any) {
    console.error("[vehicles] load error:", e);
    return res.status(500).json({ ok: false, error: e.message || "server_error" });
  }
});

export default router;

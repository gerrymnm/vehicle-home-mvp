import { Router, Request, Response } from "express";
import { sql } from "./db"; // same import style used by your working /api/search route

const router = Router();

/**
 * GET /api/vehicles/:vin
 * Returns a single vehicle plus a (placeholder) history array.
 */
router.get("/:vin", async (req: Request, res: Response) => {
  const { vin } = req.params;

  try {
    // Avoid naming specific columns that may not exist on your table.
    // Grab everything and normalize in JS.
    const rows = await sql/*sql*/`
      SELECT * FROM vehicles
      WHERE vin = ${vin}
      LIMIT 1
    `;

    if (!rows || rows.length === 0) {
      return res.status(404).json({ ok: false, error: "Vehicle not found" });
    }

    const r: any = rows[0];

    // Normalize column names that might differ by schema
    // Prefer "year", otherwise fall back to "model_year" if present.
    const normalized = {
      vin: r.vin,
      year: r.year ?? r.model_year ?? null,
      make: r.make ?? null,
      model: r.model ?? null,
      trim: r.trim ?? null,
      mileage: r.mileage ?? null,
      price: r.price ?? null,
      location: r.location ?? null,
      status: r.status ?? null,
      transmission: r.transmission ?? r.trans ?? null,
      engine: r.engine ?? null,
      drive_type: r.drive_type ?? r.drivetrain ?? null,
      fuel_type: r.fuel_type ?? null,
      ext_color: r.ext_color ?? r.exterior_color ?? null,
      int_color: r.int_color ?? r.interior_color ?? null,
      images: r.images ?? r.photos ?? [],
    };

    // Placeholder: you’ll swap this for on-chain history soon.
    const history: any[] = [];

    return res.json({ ok: true, vehicle: normalized, history });
  } catch (e: any) {
    console.error("[vehicles] load error:", e);
    return res.status(500).json({ ok: false, error: e?.message || "Server error" });
  }
});

export default router;

// vehicle-backend/src/vehicles.ts
import { Router, Request, Response } from "express";
import { sql } from "./db";

const router = Router();

/** Convert any DB row into the shape the UI expects */
function normalizeRow(r: any) {
  const year =
    Number(r?.year ?? r?.model_year ?? r?.y ?? r?.yyyy ?? 0) || undefined;
  const make = String(r?.make ?? r?.mk ?? "").trim() || undefined;
  const model = String(r?.model ?? r?.mdl ?? "").trim() || undefined;
  const trim = String(r?.trim ?? r?.series ?? "").trim() || undefined;

  const mileage = Number(r?.mileage ?? r?.odometer ?? r?.miles ?? 0) || 0;
  const price = Number(r?.price ?? r?.ask ?? r?.list_price ?? 0) || 0;
  const location =
    String(r?.location ?? r?.loc ?? r?.city_state ?? r?.city ?? "")
      .trim() || undefined;

  // ----- FIX: compute in_stock without “never nullish” pattern -----
  const rawStatus =
    r?.in_stock ??
    r?.available ??
    (r?.status != null
      ? String(r.status).toLowerCase() === "in_stock"
      : undefined);
  const in_stock = rawStatus ?? true; // default to true when unknown
  // -----------------------------------------------------------------

  const interior_color = r?.int_color ?? r?.interior_color ?? null;

  const images: string[] = Array.isArray(r?.images)
    ? r.images
    : Array.isArray(r?.photos)
    ? r.photos
    : typeof r?.image === "string"
    ? [r.image]
    : [];

  const vin = String(r?.vin ?? "").toUpperCase();

  const titleParts = [year, make, model, trim].filter(Boolean);
  const title = titleParts.join(" ").trim();

  return {
    vin,
    year,
    make,
    model,
    trim,
    mileage,
    price,
    location,
    in_stock,
    int_color: interior_color ?? null,
    images,
    title,
  };
}

/** GET /api/vehicles/:vin */
router.get("/:vin", async (req: Request, res: Response) => {
  try {
    const vin = String(req.params.vin || "").toUpperCase();
    if (!vin) return res.status(400).json({ ok: false, error: "vin_required" });

    // select * and normalize in code to avoid column-name drift issues
    const rows: any[] = await sql`
      SELECT * FROM vehicles WHERE vin = ${vin} LIMIT 1
    `;

    if (!rows || rows.length === 0) {
      return res.status(404).json({ ok: false, error: "not_found" });
    }

    const vehicle = normalizeRow(rows[0]);
    return res.json({ ok: true, vehicle });
  } catch (e: any) {
    console.error("[vehicles/:vin] error:", e);
    return res
      .status(500)
      .json({ ok: false, error: e?.message || "server_error" });
  }
});

/** GET /api/vehicles/:vin/photos (mock) */
router.get("/:vin/photos", async (_req: Request, res: Response) => {
  const photos: string[] = [];
  return res.json({ ok: true, count: photos.length, photos });
});

/** GET /api/vehicles/:vin/history?type=all|maintenance|accident|ownership (mock) */
router.get("/:vin/history", async (req: Request, res: Response) => {
  const vin = String(req.params.vin || "").toUpperCase();
  const type = String(req.query.type || "all");
  const events: any[] = [];
  const filtered =
    type === "all" ? events : events.filter((e) => String(e.type) === type);
  return res.json({ ok: true, vin, type, count: filtered.length, events: filtered });
});

export default router;

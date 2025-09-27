import { Router, Request, Response } from "express";
import { sql } from "./db";            // ✅ use the named export 'sql' from ./db
import type { QueryResult } from "pg"; // ✅ get QueryResult type from 'pg'

/**
 * Vehicles API
 * - GET /api/vehicles/:vin                 -> summary details
 * - GET /api/vehicles/:vin/photos          -> up to 100 photo URLs (mock for now)
 * - GET /api/vehicles/:vin/history?type=   -> maintenance | accident | ownership | all (default)
 */

const router = Router();

/** Normalize a DB row (or plain object) into our frontend shape. */
function normalizeRow(r: any) {
  return {
    vin: r.vin,
    year: Number(r.year) || r.year,
    make: r.make,
    model: r.model,
    trim: r.trim ?? "",
    mileage: Number(r.mileage) || 0,
    price: Number(r.price) || null,
    location: r.location ?? "",
    status: r.in_stock ? "In stock" : "Unknown",
    images: Array.isArray(r.images) ? r.images : [],
  };
}

/** ---- MOCKS for Photos & History (until real providers are wired) ---- */

type Photo = { url: string; caption?: string };
type HistoryEvent = {
  id: string;
  type: "maintenance" | "accident" | "ownership";
  at: string; // ISO date
  title: string;
  detail?: string;
};

const PHOTOS: Record<string, Photo[]> = {
  "3MZBPACL4PM300002": [
    { url: "https://images.unsplash.com/photo-1542367597-8849ebee0df6?q=80&w=1200&auto=format&fit=crop", caption: "Front 3/4" },
    { url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200&auto=format&fit=crop", caption: "Side" },
    { url: "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?q=80&w=1200&auto=format&fit=crop", caption: "Interior" },
  ],
  "JM1BPBLL9M1300001": [
    { url: "https://images.unsplash.com/photo-1517940310602-75c2c068f9ae?q=80&w=1200&auto=format&fit=crop", caption: "Front" },
    { url: "https://images.unsplash.com/photo-1549921296-3b4a4f3f3a5a?q=80&w=1200&auto=format&fit=crop", caption: "Rear" },
  ],
};

const HISTORY: Record<string, HistoryEvent[]> = {
  "3MZBPACL4PM300002": [
    { id: "h1", type: "ownership",  at: "2024-01-12", title: "Title issued",           detail: "First owner reported" },
    { id: "h2", type: "maintenance",at: "2024-07-18", title: "Scheduled maintenance",  detail: "5k service: engine oil & filter" },
  ],
  "JM1BPBLL9M1300001": [
    { id: "h3", type: "maintenance",at: "2023-11-03", title: "Brake inspection",       detail: "Front pads 8mm, rear pads 7mm" },
    { id: "h4", type: "accident",   at: "2024-03-22", title: "Minor damage reported",  detail: "Right rear cosmetic repair" },
    { id: "h5", type: "ownership",  at: "2024-04-05", title: "Title updated",          detail: "Owner change recorded" },
  ],
};

/** -------------------------- Routes -------------------------- */

/** Vehicle summary */
router.get("/:vin", async (req: Request, res: Response) => {
  try {
    const vin = req.params.vin;
    let row: any | null = null;

    try {
      const q = await sql`
        SELECT *
        FROM vehicles
        WHERE vin = ${vin}
        LIMIT 1
      `;
      row = (q as QueryResult<any>).rows?.[0] ?? null;
    } catch {
      row = null; // table may not exist in demo DB; fall back below
    }

    if (!row) {
      const demo: Record<string, any> = {
        "3MZBPACL4PM300002": {
          vin,
          year: 2023,
          make: "Mazda",
          model: "Mazda3",
          trim: "Select",
          mileage: 5800,
          price: 23950,
          location: "Bay Area, CA",
          in_stock: true,
        },
        "JM1BPBLL9M1300001": {
          vin,
          year: 2021,
          make: "Mazda",
          model: "Mazda3",
          trim: "Preferred",
          mileage: 24500,
          price: 20995,
          location: "Marin County, CA",
          in_stock: true,
        },
      };
      row = demo[vin] ?? { vin, in_stock: false };
    }

    const vehicle = normalizeRow(row);
    return res.json({ ok: true, vehicle, history: [] });
  } catch (e: any) {
    console.error("[vehicles] load error:", e);
    return res.status(500).json({ ok: false, error: e?.message ?? "Server error" });
  }
});

/** Vehicle photos (mocked) */
router.get("/:vin/photos", async (req: Request, res: Response) => {
  const vin = req.params.vin;
  const photos = PHOTOS[vin] ?? [];
  return res.json({ ok: true, count: photos.length, photos: photos.slice(0, 100) });
});

/** Vehicle history with filter */
router.get("/:vin/history", async (req: Request, res: Response) => {
  const vin = req.params.vin;
  const type = String(req.query.type ?? "all") as "all" | "maintenance" | "accident" | "ownership";
  let items = HISTORY[vin] ?? [];
  if (type !== "all") items = items.filter((e) => e.type === type);
  items = items.slice().sort((a, b) => (a.at < b.at ? 1 : -1)); // newest first
  return res.json({ ok: true, type, count: items.length, events: items });
});

export default router;

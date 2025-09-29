// Full file: vehicle-backend/src/vehicles.ts
import { Router, Request, Response } from "express";
import { sql } from "./db"; // your existing tiny DB helper (Neon or pg), already used by /search
const router = Router();

/**
 * Helper: normalize a DB row (or mock) into a common vehicle shape for UI.
 * Adjust fields as needed to match your DB columns.
 */
function normalizeRow(r: any) {
  // common marketplace fields
  const mileage = Number(r.mileage ?? r.odometer ?? r.miles ?? 0) || 0;
  const price = Number(r.price ?? r.ask ?? r.list_price ?? 0) || 0;
  const location = String(
    (r.location ?? r.loc ?? r.city_state ?? r.city ?? "") as string
  )
    .trim() || undefined;

  // "in_stock" can come from several flags; default to true when not present
  const in_stock =
    r.in_stock ? true : r.available ? true : r.status === "in_stock" ? true : false;

  // optional misc mappings
  const interior_color = r.int_color ?? r.interior_color ?? null;
  const images: string[] = Array.isArray(r.images) ? r.images : Array.isArray(r.photos) ? r.photos : [];

  return {
    vin: String(r.vin ?? r.VIN ?? "").trim(),
    year: Number(r.year ?? 0) || undefined,
    make: r.make ?? "",
    model: r.model ?? "",
    trim: r.trim ?? "",
    mileage,
    price,
    location,
    status: in_stock ? "in stock" : "not in stock",
    images,
    // fields the VDP uses in its header:
    title: r.title ?? [r.year, r.make, r.model, r.trim].filter(Boolean).join(" "),
  };
}

/**
 * ---------------------------
 *  SEARCH
 * ---------------------------
 * GET /api/vehicles/search?q=...&page=1&pagesize=20
 * Uses your existing SQL helper (works with Render).
 */
router.get("/search", async (req: Request, res: Response) => {
  try {
    const q = String(req.query.q ?? "").trim();
    const page = Math.max(1, Number(req.query.page ?? 1));
    const pagesize = Math.min(50, Math.max(1, Number(req.query.pagesize ?? 20)));

    // Basic text search across a few columns. Adjust to your schema.
    const offset = (page - 1) * pagesize;

    const rows = await sql/* sql */`
      SELECT
        vin, year, make, model, trim, mileage, price, location, status
      FROM vehicles
      WHERE
        (${q} = '' )
        OR (make ILIKE ${"%" + q + "%"})
        OR (model ILIKE ${"%" + q + "%"})
        OR (trim ILIKE ${"%" + q + "%"})
        OR (vin ILIKE ${"%" + q + "%"})
      ORDER BY year DESC, make ASC, model ASC
      LIMIT ${pagesize} OFFSET ${offset};
    `;

    // total count for pagination (optional; simple estimate if desired)
    const countRow = await sql/* sql */`
      SELECT COUNT(*)::int AS count
      FROM vehicles
      WHERE
        (${q} = '' )
        OR (make ILIKE ${"%" + q + "%"})
        OR (model ILIKE ${"%" + q + "%"})
        OR (trim ILIKE ${"%" + q + "%"})
        OR (vin ILIKE ${"%" + q + "%"});
    `;
    const total = Number(countRow[0]?.count ?? 0);

    const results = rows.map(normalizeRow);

    return res.json({
      ok: true,
      query: { q, page, pagesize, dir: "desc" },
      count: results.length,
      total,
      totalPages: Math.max(1, Math.ceil(total / pagesize)),
      results,
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err?.message ?? "Search failed" });
  }
});

/**
 * ---------------------------
 *  VEHICLE DETAILS
 * ---------------------------
 * GET /api/vehicles/:vin
 * Return one normalized vehicle row.
 */
router.get("/:vin", async (req: Request, res: Response) => {
  try {
    const vin = String(req.params.vin).trim();
    if (!vin) return res.status(400).json({ ok: false, error: "VIN required" });

    const rows = await sql/* sql */`
      SELECT
        vin, year, make, model, trim, mileage, price, location, status
      FROM vehicles
      WHERE vin = ${vin}
      LIMIT 1;
    `;

    if (!rows?.length) {
      // allow the VDP to render with minimal info (still ok:true)
      return res.json({
        ok: true,
        vehicle: {
          vin,
          title: vin,
          status: "not in stock",
          images: [],
        },
      });
    }

    const vehicle = normalizeRow(rows[0]);
    return res.json({ ok: true, vehicle });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err?.message ?? "Lookup failed" });
  }
});

/**
 * ---------------------------
 *  MOCKED PHOTOS
 * ---------------------------
 * GET /api/vehicles/vin/photos?vin=...
 * Always 200; returns [] if none.
 */
const PHOTOS: Record<string, string[]> = {
  // demo VINs you've been using
  "3MZBPACL4PM300002": [
    "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1200&q=60",
    "https://images.unsplash.com/photo-1549921296-3ecf4a8b0a63?auto=format&fit=crop&w=1200&q=60",
  ],
  "JM1BPBLL9M1300001": [
    "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=60",
  ],
};

router.get("/vin/photos", async (req: Request, res: Response) => {
  const vin = String(req.query.vin ?? req.params?.vin ?? "").trim();
  const photos = PHOTOS[vin] ?? [];
  return res.json({ ok: true, count: photos.length, photos, photos_preview: photos.slice(0, 100) });
});

/**
 * ---------------------------
 *  MOCKED HISTORY
 * ---------------------------
 * GET /api/vehicles/vin/history?vin=...&type=all|maintenance|accident|ownership
 * Always 200; returns empty list if none. Sorted newest first.
 */
type HistoryType = "maintenance" | "accident" | "ownership";
type HistoryEvent = {
  id: string;
  type: HistoryType;
  at: string; // ISO date
  title: string;
  notes?: string;
  odometer?: number;
};

const HISTORY: Record<string, HistoryEvent[]> = {
  "3MZBPACL4PM300002": [
    {
      id: "h1",
      type: "ownership",
      at: "2024-03-12T10:00:00Z",
      title: "Title issued / First owner reported",
      notes: "CA DMV",
    },
    {
      id: "h2",
      type: "maintenance",
      at: "2024-08-05T09:00:00Z",
      title: "5k service performed",
      odometer: 5100,
      notes: "Oil/filter change; multi-point inspection",
    },
  ],
  "JM1BPBLL9M1300001": [
    {
      id: "m1",
      type: "maintenance",
      at: "2023-06-10T12:00:00Z",
      title: "Routine maintenance",
      odometer: 22000,
    },
  ],
};

router.get("/vin/history", async (req: Request, res: Response) => {
  const vin = String(req.query.vin ?? req.params?.vin ?? "").trim();
  const type = String(req.query.type ?? "all").toLowerCase() as "all" | HistoryType;

  let items: HistoryEvent[] = Array.isArray(HISTORY[vin]) ? [...HISTORY[vin]] : [];

  if (type !== "all") {
    items = items.filter((e) => e.type === type);
  }

  // newest first
  items.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));

  return res.json({
    ok: true,
    type,
    count: items.length,
    events: items,
  });
});

export default router;

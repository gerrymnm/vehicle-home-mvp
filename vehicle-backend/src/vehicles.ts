// Full file: vehicle-backend/src/vehicles.ts
import { Router, Request, Response } from "express";
import { sql } from "./db";

const router = Router();

/** Normalize a DB row (or mock) into the UI shape. */
function normalizeRow(r: any) {
  const mileage = Number(r?.mileage ?? r?.odometer ?? r?.miles ?? 0) || 0;
  const price = Number(r?.price ?? r?.ask ?? r?.list_price ?? 0) || 0;
  const location = String(r?.location ?? r?.loc ?? r?.city_state ?? r?.city ?? "")
    .trim() || undefined;

  // Derive stock status from whatever flags exist (all optional)
  const isInStock =
    (r?.in_stock ? true : false) ||
    (r?.available ? true : false) ||
    (r?.status === "in_stock");

  const images: string[] = Array.isArray(r?.images)
    ? r.images
    : Array.isArray(r?.photos)
    ? r.photos
    : [];

  const year = r?.year != null ? Number(r.year) : undefined;

  return {
    vin: String(r?.vin ?? r?.VIN ?? "").trim(),
    year,
    make: r?.make ?? "",
    model: r?.model ?? "",
    trim: r?.trim ?? "",
    mileage,
    price,
    location,
    status: isInStock ? "in stock" : "not in stock",
    images,
    title: r?.title ?? [year, r?.make, r?.model, r?.trim].filter(Boolean).join(" "),
  };
}

/* ---------------------------
   SEARCH
   GET /api/vehicles/search?q=&page=&pagesize=
--------------------------- */
router.get("/search", async (req: Request, res: Response) => {
  try {
    const q = String(req.query.q ?? "").trim();
    const page = Math.max(1, Number(req.query.page ?? 1));
    const pagesize = Math.min(50, Math.max(1, Number(req.query.pagesize ?? 20)));
    const offset = (page - 1) * pagesize;

    // Select * to avoid missing-column errors across environments.
    const rows = await sql/* sql */`
      SELECT * FROM vehicles
      WHERE
        (${q} = '')
        OR (make  ILIKE ${"%" + q + "%"})
        OR (model ILIKE ${"%" + q + "%"})
        OR (trim  ILIKE ${"%" + q + "%"})
        OR (vin   ILIKE ${"%" + q + "%"})
      ORDER BY year DESC NULLS LAST, make ASC, model ASC
      LIMIT ${pagesize} OFFSET ${offset};
    `;

    const countRow = await sql/* sql */`
      SELECT COUNT(*)::int AS count
      FROM vehicles
      WHERE
        (${q} = '')
        OR (make  ILIKE ${"%" + q + "%"})
        OR (model ILIKE ${"%" + q + "%"})
        OR (trim  ILIKE ${"%" + q + "%"})
        OR (vin   ILIKE ${"%" + q + "%"});
    `;

    const total = Number(countRow?.[0]?.count ?? 0);
    const results = (rows ?? []).map(normalizeRow);

    return res.json({
      ok: true,
      query: { q, page, pagesize, dir: "desc" },
      count: results.length,
      total,
      totalPages: Math.max(1, Math.ceil(total / pagesize)),
      results,
    });
  } catch (err: any) {
    return res
      .status(500)
      .json({ ok: false, error: err?.message ?? "Search failed" });
  }
});

/* ---------------------------
   VEHICLE DETAILS
   GET /api/vehicles/:vin
--------------------------- */
router.get("/:vin", async (req: Request, res: Response) => {
  try {
    const vin = String(req.params.vin ?? "").trim();
    if (!vin) return res.status(400).json({ ok: false, error: "VIN required" });

    const rows = await sql/* sql */`
      SELECT * FROM vehicles
      WHERE vin = ${vin}
      LIMIT 1;
    `;

    if (!rows?.length) {
      // Return minimal shell so the VDP can still render
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
    return res
      .status(500)
      .json({ ok: false, error: err?.message ?? "Lookup failed" });
  }
});

/* ---------------------------
   MOCKED PHOTOS
   GET /api/vehicles/vin/photos?vin=...
--------------------------- */
const PHOTOS: Record<string, string[]> = {
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
  return res.json({
    ok: true,
    count: photos.length,
    photos,
    photos_preview: photos.slice(0, 100),
  });
});

/* ---------------------------
   MOCKED HISTORY
   GET /api/vehicles/vin/history?vin=...&type=all|maintenance|accident|ownership
--------------------------- */
type HistoryType = "maintenance" | "accident" | "ownership";
type HistoryEvent = {
  id: string;
  type: HistoryType;
  at: string;
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
  const type = String(req.query.type ?? "all").toLowerCase() as
    | "all"
    | HistoryType;

  let items: HistoryEvent[] = Array.isArray(HISTORY[vin]) ? [...HISTORY[vin]] : [];
  if (type !== "all") items = items.filter((e) => e.type === type);
  items.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));

  return res.json({ ok: true, type, count: items.length, events: items });
});

export default router;

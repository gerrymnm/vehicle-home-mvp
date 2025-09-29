// vehicle-backend/src/vehicles.ts
import { Router, Request, Response } from "express";

// ------------ Config ------------
const CSV_URL =
  process.env.INVENTORY_CSV ||
  "https://docs.google.com/spreadsheets/d/12oHSYTIMAprpCoK7cnwY7D6kYAOpqDdjV_am-xPC31s/export?format=csv&gid=0";

const REFRESH_MS = Number(process.env.INVENTORY_REFRESH_MS || 10 * 60 * 1000); // 10m
// --------------------------------

type InvRow = {
  vin: string;
  year?: number;
  make?: string;
  model?: string;
  trim?: string;
  mileage?: number;
  location?: string;
  price?: number;
  status?: string; // "in stock" | "not in stock" | etc
  images?: string[];
  // keep raw in case we add properties later
  [k: string]: any;
};

const router = Router();
let INVENTORY: InvRow[] = [];
let lastLoad = 0;
let lastError: string | null = null;

// --- tiny CSV parser robust enough for quoted fields with commas ---
function splitCSVLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      // toggle or escaped quote
      if (inQ && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQ = !inQ;
      }
    } else if (ch === "," && !inQ) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function asNum(v: any): number | undefined {
  if (v === null || v === undefined || v === "") return undefined;
  const n = Number(String(v).replace(/[,$]/g, "").trim());
  return Number.isFinite(n) ? n : undefined;
}

function normalizeRow(raw: Record<string, any>): InvRow {
  const lc: Record<string, any> = {};
  for (const [k, v] of Object.entries(raw)) lc[k.toLowerCase()] = v;

  // Accept lots of header spellings
  const vin = (lc.vin || lc["vin#"] || lc["vehicle identification number"] || lc.id || "").toString().trim();

  const year = asNum(lc.year);
  const make = (lc.make || lc.brand || "").toString().trim() || undefined;
  const model = (lc.model || "").toString().trim() || undefined;
  const trim = (lc.trim || lc.submodel || "").toString().trim() || undefined;

  const mileage = asNum(lc.mileage ?? lc.odometer ?? lc.miles);
  const price = asNum(lc.price ?? lc.ask ?? lc.list_price ?? lc.msrp);

  const location =
    (lc.location ||
      [lc.loc, lc.city, lc.state].filter(Boolean).join(", "))?.toString().trim() || undefined;

  // Status: accept several signals; default to "in stock" if sheet says available
  let status = (lc.status || lc.availability || lc.available)?.toString().trim().toLowerCase();
  if (status === "true" || status === "yes" || status === "available") status = "in stock";
  if (!status) status = "in stock";

  // Images: allow comma/semicolon/pipe separated
  const imagesRaw = (lc.images || lc.photos || "").toString();
  const images =
    imagesRaw
      .split(/[,;|]\s*/)
      .map((s: string) => s.trim())
      .filter(Boolean) || [];

  // Title (fallback)
  const title =
    lc.title ||
    [year, make, model, trim].filter(Boolean).join(" ").trim();

  return {
    vin,
    year,
    make,
    model,
    trim,
    mileage,
    location,
    price,
    status,
    images,
    title,
    _raw: raw,
  } as InvRow;
}

async function loadInventoryFromCSV(): Promise<InvRow[]> {
  if (!CSV_URL) throw new Error("INVENTORY_CSV env var is not set");
  const res = await fetch(CSV_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch CSV (${res.status} ${res.statusText})`);
  }
  const text = await res.text();

  const lines = text
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0);

  if (lines.length === 0) return [];

  const headers = splitCSVLine(lines[0]).map((h) => h.trim());
  const rows: InvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCSVLine(lines[i]);
    const raw: Record<string, string> = {};
    headers.forEach((h, idx) => {
      raw[h] = cols[idx] ?? "";
    });
    const norm = normalizeRow(raw);
    if (norm.vin) rows.push(norm);
  }
  return rows;
}

async function ensureInventory(force = false) {
  const now = Date.now();
  if (force || now - lastLoad > REFRESH_MS || INVENTORY.length === 0) {
    try {
      const data = await loadInventoryFromCSV();
      INVENTORY = data;
      lastLoad = now;
      lastError = null;
      console.log(`[inventory] loaded ${INVENTORY.length} rows from CSV`);
    } catch (e: any) {
      lastError = e?.message || String(e);
      console.error("[inventory] load error:", lastError);
    }
  }
}

// initial load (non-blocking)
ensureInventory(true);
// background refresher
setInterval(() => ensureInventory(false), REFRESH_MS);

// -------------------- Routes --------------------

// Health under /api
router.get("/health", (_req: Request, res: Response) => {
  res.json({ ok: true, inventory: INVENTORY.length, lastError });
});

// SEARCH: /api/search  (accepts q, page, pagesize, dir)
router.get("/search", async (req: Request, res: Response) => {
  await ensureInventory(false);

  try {
    const q = String(req.query.q ?? "").trim().toLowerCase();
    const page = Math.max(1, Number(req.query.page || 1));
    const pagesize = Math.min(50, Math.max(1, Number(req.query.pagesize || 20)));

    let source = INVENTORY;

    if (q) {
      source = source.filter((r) => {
        const hay = [
          r.vin,
          r.make,
          r.model,
          r.trim,
          r.location,
          r.status,
          r.year?.toString(),
          r.price?.toString(),
          r.mileage?.toString(),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }

    const total = source.length;
    const totalPages = Math.max(1, Math.ceil(total / pagesize));
    const start = (page - 1) * pagesize;
    const results = source.slice(start, start + pagesize);

    res.json({
      ok: true,
      results,
      count: results.length,
      total,
      totalPages,
      page,
      pagesize,
      lastError,
    });
  } catch (e: any) {
    res.status(200).json({ ok: false, error: e?.message || String(e) });
  }
});

// VDP: /api/vehicles/:vin
router.get("/vehicles/:vin", async (req: Request, res: Response) => {
  await ensureInventory(false);

  const vin = String(req.params.vin);
  const found = INVENTORY.find((r) => r.vin === vin);
  if (!found) return res.json({ ok: false, error: "Not found" });
  res.json({ ok: true, vehicle: found });
});

// Photos: /api/vehicles/:vin/photos
router.get("/vehicles/:vin/photos", async (req: Request, res: Response) => {
  await ensureInventory(false);

  const vin = String(req.params.vin);
  const found = INVENTORY.find((r) => r.vin === vin);
  const photos = found?.images ?? [];
  res.json({ ok: true, photos, count: photos.length });
});

// History: /api/vin/history?vin=...
router.get("/vin/history", async (req: Request, res: Response) => {
  // No external history yet—return empty.
  res.json({ ok: true, type: "all", count: 0, events: [] });
});

export default router;

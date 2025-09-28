// vehicle-backend/src/vehicles.ts
import { Router, Request, Response } from "express";

/**
 * This router provides:
 *   GET /api/vehicles/:vin
 *   GET /api/vehicles/:vin/photos         (mock)
 *   GET /api/vehicles/:vin/history?type=  (mock)
 *
 * If you later have a real DB, swap the loader in getVehicleByVin().
 */

const router = Router();

// --- Mock data loader that matches the search results you already show ---
type VehicleRow = {
  vin: string;
  year?: number;
  make?: string;
  model?: string;
  trim?: string;
  mileage?: number;
  price?: number;
  location?: string;
  in_stock?: boolean;
  status?: string;
};

const MOCK_ROWS: VehicleRow[] = [
  {
    vin: "3MZBPACL4PM300002",
    year: 2023,
    make: "Mazda",
    model: "Mazda3",
    trim: "Select",
    mileage: 5800,
    price: 23950,
    location: "Bay Area, CA",
    in_stock: true,
    status: "in_stock",
  },
  {
    vin: "JM1BPBLL9M1300001",
    year: 2021,
    make: "Mazda",
    model: "Mazda3",
    trim: "Preferred",
    mileage: 24500,
    price: 20995,
    location: "Marin County, CA",
    in_stock: true,
    status: "in_stock",
  },
];

function getVehicleByVin(vin: string): VehicleRow | null {
  const row = MOCK_ROWS.find(v => v.vin === vin);
  return row ?? null;
}

function normalizeRow(r: VehicleRow) {
  const mileage = Number(r.mileage ?? 0) || 0;
  const price = Number(r.price ?? 0) || 0;
  const location = (r.location ?? "").toString().trim() || undefined;
  const in_stock = r.in_stock ?? (r.status === "in_stock" ? true : false);

  return {
    vin: r.vin,
    year: r.year ?? null,
    make: r.make ?? null,
    model: r.model ?? null,
    trim: r.trim ?? null,
    mileage,
    price,
    location,
    status: in_stock ? "in_stock" : "out_of_stock",
    int_color: null as string | null,
    images: [] as string[],
  };
}

// GET /api/vehicles/:vin
router.get("/:vin", async (req: Request, res: Response) => {
  try {
    const vin = req.params.vin;
    const row = getVehicleByVin(vin);
    if (!row) {
      return res.status(404).json({ ok: false, error: "not_found" });
    }
    const vehicle = normalizeRow(row);
    return res.json({ ok: true, vehicle });
  } catch (e: any) {
    console.error("vehicle load error:", e);
    return res.status(500).json({ ok: false, error: e?.message ?? "server_error" });
  }
});

// GET /api/vehicles/:vin/photos  (mock)
router.get("/:vin/photos", async (req: Request, res: Response) => {
  const vin = req.params.vin;
  const photos =
    vin === "3MZBPACL4PM300002"
      ? [
          "https://images.unsplash.com/photo-1549921296-3a6b324d1954?q=80&w=1400&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1555215695-3004980ad54e?q=80&w=1400&auto=format&fit=crop",
        ]
      : [];
  res.json({ ok: true, count: photos.length, photos });
});

// GET /api/vehicles/:vin/history?type=all|maintenance|accident|ownership  (mock)
router.get("/:vin/history", async (_req: Request, res: Response) => {
  res.json({ ok: true, type: "all", count: 0, events: [] });
});

export default router;

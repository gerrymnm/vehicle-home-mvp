// ===== Types =====
export type Vehicle = {
  vin: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  mileage?: number;
  price?: number;
  location?: string; // e.g., "San Rafael, CA"
  inStock?: boolean; // true => available, false => sold/removed
};

export type VehicleEventType =
  | "import"
  | "upsert"
  | "patch"
  | "price_change"
  | "mileage_update"
  | "sold"
  | "delete";

export type VehicleEvent = {
  id: string;
  vin: string;
  type: VehicleEventType;
  timestamp: string; // ISO
  note?: string;
  payload?: any;
};

export type QueryOptions = {
  q?: string;
  make?: string;
  model?: string;
  trim?: string;
  yearMin?: number;
  yearMax?: number;
  priceMin?: number;
  priceMax?: number;
  mileageMin?: number;
  mileageMax?: number;
  sort?: string; // vin, year, make, model, price, mileage
  dir?: "asc" | "desc";
  page?: number; // 1-based
  pageSize?: number;
  includeOutOfStock?: boolean;
};

export type MetricsQuery = {
  make?: string;
  model?: string;
  trim?: string;
  includeOutOfStock?: boolean;
};

export type MetricsSummary = {
  filters: { make?: string; model?: string; trim?: string };
  count: number;
  avgPrice?: number;
  minPrice?: number;
  maxPrice?: number;
  avgMileage?: number;
  minMileage?: number;
  maxMileage?: number;
  trend: "up" | "down" | "flat";
  trendSamples: number;
};

// ===== In-memory "DB" =====
const VEHICLES: Vehicle[] = [
  {
    vin: "JM1BPBLL9M1300001",
    year: 2021,
    make: "Mazda",
    model: "Mazda3",
    trim: "Preferred",
    mileage: 24500,
    price: 20995,
    location: "Marin County, CA",
    inStock: true
  },
  {
    vin: "5J6TF3H33CL003984",
    year: 2012,
    make: "Honda",
    model: "Accord",
    trim: "EX",
    mileage: 98650,
    price: 9995,
    location: "South San Francisco, CA",
    inStock: true
  },
  {
    vin: "3MZBPACL4PM300002",
    year: 2023,
    make: "Mazda",
    model: "Mazda3",
    trim: "Select",
    mileage: 5800,
    price: 23950,
    location: "Bay Area, CA",
    inStock: true
  }
];

const EVENTS: VehicleEvent[] = [];

// ===== Helpers =====
function nowIso(): string {
  return new Date().toISOString();
}

function makeId(prefix: string = "evt"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;
}

function matches(v: Vehicle, s: string): boolean {
  if (!s) return true;
  const q = s.toLowerCase();
  return (
    v.vin.toLowerCase().includes(q) ||
    String(v.year).includes(q) ||
    v.make.toLowerCase().includes(q) ||
    v.model.toLowerCase().includes(q) ||
    (v.trim ? v.trim.toLowerCase().includes(q) : false)
  );
}

function applyFilters(v: Vehicle, o: QueryOptions): boolean {
  if (o.make && v.make.toLowerCase() !== o.make.toLowerCase()) return false;
  if (o.model && v.model.toLowerCase() !== o.model.toLowerCase()) return false;
  if (o.trim && (v.trim ?? "").toLowerCase() !== o.trim.toLowerCase()) return false;

  if (o.yearMin !== undefined && v.year < o.yearMin) return false;
  if (o.yearMax !== undefined && v.year > o.yearMax) return false;

  if (o.priceMin !== undefined && (v.price ?? Infinity) < o.priceMin) return false;
  if (o.priceMax !== undefined && (v.price ?? -Infinity) > o.priceMax) return false;

  if (o.mileageMin !== undefined && (v.mileage ?? -Infinity) < o.mileageMin) return false;
  if (o.mileageMax !== undefined && (v.mileage ?? Infinity) > o.mileageMax) return false;

  if (!o.includeOutOfStock && v.inStock === false) return false;

  return true;
}

function sortVehicles(arr: Vehicle[], sort?: string, dir: "asc" | "desc" = "asc"): Vehicle[] {
  if (!sort) return arr;
  const mult = dir === "desc" ? -1 : 1;

  const cmp = (a: Vehicle, b: Vehicle): number => {
    const av = (a as any)[sort];
    const bv = (b as any)[sort];

    if (av === undefined && bv === undefined) return 0;
    if (av === undefined) return 1;
    if (bv === undefined) return -1;

    if (typeof av === "number" && typeof bv === "number") {
      return (av - bv) * mult;
    }
    return String(av).localeCompare(String(bv)) * mult;
  };

  return arr.slice().sort(cmp);
}

function paginate<T>(arr: T[], page: number = 1, pageSize: number = 20) {
  const p = Math.max(1, page);
  const ps = Math.max(1, Math.min(200, pageSize));
  const start = (p - 1) * ps;
  const items = arr.slice(start, start + ps);
  const total = arr.length;
  const totalPages = Math.max(1, Math.ceil(total / ps));
  return { items, page: p, pageSize: ps, total, totalPages };
}

// ===== Events API (in-memory) =====
export function addEvent(e: { vin: string; type: VehicleEventType; note?: string; payload?: any; }): VehicleEvent {
  const evt: VehicleEvent = {
    id: makeId(),
    vin: e.vin,
    type: e.type,
    timestamp: nowIso(),
    note: e.note,
    payload: e.payload
  };
  EVENTS.push(evt);
  return evt;
}

export function listEvents(opts: { vin?: string; type?: VehicleEventType; since?: Date; limit?: number; }): VehicleEvent[] {
  const { vin, type, since, limit = 100 } = opts;
  let out = EVENTS.slice();
  if (vin) out = out.filter((e) => e.vin === vin);
  if (type) out = out.filter((e) => e.type === type);
  if (since) out = out.filter((e) => new Date(e.timestamp) >= since);
  out.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1)); // newest first
  return out.slice(0, Math.max(1, limit));
}

// ===== Vehicle CRUD =====
export function queryVehicles(q: string): Vehicle[] {
  if (!q) return VEHICLES.slice();
  return VEHICLES.filter((v) => matches(v, q));
}

export function queryVehiclesAdvanced(opts: QueryOptions) {
  const filtered = VEHICLES.filter((v) => matches(v, opts.q ?? "") && applyFilters(v, opts));
  const sorted = sortVehicles(filtered, opts.sort, opts.dir ?? "asc");
  const page = paginate(sorted, opts.page, opts.pageSize);
  return {
    query: { ...opts, page: page.page, pageSize: page.pageSize },
    count: page.items.length,
    total: page.total,
    totalPages: page.totalPages,
    results: page.items
  };
}

export function getVehicle(vin: string): Vehicle | undefined {
  return VEHICLES.find((v) => v.vin === vin);
}

export function upsertVehicle(v: Vehicle): Vehicle {
  const idx = VEHICLES.findIndex((x) => x.vin === v.vin);
  if (idx >= 0) {
    const prev = { ...VEHICLES[idx] };
    VEHICLES[idx] = { ...VEHICLES[idx], ...v, inStock: v.inStock ?? true };
    addEvent({ vin: v.vin, type: "upsert", payload: { prev, next: VEHICLES[idx] } });
    return VEHICLES[idx];
  }
  const record: Vehicle = { inStock: true, ...v };
  VEHICLES.push(record);
  addEvent({ vin: v.vin, type: "import", payload: { next: record } });
  return record;
}

export function patchVehicle(vin: string, partial: Partial<Vehicle>): Vehicle | undefined {
  const idx = VEHICLES.findIndex((x) => x.vin === vin);
  if (idx < 0) return undefined;

  const prev = { ...VEHICLES[idx] };
  const next = { ...prev, ...partial };

  if (partial.price !== undefined && partial.price !== prev.price) {
    addEvent({ vin, type: "price_change", payload: { from: prev.price, to: partial.price } });
  }
  if (partial.mileage !== undefined && partial.mileage !== prev.mileage) {
    addEvent({ vin, type: "mileage_update", payload: { from: prev.mileage, to: partial.mileage } });
  }

  VEHICLES[idx] = next;
  addEvent({ vin, type: "patch", payload: { prev, next } });
  return VEHICLES[idx];
}

export function markSold(vin: string, note?: string): Vehicle | undefined {
  const idx = VEHICLES.findIndex((x) => x.vin === vin);
  if (idx < 0) return undefined;
  VEHICLES[idx] = { ...VEHICLES[idx], inStock: false };
  addEvent({ vin, type: "sold", note });
  return VEHICLES[idx];
}

export function deleteVehicle(vin: string): boolean {
  const idx = VEHICLES.findIndex((x) => x.vin === vin);
  if (idx < 0) return false;
  const prev = { ...VEHICLES[idx] };
  VEHICLES.splice(idx, 1);
  addEvent({ vin, type: "delete", payload: { prev } });
  return true;
}

export function allVehicles(): Vehicle[] {
  return VEHICLES.slice();
}

// ===== Metrics (avg price, availability, simple price trend) =====
export function metricsSummary(q: MetricsQuery): MetricsSummary {
  const filters = { make: q.make, model: q.model, trim: q.trim };

  const filtered = VEHICLES.filter(v => {
    if (q.make && v.make.toLowerCase() !== q.make.toLowerCase()) return false;
    if (q.model && v.model.toLowerCase() !== q.model.toLowerCase()) return false;
    if (q.trim && (v.trim ?? "").toLowerCase() !== q.trim.toLowerCase()) return false;
    if (!q.includeOutOfStock && v.inStock === false) return false;
    return true;
  });

  const count = filtered.length;

  const prices = filtered.map(v => v.price).filter((p): p is number => typeof p === "number");
  const mileages = filtered.map(v => v.mileage).filter((m): m is number => typeof m === "number");

  const avg = (arr: number[]) => (arr.length ? Number((arr.reduce((a,b)=>a+b,0) / arr.length).toFixed(2)) : undefined);
  const min = (arr: number[]) => (arr.length ? Math.min(...arr) : undefined);
  const max = (arr: number[]) => (arr.length ? Math.max(...arr) : undefined);

  // Simple trend: gather recent price_change events for VINs in filtered set.
  // Compare average of newest half vs older half (up/down/flat).
  const vinSet = new Set(filtered.map(v => v.vin));
  const recentChanges = EVENTS
    .filter(e => e.type === "price_change" && vinSet.has(e.vin) && e.payload)
    .slice(-50); // cap to last 50 for speed

  const series: number[] = recentChanges
    .map(e => (e.payload?.to as number))
    .filter((n): n is number => typeof n === "number");

  let trend: "up" | "down" | "flat" = "flat";
  let trendSamples = series.length;

  if (series.length >= 4) {
    const mid = Math.floor(series.length / 2);
    const older = series.slice(0, mid);
    const newer = series.slice(mid);
    const avgOlder = avg(older) ?? 0;
    const avgNewer = avg(newer) ?? 0;
    const delta = avgNewer - avgOlder;

    if (Math.abs(delta) < Math.max(50, avgOlder * 0.002)) {
      trend = "flat";
    } else {
      trend = delta > 0 ? "up" : "down";
    }
  } else {
    trend = "flat";
  }

  return {
    filters,
    count,
    avgPrice: avg(prices),
    minPrice: min(prices),
    maxPrice: max(prices),
    avgMileage: avg(mileages),
    minMileage: min(mileages),
    maxMileage: max(mileages),
    trend,
    trendSamples
  };
}

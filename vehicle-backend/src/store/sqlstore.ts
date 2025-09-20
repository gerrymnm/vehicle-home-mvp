import { getPool } from "../db";

export type Vehicle = {
  vin: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  mileage?: number;
  price?: number;
  location?: string;
  inStock?: boolean;
  dealerId?: number | null;
  ownerUserId?: number | null;
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
  timestamp: string;
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
  sort?: string;
  dir?: "asc" | "desc";
  page?: number;
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

function nowIso(): string {
  return new Date().toISOString();
}
function makeId(prefix = "evt"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;
}

function mapRow(r: any): Vehicle {
  return {
    vin: r.vin,
    year: r.year,
    make: r.make,
    model: r.model,
    trim: r.trim ?? undefined,
    mileage: r.mileage ?? undefined,
    price: r.price ?? undefined,
    location: r.location ?? undefined,
    inStock: r.in_stock ?? true,
    dealerId: r.dealer_id ?? null,
    ownerUserId: r.owner_user_id ?? null
  };
}

// EVENTS
export async function addEvent(e: {
  vin: string;
  type: VehicleEventType;
  note?: string;
  payload?: any;
}): Promise<VehicleEvent> {
  const db = getPool();
  const evt: VehicleEvent = {
    id: makeId(),
    vin: e.vin,
    type: e.type,
    timestamp: nowIso(),
    note: e.note,
    payload: e.payload
  };
  await db.query(
    `INSERT INTO events(id, vin, type, timestamp, note, payload)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [evt.id, evt.vin, evt.type, evt.timestamp, evt.note ?? null, evt.payload ?? null]
  );
  return evt;
}

export async function listEvents(opts: {
  vin?: string;
  type?: VehicleEventType;
  since?: Date;
  limit?: number;
}): Promise<VehicleEvent[]> {
  const db = getPool();
  const clauses: string[] = [];
  const params: any[] = [];
  if (opts.vin) {
    params.push(opts.vin);
    clauses.push(`vin = $${params.length}`);
  }
  if (opts.type) {
    params.push(opts.type);
    clauses.push(`type = $${params.length}`);
  }
  if (opts.since) {
    params.push(opts.since.toISOString());
    clauses.push(`timestamp >= $${params.length}`);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const limit = Math.max(1, opts.limit ?? 100);
  params.push(limit);
  const { rows } = await db.query(
    `SELECT id, vin, type, timestamp, note, payload
     FROM events ${where}
     ORDER BY timestamp DESC
     LIMIT $${params.length}`,
    params
  );
  return rows as any[];
}

// VEHICLES
export async function getVehicle(vin: string): Promise<Vehicle | undefined> {
  const db = getPool();
  const { rows } = await db.query(
    `SELECT vin, year, make, model, trim, mileage, price, location, in_stock, dealer_id, owner_user_id
     FROM vehicles WHERE vin=$1`,
    [vin]
  );
  if (!rows.length) return undefined;
  return mapRow(rows[0]);
}

export async function upsertVehicle(v: Vehicle): Promise<Vehicle> {
  const db = getPool();
  await db.query(
    `INSERT INTO vehicles (vin, year, make, model, trim, mileage, price, location, in_stock, dealer_id, owner_user_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     ON CONFLICT (vin) DO UPDATE SET
       year=EXCLUDED.year, make=EXCLUDED.make, model=EXCLUDED.model, trim=EXCLUDED.trim,
       mileage=EXCLUDED.mileage, price=EXCLUDED.price, location=EXCLUDED.location,
       in_stock=EXCLUDED.in_stock, dealer_id=EXCLUDED.dealer_id, owner_user_id=EXCLUDED.owner_user_id`,
    [
      v.vin,
      v.year,
      v.make,
      v.model,
      v.trim ?? null,
      v.mileage ?? null,
      v.price ?? null,
      v.location ?? null,
      v.inStock ?? true,
      v.dealerId ?? null,
      v.ownerUserId ?? null
    ]
  );
  await addEvent({ vin: v.vin, type: "upsert", payload: { next: v } });
  return (await getVehicle(v.vin))!;
}

export async function patchVehicle(
  vin: string,
  partial: Partial<Vehicle>
): Promise<Vehicle | undefined> {
  const prev = await getVehicle(vin);
  if (!prev) return undefined;

  const next: Vehicle = { ...prev, ...partial };

  if (partial.price !== undefined && partial.price !== prev.price) {
    await addEvent({
      vin,
      type: "price_change",
      payload: { from: prev.price, to: partial.price }
    });
  }
  if (partial.mileage !== undefined && partial.mileage !== prev.mileage) {
    await addEvent({
      vin,
      type: "mileage_update",
      payload: { from: prev.mileage, to: partial.mileage }
    });
  }

  const db = getPool();
  await db.query(
    `UPDATE vehicles SET
      year=$1, make=$2, model=$3, trim=$4, mileage=$5, price=$6, location=$7, in_stock=$8, dealer_id=$9, owner_user_id=$10
     WHERE vin=$11`,
    [
      next.year,
      next.make,
      next.model,
      next.trim ?? null,
      next.mileage ?? null,
      next.price ?? null,
      next.location ?? null,
      next.inStock ?? true,
      next.dealerId ?? null,
      next.ownerUserId ?? null,
      vin
    ]
  );

  await addEvent({ vin, type: "patch", payload: { prev, next } });
  return (await getVehicle(vin))!;
}

export async function markSold(
  vin: string,
  note?: string
): Promise<Vehicle | undefined> {
  const prev = await getVehicle(vin);
  if (!prev) return undefined;
  const db = getPool();
  await db.query(`UPDATE vehicles SET in_stock=FALSE WHERE vin=$1`, [vin]);
  await addEvent({ vin, type: "sold", note });
  return (await getVehicle(vin))!;
}

export async function deleteVehicle(vin: string): Promise<boolean> {
  const prev = await getVehicle(vin);
  if (!prev) return false;
  const db = getPool();
  await db.query(`DELETE FROM vehicles WHERE vin=$1`, [vin]);
  await addEvent({ vin, type: "delete", payload: { prev } });
  return true;
}

export async function queryVehicles(q: string): Promise<Vehicle[]> {
  return (await queryVehiclesAdvanced({ q })).results;
}

export async function queryVehiclesAdvanced(opts: QueryOptions) {
  const db = getPool();
  const page = Math.max(1, opts.page ?? 1);
  const pageSize = Math.max(1, Math.min(200, opts.pageSize ?? 20));
  const offset = (page - 1) * pageSize;

  const clauses: string[] = [];
  const params: any[] = [];

  if (opts.q) {
    params.push(`%${String(opts.q)}%`);
    clauses.push(
      `(vin ILIKE $${params.length} OR CAST(year AS TEXT) ILIKE $${params.length} OR make ILIKE $${params.length} OR model ILIKE $${params.length} OR COALESCE(trim,'') ILIKE $${params.length})`
    );
  }
  if (opts.make) {
    params.push(String(opts.make));
    clauses.push(`make ILIKE $${params.length}`);
  }
  if (opts.model) {
    params.push(String(opts.model));
    clauses.push(`model ILIKE $${params.length}`);
  }
  if (opts.trim) {
    params.push(String(opts.trim));
    clauses.push(`COALESCE(trim,'') ILIKE $${params.length}`);
  }
  if (opts.yearMin !== undefined) {
    params.push(opts.yearMin);
    clauses.push(`year >= $${params.length}`);
  }
  if (opts.yearMax !== undefined) {
    params.push(opts.yearMax);
    clauses.push(`year <= $${params.length}`);
  }
  if (opts.priceMin !== undefined) {
    params.push(opts.priceMin);
    clauses.push(`price >= $${params.length}`);
  }
  if (opts.priceMax !== undefined) {
    params.push(opts.priceMax);
    clauses.push(`price <= $${params.length}`);
  }
  if (opts.mileageMin !== undefined) {
    params.push(opts.mileageMin);
    clauses.push(`mileage >= $${params.length}`);
  }
  if (opts.mileageMax !== undefined) {
    params.push(opts.mileageMax);
    clauses.push(`mileage <= $${params.length}`);
  }
  if (!opts.includeOutOfStock) {
    clauses.push(`in_stock = TRUE`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const allowed = new Set(["vin", "year", "make", "model", "price", "mileage"]);
  const sort = allowed.has(String(opts.sort || "")) ? String(opts.sort) : "vin";
  const dir = opts.dir === "desc" ? "DESC" : "ASC";

  const { rows: crows } = await db.query<{ c: number }>(
    `SELECT COUNT(*)::int AS c FROM vehicles ${where}`,
    params
  );
  const total = crows[0]?.c ?? 0;

  const p = params.slice();
  p.push(pageSize, offset);
  const { rows } = await db.query(
    `SELECT vin, year, make, model, trim, mileage, price, location, in_stock, dealer_id, owner_user_id
     FROM vehicles ${where}
     ORDER BY ${sort} ${dir}
     LIMIT $${p.length - 1} OFFSET $${p.length}`,
    p
  );

  const results: Vehicle[] = rows.map((r: any) => mapRow(r));
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return { query: { ...opts, page, pageSize }, count: results.length, total, totalPages, results };
}

// METRICS
export async function metricsSummary(q: MetricsQuery): Promise<MetricsSummary> {
  const db = getPool();
  const filters = { make: q.make, model: q.model, trim: q.trim };

  const clauses: string[] = [];
  const params: any[] = [];
  if (q.make) {
    params.push(q.make);
    clauses.push(`make ILIKE $${params.length}`);
  }
  if (q.model) {
    params.push(q.model);
    clauses.push(`model ILIKE $${params.length}`);
  }
  if (q.trim) {
    params.push(q.trim);
    clauses.push(`COALESCE(trim,'') ILIKE $${params.length}`);
  }
  if (!q.includeOutOfStock) {
    clauses.push(`in_stock = TRUE`);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  const agg = await db.query(
    `SELECT COUNT(*)::int AS count,
            AVG(price)::int AS avgPrice,
            MIN(price) AS minPrice,
            MAX(price) AS maxPrice,
            AVG(mileage)::int AS avgMileage,
            MIN(mileage) AS minMileage,
            MAX(mileage) AS maxMileage
     FROM vehicles ${where}`,
    params
  );
  const a: any = agg.rows[0] || {};

  const vinsRows = await db.query<{ vin: string }>(
    `SELECT vin FROM vehicles ${where}`,
    params
  );
  const vins = vinsRows.rows.map((r: { vin: string }) => r.vin);

  let trend: "up" | "down" | "flat" = "flat";
  let trendSamples = 0;

  if (vins.length) {
    const ev = await db.query<{ payload: any }>(
      `SELECT payload FROM events
       WHERE type='price_change' AND vin = ANY($1)
       ORDER BY timestamp ASC
       LIMIT 50`,
      [vins]
    );
    const series = ev.rows
      .map((r: { payload: any }) => (r.payload ? r.payload.to : undefined))
      .filter((n: unknown): n is number => typeof n === "number");

    trendSamples = series.length;
    if (series.length >= 4) {
      const mid = Math.floor(series.length / 2);
      const avg = (arr: number[]) => arr.reduce((x, y) => x + y, 0) / arr.length;
      const delta = avg(series.slice(mid)) - avg(series.slice(0, mid));
      trend = Math.abs(delta) < 50 ? "flat" : delta > 0 ? "up" : "down";
    }
  }

  return {
    filters,
    count: a.count ?? 0,
    avgPrice: a.avgprice ?? undefined,
    minPrice: a.minprice ?? undefined,
    maxPrice: a.maxprice ?? undefined,
    avgMileage: a.avgmileage ?? undefined,
    minMileage: a.minmileage ?? undefined,
    maxMileage: a.maxmileage ?? undefined,
    trend,
    trendSamples
  };
}

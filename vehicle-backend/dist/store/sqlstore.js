"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addEvent = addEvent;
exports.listEvents = listEvents;
exports.getVehicle = getVehicle;
exports.upsertVehicle = upsertVehicle;
exports.patchVehicle = patchVehicle;
exports.markSold = markSold;
exports.deleteVehicle = deleteVehicle;
exports.queryVehicles = queryVehicles;
exports.queryVehiclesAdvanced = queryVehiclesAdvanced;
exports.metricsSummary = metricsSummary;
const db_1 = require("../db");
function nowIso() {
    return new Date().toISOString();
}
function makeId(prefix = "evt") {
    return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;
}
function mapRow(r) {
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
async function addEvent(e) {
    const db = (0, db_1.getPool)();
    const evt = {
        id: makeId(),
        vin: e.vin,
        type: e.type,
        timestamp: nowIso(),
        note: e.note,
        payload: e.payload
    };
    await db.query(`INSERT INTO events(id, vin, type, timestamp, note, payload)
     VALUES ($1,$2,$3,$4,$5,$6)`, [evt.id, evt.vin, evt.type, evt.timestamp, evt.note ?? null, evt.payload ?? null]);
    return evt;
}
async function listEvents(opts) {
    const db = (0, db_1.getPool)();
    const clauses = [];
    const params = [];
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
    const { rows } = await db.query(`SELECT id, vin, type, timestamp, note, payload
     FROM events ${where}
     ORDER BY timestamp DESC
     LIMIT $${params.length}`, params);
    return rows;
}
// VEHICLES
async function getVehicle(vin) {
    const db = (0, db_1.getPool)();
    const { rows } = await db.query(`SELECT vin, year, make, model, trim, mileage, price, location, in_stock, dealer_id, owner_user_id
     FROM vehicles WHERE vin=$1`, [vin]);
    if (!rows.length)
        return undefined;
    return mapRow(rows[0]);
}
async function upsertVehicle(v) {
    const db = (0, db_1.getPool)();
    await db.query(`INSERT INTO vehicles (vin, year, make, model, trim, mileage, price, location, in_stock, dealer_id, owner_user_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     ON CONFLICT (vin) DO UPDATE SET
       year=EXCLUDED.year, make=EXCLUDED.make, model=EXCLUDED.model, trim=EXCLUDED.trim,
       mileage=EXCLUDED.mileage, price=EXCLUDED.price, location=EXCLUDED.location,
       in_stock=EXCLUDED.in_stock, dealer_id=EXCLUDED.dealer_id, owner_user_id=EXCLUDED.owner_user_id`, [
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
    ]);
    await addEvent({ vin: v.vin, type: "upsert", payload: { next: v } });
    return (await getVehicle(v.vin));
}
async function patchVehicle(vin, partial) {
    const prev = await getVehicle(vin);
    if (!prev)
        return undefined;
    const next = { ...prev, ...partial };
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
    const db = (0, db_1.getPool)();
    await db.query(`UPDATE vehicles SET
      year=$1, make=$2, model=$3, trim=$4, mileage=$5, price=$6, location=$7, in_stock=$8, dealer_id=$9, owner_user_id=$10
     WHERE vin=$11`, [
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
    ]);
    await addEvent({ vin, type: "patch", payload: { prev, next } });
    return (await getVehicle(vin));
}
async function markSold(vin, note) {
    const prev = await getVehicle(vin);
    if (!prev)
        return undefined;
    const db = (0, db_1.getPool)();
    await db.query(`UPDATE vehicles SET in_stock=FALSE WHERE vin=$1`, [vin]);
    await addEvent({ vin, type: "sold", note });
    return (await getVehicle(vin));
}
async function deleteVehicle(vin) {
    const prev = await getVehicle(vin);
    if (!prev)
        return false;
    const db = (0, db_1.getPool)();
    await db.query(`DELETE FROM vehicles WHERE vin=$1`, [vin]);
    await addEvent({ vin, type: "delete", payload: { prev } });
    return true;
}
async function queryVehicles(q) {
    return (await queryVehiclesAdvanced({ q })).results;
}
async function queryVehiclesAdvanced(opts) {
    const db = (0, db_1.getPool)();
    const page = Math.max(1, opts.page ?? 1);
    const pageSize = Math.max(1, Math.min(200, opts.pageSize ?? 20));
    const offset = (page - 1) * pageSize;
    const clauses = [];
    const params = [];
    if (opts.q) {
        params.push(`%${String(opts.q)}%`);
        clauses.push(`(vin ILIKE $${params.length} OR CAST(year AS TEXT) ILIKE $${params.length} OR make ILIKE $${params.length} OR model ILIKE $${params.length} OR COALESCE(trim,'') ILIKE $${params.length})`);
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
    const { rows: crows } = await db.query(`SELECT COUNT(*)::int AS c FROM vehicles ${where}`, params);
    const total = crows[0]?.c ?? 0;
    const p = params.slice();
    p.push(pageSize, offset);
    const { rows } = await db.query(`SELECT vin, year, make, model, trim, mileage, price, location, in_stock, dealer_id, owner_user_id
     FROM vehicles ${where}
     ORDER BY ${sort} ${dir}
     LIMIT $${p.length - 1} OFFSET $${p.length}`, p);
    const results = rows.map((r) => mapRow(r));
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    return { query: { ...opts, page, pageSize }, count: results.length, total, totalPages, results };
}
// METRICS
async function metricsSummary(q) {
    const db = (0, db_1.getPool)();
    const filters = { make: q.make, model: q.model, trim: q.trim };
    const clauses = [];
    const params = [];
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
    const agg = await db.query(`SELECT COUNT(*)::int AS count,
            AVG(price)::int AS avgPrice,
            MIN(price) AS minPrice,
            MAX(price) AS maxPrice,
            AVG(mileage)::int AS avgMileage,
            MIN(mileage) AS minMileage,
            MAX(mileage) AS maxMileage
     FROM vehicles ${where}`, params);
    const a = agg.rows[0] || {};
    const vinsRows = await db.query(`SELECT vin FROM vehicles ${where}`, params);
    const vins = vinsRows.rows.map((r) => r.vin);
    let trend = "flat";
    let trendSamples = 0;
    if (vins.length) {
        const ev = await db.query(`SELECT payload FROM events
       WHERE type='price_change' AND vin = ANY($1)
       ORDER BY timestamp ASC
       LIMIT 50`, [vins]);
        const series = ev.rows
            .map((r) => (r.payload ? r.payload.to : undefined))
            .filter((n) => typeof n === "number");
        trendSamples = series.length;
        if (series.length >= 4) {
            const mid = Math.floor(series.length / 2);
            const avg = (arr) => arr.reduce((x, y) => x + y, 0) / arr.length;
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

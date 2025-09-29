"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVehicleByVinDb = getVehicleByVinDb;
exports.searchVehiclesDb = searchVehiclesDb;
const db_1 = __importDefault(require("../db"));
function toInt(...vals) {
    for (const v of vals) {
        if (v === undefined || v === null)
            continue;
        const n = Number(v);
        if (Number.isFinite(n))
            return n;
    }
    return null;
}
function normalize(r) {
    const year = r.year ?? r.model_year ?? r.m_year ?? null;
    const make = r.make ?? r.m_make ?? null;
    const model = r.model ?? r.m_model ?? null;
    return {
        vin: r.vin,
        year: year ? Number(year) : null,
        make,
        model,
        trim: r.trim ?? r.series ?? null,
        mileage: toInt(r.mileage, r.odometer),
        price: toInt(r.price, r.list_price, r.asking_price),
        location: r.location ?? r.city ?? null,
        in_stock: r.in_stock ?? (r.status ? r.status === "in_stock" : null),
        dealer_id: r.dealer_id ?? null,
        owner_user_id: r.owner_user_id ?? null,
        int_color: r.int_color ?? r.interior_color ?? null,
        ext_color: r.ext_color ?? r.exterior_color ?? null,
        photos: r.photos ?? r.images ?? null,
        status: r.status ?? (r.in_stock ? "in_stock" : null),
        title: year && (make || model)
            ? `${year} ${make ?? ""} ${model ?? ""}`.replace(/\s+/g, " ").trim()
            : `${make ?? ""} ${model ?? ""}`.replace(/\s+/g, " ").trim(),
    };
}
async function getVehicleByVinDb(vin) {
    const r = await db_1.default.query(`SELECT * FROM vehicles WHERE vin = $1`, [vin]);
    if (!r.rows?.length)
        return null;
    return normalize(r.rows[0]);
}
async function searchVehiclesDb(q, page, pageSize) {
    const like = `%${q}%`;
    const offset = (page - 1) * pageSize;
    const where = `WHERE vin ILIKE $1 OR make ILIKE $1 OR model ILIKE $1 OR trim ILIKE $1`;
    const list = await db_1.default.query(`SELECT * FROM vehicles
     ${where}
     ORDER BY make ASC, model ASC
     LIMIT $2 OFFSET $3`, [like, pageSize, offset]);
    const cnt = await db_1.default.query(`SELECT COUNT(*)::int AS count FROM vehicles ${where}`, [like]);
    return {
        rows: list.rows.map(normalize),
        count: cnt.rows?.[0]?.count ?? 0,
    };
}

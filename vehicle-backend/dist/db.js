"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.sql = sql;
exports.getPool = getPool;
// vehicle-backend/src/db.ts
const pg_1 = __importDefault(require("pg"));
const { Pool } = pg_1.default;
function sslSetting() {
    if (process.env.PGSSL?.toLowerCase() === "true") {
        return { rejectUnauthorized: false };
    }
    return undefined;
}
exports.pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: sslSetting()
});
// Tiny tagged-template query helper → returns rows[]
async function sql(strings, ...values) {
    const text = strings.reduce((acc, s, i) => acc + s + (i < values.length ? `$${i + 1}` : ""), "");
    const result = await exports.pool.query(text, values);
    return result.rows;
}
exports.default = exports.pool;
function getPool() {
    return exports.pool;
}

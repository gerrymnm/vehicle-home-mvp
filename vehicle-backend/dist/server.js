"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const cors_1 = __importDefault(require("cors"));
const search_1 = __importDefault(require("./search"));
const metrics_1 = __importDefault(require("./metrics"));
const events_1 = __importDefault(require("./events"));
const leads_1 = __importDefault(require("./leads"));
const vehicles_1 = __importDefault(require("./vehicles"));
const db_1 = __importDefault(require("./db"));
const PORT = Number(process.env.PORT || 10000);
const HOST = process.env.HOST || "0.0.0.0";
const app = (0, express_1.default)();
app.use(express_1.default.json({ limit: "4mb" }));
// Allow local dev + Vercel previews + production
const allowList = [
    "http://localhost:5173",
    "https://vehicle-home-mvp.vercel.app",
    /\.vercel\.app$/,
];
const corsMw = (0, cors_1.default)({
    credentials: true,
    origin(origin, cb) {
        if (!origin)
            return cb(null, true); // curl/postman
        const ok = allowList.some((o) => typeof o === "string" ? o === origin : o.test(origin));
        return ok ? cb(null, true) : cb(new Error(`CORS blocked: ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
});
app.use(corsMw);
app.options("*", corsMw);
app.use((0, morgan_1.default)("dev"));
// Health probe for Render
app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "vehicle-backend", ts: Date.now() });
});
// Routers
app.use("/api/search", search_1.default);
app.use("/api/metrics", metrics_1.default);
app.use("/api/events", events_1.default);
app.use("/api/leads", leads_1.default);
app.use("/api/vehicles", vehicles_1.default);
// ---- Startup schema guard: ensure `year` column exists if legacy SQL references it ----
async function ensureYearColumn() {
    try {
        const t = await db_1.default.query(`SELECT to_regclass('public.vehicles') AS tbl`);
        const tbl = t.rows?.[0]?.tbl;
        if (!tbl)
            return;
        await db_1.default.query(`ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS year INT`);
        await db_1.default.query(`UPDATE vehicles
         SET year = COALESCE(year, model_year)
       WHERE year IS NULL`);
    }
    catch (e) {
        console.error("[startup] ensureYearColumn failed:", e);
    }
}
async function main() {
    await ensureYearColumn();
    app.listen(PORT, HOST, () => {
        console.log(`api listening at http://${HOST}:${PORT}`);
    });
}
main().catch((e) => {
    console.error("fatal:", e);
    process.exit(1);
});

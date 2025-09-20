"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const search_1 = require("./search");
const events_1 = require("./events");
const metrics_1 = require("./metrics");
const auth_1 = require("./auth");
const db_1 = require("./db");
const app = (0, express_1.default)();
/**
 * CORS:
 * - Dev: allow all (no ALLOWED_ORIGINS set)
 * - Prod: set ALLOWED_ORIGINS as a comma-separated list (e.g. https://app.example.com,https://staging.example.com)
 */
function buildCors() {
    const raw = (process.env.ALLOWED_ORIGINS || "").trim();
    if (!raw)
        return (0, cors_1.default)(); // permissive for dev
    const allowed = new Set(raw
        .split(",")
        .map(s => s.trim())
        .filter(Boolean));
    const opts = {
        origin(origin, cb) {
            // allow server-to-server, curl, or same-origin (no Origin header)
            if (!origin)
                return cb(null, true);
            if (allowed.has(origin))
                return cb(null, true);
            return cb(new Error("Not allowed by CORS"));
        }
    };
    return (0, cors_1.default)(opts);
}
app.use(buildCors());
app.use(express_1.default.json());
// basic health
app.get("/health", (_req, res) => res.status(200).send("ok"));
// routers
app.use("/api", auth_1.authRouter);
app.use("/api", search_1.searchRouter);
app.use("/api", events_1.eventsRouter);
app.use("/api", metrics_1.metricsRouter);
// global error guard (so CORS errors return JSON)
app.use((err, _req, res, _next) => {
    if (err?.message === "Not allowed by CORS") {
        return res.status(403).json({ error: "CORS: origin not allowed" });
    }
    console.error("[server] unhandled error:", err);
    res.status(500).json({ error: "internal_error" });
});
// start after DB ready
(async () => {
    await (0, db_1.initDb)();
    const PORT = Number(process.env.PORT) || 8080;
    const HOST = process.env.HOST || "0.0.0.0";
    app.listen(PORT, HOST, () => console.log(`[backend] listening on http://${HOST}:${PORT}`));
})();
exports.default = app;

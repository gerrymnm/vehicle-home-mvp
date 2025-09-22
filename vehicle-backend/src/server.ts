import express from "express";
import morgan from "morgan";
import cors, { CorsOptionsDelegate } from "cors";
import searchRouter from "./search";
import metricsRouter from "./metrics";
import eventsRouter from "./events";
import leadsRouter from "./leads";
import vehiclesRouter from "./vehicles";
import pool from "./db";

const PORT = Number(process.env.PORT || 10000);
const HOST = process.env.HOST || "0.0.0.0";

const app = express();
app.use(express.json({ limit: "4mb" }));

/** Allow your local dev + Vercel preview + production domains */
const allowList: (string | RegExp)[] = [
  "http://localhost:5173",
  "https://vehicle-home-mvp.vercel.app",
  /\.vercel\.app$/, // any vercel preview
];

/** CORS middleware with whitelist */
const corsMw = cors({
  credentials: true,
  origin(origin, cb) {
    if (!origin) return cb(null, true); // curl/postman
    const ok = allowList.some((o) =>
      typeof o === "string" ? o === origin : o.test(origin)
    );
    return ok ? cb(null, true) : cb(new Error(`CORS blocked: ${origin}`));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

app.use(corsMw);
app.options("*", corsMw);
app.use(morgan("dev"));

/** Health probe */
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "vehicle-backend", ts: Date.now() });
});

/** Routers */
app.use("/api/search", searchRouter);
app.use("/api/metrics", metricsRouter);
app.use("/api/events", eventsRouter);
app.use("/api/leads", leadsRouter);
app.use("/api/vehicles", vehiclesRouter);

/**
 * --- Startup fixup: make sure a `year` column exists and is populated ---
 *
 * This prevents crashes from any legacy SQL like `SELECT vin, year, ...`
 * even if some code path still references `year` directly.
 */
async function ensureYearColumn() {
  try {
    // Skip if table doesn't exist
    const t = await pool.query(
      `SELECT to_regclass('public.vehicles') AS tbl`
    );
    const tbl = t.rows?.[0]?.tbl;
    if (!tbl) return;

    await pool.query(`ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS year INT`);
    // Backfill from model_year (or leave null if not available)
    await pool.query(
      `UPDATE vehicles
         SET year = COALESCE(year, model_year)
       WHERE year IS NULL`
    );
  } catch (e) {
    // Don’t block boot if this fails; just log.
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

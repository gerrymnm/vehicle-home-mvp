import express from "express";
import morgan from "morgan";
import cors from "cors";
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

// Allow local dev + Vercel previews + production
const allowList: (string | RegExp)[] = [
  "http://localhost:5173",
  "https://vehicle-home-mvp.vercel.app",
  /\.vercel\.app$/,
];

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

// Health probe for Render
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "vehicle-backend", ts: Date.now() });
});

// Routers
app.use("/api/search", searchRouter);
app.use("/api/metrics", metricsRouter);
app.use("/api/events", eventsRouter);
app.use("/api/leads", leadsRouter);
app.use("/api/vehicles", vehiclesRouter);

// ---- Startup schema guard: ensure `year` column exists if legacy SQL references it ----
async function ensureYearColumn() {
  try {
    const t = await pool.query(`SELECT to_regclass('public.vehicles') AS tbl`);
    const tbl = t.rows?.[0]?.tbl;
    if (!tbl) return;

    await pool.query(`ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS year INT`);
    await pool.query(
      `UPDATE vehicles
         SET year = COALESCE(year, model_year)
       WHERE year IS NULL`
    );
  } catch (e) {
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

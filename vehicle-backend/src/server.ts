import express, { Request, Response, NextFunction } from "express";
import morgan from "morgan";
import cors from "cors";

import searchRouter from "./search";
import metricsRouter from "./metrics";
import eventsRouter from "./events";
import leadsRouter from "./leads";
import vehiclesRouter from "./vehicles";

const PORT = Number(process.env.PORT || 10000);
const HOST = process.env.HOST || "0.0.0.0";

const app = express();

// ---- Core middleware (body + CORS) ----
app.use(express.json({ limit: "4mb" }));

/**
 * Allowlist of front-end origins.
 * - localhost (vite/preview)
 * - your production Vercel app
 * - any preview *.vercel.app
 */
const allowList: (string | RegExp)[] = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
  "https://vehicle-home-mvp.vercel.app",
  /\.vercel\.app$/i,
];

// CORS middleware (no credentials needed)
const corsMw = cors({
  origin(origin, cb) {
    // no origin => curl/postman or same-origin -> allow
    if (!origin) return cb(null, true);
    const ok = allowList.some(entry =>
      typeof entry === "string" ? entry === origin : entry.test(origin)
    );
    return ok ? cb(null, true) : cb(new Error(`CORS blocked: ${origin}`));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

// IMPORTANT: handle preflight first, then use CORS on all routes
app.options("*", corsMw);
app.use(corsMw);

// Logging after CORS
app.use(morgan("dev"));

// ---- Health ----
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ ok: true, service: "vehicle-backend", ts: new Date().toISOString() });
});

// ---- API routes ----
app.use("/api/search", searchRouter);
app.use("/api/metrics", metricsRouter);
app.use("/api/events", eventsRouter);
app.use("/api/leads", leadsRouter);
app.use(vehiclesRouter); // /api/vehicles/* inside this router

// ---- Error handler (keeps JSON reply) ----
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err?.message || err);
  const msg = (typeof err?.message === "string" ? err.message : "Server error");
  res.status(500).json({ ok: false, error: msg });
});

app.listen(PORT, HOST, () => {
  console.log(`vehicle-backend listening on http://${HOST}:${PORT}`);
});

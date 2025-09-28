// vehicle-backend/src/server.ts
import express, { Request, Response } from "express";
import morgan from "morgan";
import cors from "cors";

import searchRouter from "./search";
import vehiclesRouter from "./vehicles";
import metricsRouter from "./metrics";
import eventsRouter from "./events";
import leadsRouter from "./leads";

const PORT = Number(process.env.PORT || 10000);
const HOST = process.env.HOST || "0.0.0.0";

const app = express();
app.use(express.json({ limit: "4mb" }));

/**
 * TEMP: allow any origin so Vercel can call us even on previews/cold starts.
 * (No cookies involved, so credentials = false is fine.)
 * Once everything works, we can tighten this to an allowlist.
 */
app.use(cors({
  origin: true,           // reflect the incoming Origin
  credentials: false,     // keep false to allow Access-Control-Allow-Origin: *
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 600,            // cache preflight
}));

// Make sure OPTIONS always returns 204 fast
app.options("*", (_req, res) => {
  res.sendStatus(204);
});

app.use(morgan("dev"));

// Health
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "vehicle-backend", ts: new Date().toISOString() });
});

// API mounts
app.use("/api/search", searchRouter);
app.use("/api/vehicles", vehiclesRouter);
app.use("/api/metrics", metricsRouter);
app.use("/api/events", eventsRouter);
app.use("/api/leads", leadsRouter);

// 404 for unknown /api/* routes as JSON
app.use("/api", (_req, res) => {
  res.status(404).json({ ok: false, error: "Not found" });
});

app.listen(PORT, HOST, () => {
  console.log(`API listening on http://${HOST}:${PORT}`);
});

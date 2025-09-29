// Full file: vehicle-backend/src/server.ts

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";

// If you use a .env locally, keep this (Render ignores it, which is fine)
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require("dotenv").config();
} catch { /* noop */ }

const app = express();

// --- Core middleware ---------------------------------------------------------
app.set("trust proxy", true);

// CORS: permissive for all preview/prod origins (tighten later if you want)
app.use(cors({
  origin: true, // reflect the request origin
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false,
  maxAge: 86400,
}));
app.options("*", cors()); // ensure every preflight is answered

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));
app.use(morgan("tiny"));

// --- Health check ------------------------------------------------------------
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ ok: true, status: "healthy" });
});

// --- Routers (mounted under /api) -------------------------------------------
// Vehicles API (required)
import vehiclesRouter from "./vehicles";
app.use("/api/vehicles", vehiclesRouter);

// Auth API (optional): only mount if the file exists/exports default
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const maybeAuth = require("./auth");
  if (maybeAuth?.default) {
    app.use("/api/auth", maybeAuth.default);
  }
} catch { /* not present, skip */ }

// You can add other routers similarly, e.g. leads, metrics, searches:
// import leadsRouter from "./leads"; app.use("/api/leads", leadsRouter);

// --- 404 handler (JSON) ------------------------------------------------------
app.use("/api", (_req: Request, res: Response) => {
  res.status(404).json({ ok: false, error: "Not found" });
});

// --- Error handler (JSON) ----------------------------------------------------
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = typeof err?.status === "number" ? err.status : 500;
  const message =
    err?.message ||
    err?.error ||
    (status === 404 ? "Not found" : "Internal server error");

  // Helpful details in dev; minimal in prod
  const body: Record<string, any> = { ok: false, error: message };
  if (process.env.NODE_ENV !== "production" && err?.stack) {
    body.stack = err.stack;
  }
  res.status(status).json(body);
});

// --- Start server ------------------------------------------------------------
const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  // Keep this log — Render shows it in the instance logs
  console.log(`API listening on port ${PORT}`);
});

export default app;

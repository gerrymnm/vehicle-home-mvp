import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors, { CorsOptions } from "cors";
import { searchRouter } from "./search";
import { eventsRouter } from "./events";
import { metricsRouter } from "./metrics";
import { authRouter } from "./auth";
import { initDb } from "./db";

const app = express();

/**
 * CORS:
 * - Dev: allow all (no ALLOWED_ORIGINS set)
 * - Prod: set ALLOWED_ORIGINS as a comma-separated list (e.g. https://app.example.com,https://staging.example.com)
 */
function buildCors() {
  const raw = (process.env.ALLOWED_ORIGINS || "").trim();
  if (!raw) return cors(); // permissive for dev

  const allowed = new Set(
    raw
      .split(",")
      .map(s => s.trim())
      .filter(Boolean)
  );

  const opts: CorsOptions = {
    origin(origin, cb) {
      // allow server-to-server, curl, or same-origin (no Origin header)
      if (!origin) return cb(null, true);
      if (allowed.has(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    }
  };
  return cors(opts);
}

app.use(buildCors());
app.use(express.json());

// basic health
app.get("/health", (_req: Request, res: Response) => res.status(200).send("ok"));

// routers
app.use("/api", authRouter);
app.use("/api", searchRouter);
app.use("/api", eventsRouter);
app.use("/api", metricsRouter);

// global error guard (so CORS errors return JSON)
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err?.message === "Not allowed by CORS") {
    return res.status(403).json({ error: "CORS: origin not allowed" });
  }
  console.error("[server] unhandled error:", err);
  res.status(500).json({ error: "internal_error" });
});

// start after DB ready
(async () => {
  await initDb();
  const PORT = Number(process.env.PORT) || 8080;
  const HOST = process.env.HOST || "0.0.0.0";
  app.listen(PORT, HOST, () => console.log(`[backend] listening on http://${HOST}:${PORT}`));
})();

export default app;

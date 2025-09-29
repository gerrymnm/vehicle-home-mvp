// vehicle-backend/src/server.ts
import express from "express";
import cors from "cors";
import morgan from "morgan";
import router from "./vehicles";

const app = express();

/**
 * CORS
 * - Reads ALLOWED_ORIGINS from env (comma-separated)
 * - Also permits localhost during development
 * - Also permits any *.vercel.app (preview deployments)
 *
 * In Render, set:
 *   ALLOWED_ORIGINS=https://vehicle-home-mvp.vercel.app
 * (you can add more, comma-separated)
 */
const ENV_ALLOWED = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

const DEFAULT_ALLOWED = [
  "http://localhost:5173",
  "http://localhost:3000",
];

const VERCEL_PREVIEW_RE = /\.vercel\.app$/;

app.use(
  cors({
    origin(origin, cb) {
      // Server-to-server (no Origin header) – allow
      if (!origin) return cb(null, true);

      // Exact match against env or defaults
      if ([...ENV_ALLOWED, ...DEFAULT_ALLOWED].includes(origin)) {
        return cb(null, true);
      }

      // Allow any *.vercel.app (preview)
      if (VERCEL_PREVIEW_RE.test(origin)) {
        return cb(null, true);
      }

      // Otherwise, block
      return cb(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(morgan("tiny"));

// Simple health right on the server
app.get("/health", (_req, res) => res.json({ ok: true, service: "vehicle-backend" }));

// Mount API under /api (this is what the frontend calls)
app.use("/api", router);

// 404 for unknown API paths
app.use("/api", (_req, res) => {
  res.status(404).json({ ok: false, error: "Not found" });
});

// Root
app.get("/", (_req, res) => {
  res.type("text").send("Vehicle backend is running. See /api/health");
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`vehicle-backend listening on :${port}`);
});

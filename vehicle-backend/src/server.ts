// vehicle-backend/src/server.ts
import express from "express";
import cors from "cors";
import morgan from "morgan";

// Feature routers
import authRouter from "./auth";
import searchRouter from "./search";
import vehiclesRouter from "./vehicles";
// If these exist in your repo, leave the imports; otherwise remove them.
import leadsRouter from "./leads";
import metricsRouter from "./metrics";
import eventsRouter from "./events";

const app = express();

/**
 * CORS
 * - Read a comma-separated list from ALLOWED_ORIGINS
 * - Fallback to common local + your Vercel domain
 */
const fromEnv = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

const DEFAULTS = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://vehicle-home-mvp.vercel.app",
];

const MATCHERS: (string | RegExp)[] = [
  ...DEFAULTS,
  ...fromEnv,
  // allow any *.vercel.app preview
  /\.vercel\.app$/i,
];

app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true); // curl / REST client, same-origin
      const ok = MATCHERS.some(m =>
        m instanceof RegExp ? m.test(origin) : m === origin
      );
      cb(null, ok);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(morgan("tiny"));

/** Health (under /api for frontends) */
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "vehicle-backend" });
});

/** Mount feature routers under /api/* */
app.use("/api/auth", authRouter);
app.use("/api/search", searchRouter);
app.use("/api/vehicles", vehiclesRouter);

// If you have these routers in your codebase, keep them mounted.
// If not, remove these lines (they won't compile otherwise).
app.use("/api/leads", leadsRouter);
app.use("/api/metrics", metricsRouter);
app.use("/api/events", eventsRouter);

/** 404 for unknown API routes */
app.use("/api", (_req, res) => {
  res.status(404).json({ ok: false, error: "Not found" });
});

/** Root text page */
app.get("/", (_req, res) => {
  res.type("text").send("Vehicle backend is running. See /api/health");
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`vehicle-backend listening on :${port}`);
  console.log("CORS allow list:", MATCHERS);
});

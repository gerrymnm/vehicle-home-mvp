// vehicle-backend/src/server.ts
import express from "express";
import cors, { CorsOptionsDelegate } from "cors";
import morgan from "morgan";
import router from "./vehicles";

const app = express();

/* ------------------------- CORS SETUP ------------------------- */
/**
 * ALLOWED_ORIGINS (Render env var) examples:
 *   https://vehicle-home-mvp.vercel.app,https://*.vercel.app,http://localhost:5173,http://localhost:3000
 *
 * We support exact strings and wildcards like https://*.vercel.app
 */
function buildMatchers(): (string | RegExp)[] {
  const fromEnv = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

  // sensible defaults if env isn’t set
  const defaults = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://vehicle-home-mvp.vercel.app",
    /\.vercel\.app$/  // any *.vercel.app
  ];

  const raw = fromEnv.length ? fromEnv : defaults;

  return raw.map(v => {
    if (v.includes("*")) {
      // turn https://*.vercel.app into a regex
      const esc = v
        .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
        .replace("\\*","[^.]+"); // one subdomain segment
      return new RegExp("^" + esc + "$");
    }
    // allow plain regex literals written as /.../ if you want
    if (v.startsWith("/") && v.endsWith("/")) {
      try { return new RegExp(v.slice(1, -1)); } catch { /* fall through */ }
    }
    return v;
  });
}

const MATCHERS = buildMatchers();

const corsDelegate: CorsOptionsDelegate = (req, cb) => {
  const origin = req.header("Origin") || "";
  const allowed =
    !origin || // non-browser / curl
    MATCHERS.some(m =>
      m instanceof RegExp ? m.test(origin) : m === origin
    );

  cb(null, {
    origin: allowed,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204
  });
};

// apply CORS to everything + answer preflights
app.use(cors(corsDelegate));
app.options("*", cors(corsDelegate));
/* -------------------------------------------------------------- */

app.use(express.json());
app.use(morgan("tiny"));

// Simple server health (not under /api) for sanity checks
app.get("/health", (_req, res) => res.json({ ok: true, service: "vehicle-backend" }));

// Mount your API under /api
app.use("/api", router);

// 404 for unknown /api paths in JSON (keeps CORS headers present)
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
  console.log("CORS allow list:", MATCHERS);
});

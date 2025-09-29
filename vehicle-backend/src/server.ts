// vehicle-backend/src/server.ts
import express from "express";
import cors, { CorsOptionsDelegate } from "cors";
import morgan from "morgan";
import router from "./vehicles";

const app = express();

/* ---------------------- CORS ---------------------- */

/**
 * Read allowed origins from env (comma-separated), and add sensible defaults.
 * Render env key: ALLOWED_ORIGINS
 */
const fromEnv =
  (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

const DEFAULT_ALLOW = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://vehicle-home-mvp.vercel.app",
];

// Support both literal strings and regex (written as /.../ in the env if desired)
function toMatcher(s: string): string | RegExp {
  if (s.length >= 2 && s.startsWith("/") && s.endsWith("/")) {
    // treat as a regex literal text from env, without flags
    return new RegExp(s.slice(1, -1));
  }
  return s;
}

const MATCHERS: (string | RegExp)[] = [
  ...DEFAULT_ALLOW.map(toMatcher),
  ...fromEnv.map(toMatcher),
];

/** Decide if the given origin is allowed */
function isAllowedOrigin(origin: string): boolean {
  return MATCHERS.some(m =>
    typeof m === "string" ? origin === m : m.test(origin)
  );
}

/** CORS options delegate (typed) */
const corsDelegate: CorsOptionsDelegate = (req, cb) => {
  const origin = req.headers?.origin as string | undefined;
  if (!origin) {
    // no origin = same-origin / server-to-server; allow
    return cb(null, { origin: true, credentials: true });
  }
  const allowed = isAllowedOrigin(origin);
  cb(
    null,
    {
      origin: allowed,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }
  );
};

app.use(cors(corsDelegate));
app.options("*", cors(corsDelegate)); // ensure preflight succeeds

/* ------------------- App middleware ------------------- */
app.use(express.json());
app.use(morgan("tiny"));

/* -------------------- Health endpoints -------------------- */
// Server-level health (helpful for Render)
app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "vehicle-backend" });
});

/* -------------------- Mount API router -------------------- */
app.use("/api", router);

// JSON 404 for unknown API routes
app.use("/api", (_req, res) => {
  res.status(404).json({ ok: false, error: "Not found" });
});

/* -------------------- Root message -------------------- */
app.get("/", (_req, res) => {
  res.type("text").send("Vehicle backend is running. See /api/health");
});

/* -------------------- Start server -------------------- */
const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`vehicle-backend listening on :${port}`);
  console.log("CORS allow list:", MATCHERS);
});

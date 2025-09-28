// Full file: vehicle-backend/src/server.ts

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";

import vehicles from "./vehicles"; // GET /api/vehicles/:vin and vehicle subroutes
import search from "./search";     // GET /api/search
import leads from "./leads";       // POST /api/leads
import auth from "./auth";         // POST /api/auth/* etc.

// --- App bootstrap
const app = express();

// Parse JSON before routes that need it
app.use(express.json());

// Basic logging
app.use(morgan("tiny"));

// -------- CORS CONFIG --------
// We allow GETs from anywhere (search & vehicle detail are public).
// For non-GET (POST/PUT/PATCH/DELETE), we restrict to known origins.
const PUBLIC_GET = ["GET", "HEAD", "OPTIONS"];

const knownOrigins = new Set<string>([
  "http://localhost:5173",
  "http://localhost:3000",
  "https://vehicle-home-mvp.vercel.app",
  // Your project-scoped vercel preview & project domains (regex allowed below)
  // Add your custom domains here if/when you connect one.
  "https://vehicle-home-mvp.onrender.com", // self-origin (Render) for health checks
]);

// Regex that matches any *.vercel.app (project/preview) domains
const vercelRegex = /\.vercel\.app$/i;

app.use(
  cors({
    credentials: true,
    origin: (origin, cb) => {
      // No origin (curl/postman) -> allow
      if (!origin) return cb(null, true);

      // Public GET endpoints: allow any origin (so SRP works everywhere)
      // Preflight (OPTIONS) is allowed here too to enable GETs cleanly.
      // Non-GET requests continue through the checks below.
      // NOTE: Browsers preflight with OPTIONS; we let that pass.
      cb(null, true);
    },
    methods: ["GET", "HEAD", "OPTIONS", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400, // cache preflight
  })
);

// Hard short-circuit for non-GET to ensure origin is trusted
app.use((req: Request, res: Response, next: NextFunction) => {
  if (PUBLIC_GET.includes(req.method)) return next();

  const origin = req.headers.origin || "";
  const allowed =
    knownOrigins.has(origin) || (!!origin && vercelRegex.test(new URL(origin).hostname));

  if (!allowed) {
    return res
      .status(403)
      .json({ ok: false, error: "CORS: origin not allowed for this method" });
  }
  next();
});

// -------- Routes --------
app.get("/api/health", (_req, res) =>
  res.json({ ok: true, service: "vehicle-backend", ts: Date.now() })
);

app.use("/api/search", search);
app.use("/api/vehicles", vehicles);
app.use("/api/leads", leads);
app.use("/api/auth", auth);

// Fallback 404 for unknown API routes
app.use("/api/*", (_req, res) => res.status(404).json({ ok: false, error: "Not found" }));

// Root ping
app.get("/", (_req, res) => {
  res.type("text/plain").send("vehicle-backend is running");
});

// -------- Start (Render provides PORT) --------
const PORT = Number(process.env.PORT || 10000);
app.listen(PORT, () => {
  console.log(`[server] listening on :${PORT}`);
});

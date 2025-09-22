import express from "express";
import cors from "cors";
import morgan from "morgan";

import searchRouter from "./search";          // ← make sure this import exists
import metricsRouter from "./metrics";
import eventsRouter from "./events";
import leadsRouter from "./leads";
import vehiclesRouter from "./vehicles";

const PORT = Number(process.env.PORT || 10000);
const HOST = process.env.HOST || "0.0.0.0";

const app = express();
app.use(express.json({ limit: "4mb" }));

// CORS: allow your local dev + Vercel domains
const allowList: (string | RegExp)[] = [
  "http://localhost:5173",
  "https://vehicle-home-mvp.vercel.app",
  /\.vercel\.app$/, // any Vercel preview
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

// Health check for quick debugging
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// API routes
app.use("/api/search", searchRouter);
app.use("/api/metrics", metricsRouter);
app.use("/api/events", eventsRouter);
app.use("/api/leads", leadsRouter);
app.use(vehiclesRouter); // if your vehicles router mounts its own base

// 404 JSON instead of HTML
app.use((_req, res) => res.status(404).json({ error: "Not Found" }));

async function main() {
  app.listen(PORT, HOST, () => {
    console.log(`[backend] listening on http://${HOST}:${PORT}`);
  });
}

main().catch((err) => {
  console.error("Fatal error starting server:", err);
  process.exit(1);
});

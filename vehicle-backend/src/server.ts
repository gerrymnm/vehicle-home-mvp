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

// JSON body
app.use(express.json({ limit: "4mb" }));

/**
 * CORS — allow your Vercel front-end and local dev.
 * If you later add a custom domain, add it to allowList.
 */
const allowList: (string | RegExp)[] = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://vehicle-home-mvp.vercel.app",
  /\.vercel\.app$/, // preview or alternate Vercel branches
];

const corsMw = cors({
  credentials: true,
  origin(origin, cb) {
    if (!origin) return cb(null, true); // curl/postman
    const ok = allowList.some(o =>
      typeof o === "string" ? o === origin : o.test(origin)
    );
    return ok ? cb(null, true) : cb(new Error(`CORS blocked: ${origin}`));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

app.use(corsMw);
app.options("*", corsMw);

// Logs
app.use(morgan("dev"));

/** --------- Health --------- */
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ ok: true, service: "vehicle-backend", ts: new Date().toISOString() });
});

/** --------- API mounts (NOTE the /api/vehicles base) --------- */
app.use("/api/search", searchRouter);
app.use("/api/vehicles", vehiclesRouter);
app.use("/api/metrics", metricsRouter);
app.use("/api/events", eventsRouter);
app.use("/api/leads", leadsRouter);

// Fallback 404 JSON for API paths
app.use("/api", (_req, res) => {
  res.status(404).json({ ok: false, error: "Not found" });
});

app.listen(PORT, HOST, () => {
  console.log(`API listening on http://${HOST}:${PORT}`);
});

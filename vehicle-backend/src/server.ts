import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { initDB } from "./db";
import searchRouter from "./search";
import metricsRouter from "./metrics";
import eventsRouter from "./events";
import leadsRouter from "./leads";
import vehiclesRouter from "./vehicles";
import cors from "cors";

const PORT = Number(process.env.PORT || 10000);
const HOST = process.env.HOST || "0.0.0.0";

const app = express();
app.use(express.json({ limit: "4mb" }));
const allowList: (string | RegExp)[] = [
  "http://localhost:5173",
  "https://vehicle-home-mvp.vercel.app",
  /\.vercel\.app$/, // preview builds
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

app.use("/api/search", searchRouter);
app.use("/api/metrics", metricsRouter);
app.use("/api/events", eventsRouter);
app.use("/api/leads", leadsRouter);
app.use(vehiclesRouter);

async function main() {
  await initDB();
  app.listen(PORT, HOST, () => {
    console.log(`[backend] listening on http://${HOST}:${PORT}`);
  });
}
main().catch((err) => {
  console.error("Fatal error starting server:", err);
  process.exit(1);
});

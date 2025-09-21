import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { initDB } from "./db";
import searchRouter from "./search";
import metricsRouter from "./metrics";
import eventsRouter from "./events";
import leadsRouter from "./leads";

const app = express();

const allowlist = [
  "http://localhost:5173",
  "https://vehicle-home-mvp.vercel.app",
];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowlist.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    credentials: true,
  })
);
app.options("*", cors());

app.use(morgan("tiny"));
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/search", searchRouter);
app.use("/api/metrics", metricsRouter);
app.use("/api/events", eventsRouter);
app.use("/api/leads", leadsRouter);

const PORT = Number(process.env.PORT || 8080);
const HOST = process.env.HOST || "0.0.0.0";

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

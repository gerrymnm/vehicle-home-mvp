import "dotenv/config";
import express from "express";
import cors from "cors";

import leadsRouter from "./leads";
import { initDB } from "./db";

// Your feature routers export **named** routers; import them as named:
import { searchRouter } from "./search";
import { metricsRouter } from "./metrics";
import { eventsRouter } from "./events";

const app = express();

app.use(cors());
app.use(express.json());

// Health
app.get("/healthz", (_req, res) => res.json({ ok: true }));

// Leads API
app.use("/api/leads", leadsRouter);

// Existing feature routes (paths are defined inside each file)
app.use("/", searchRouter);
app.use("/", metricsRouter);
app.use("/", eventsRouter);

const PORT = Number(process.env.PORT || 8080);
const HOST = process.env.HOST || "0.0.0.0";

async function main() {
  await initDB(); // ensure tables exist before serving traffic
  app.listen(PORT, HOST, () => {
    console.log(`[backend] listening on http://${HOST}:${PORT}`);
  });
}

main().catch((err) => {
  console.error("Fatal error starting server:", err);
  process.exit(1);
});

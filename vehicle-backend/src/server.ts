import express from "express";
import cors from "cors";
import { initDB } from "./db";

// NOTE: these are named exports in your project
import { searchRouter } from "./search";
import { metricsRouter } from "./metrics";
import { eventsRouter } from "./events";

// Leads router from our new module (default export)
import leadsRouter from "./leads";

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// mount all API routes under /api
const api = express.Router();
api.use(searchRouter);
api.use(metricsRouter);
api.use(eventsRouter);
api.use(leadsRouter);
app.use("/api", api);

// simple health endpoint
app.get("/healthz", (_req, res) => res.json({ ok: true }));

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

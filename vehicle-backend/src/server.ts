import "dotenv/config";
import express from "express";
import cors from "cors";
import { initDB } from "./db";
import searchRouter from "./search";
import metricsRouter from "./metrics";
import eventsRouter from "./events";
import leadsRouter from "./leads";

const app = express();
const PORT = Number(process.env.PORT || 10000);
const HOST = process.env.HOST || "0.0.0.0";

app.use(express.json());
app.use(cors({ origin: true, credentials: true }));

app.use("/api", searchRouter);
app.use("/api", metricsRouter);
app.use("/api", eventsRouter);
app.use("/api", leadsRouter);

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

export default app;

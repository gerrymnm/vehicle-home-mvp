// vehicle-backend/src/server.ts
import express from "express";
import cors from "cors";
import morgan from "morgan";
import router from "./vehicles";

const app = express();

// --- CORS (allow your Vercel app and localhost) ---
const ALLOW = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://vehicle-home-mvp.vercel.app",
  /\.vercel\.app$/,
];
app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      if (ALLOW.some((a) => (a instanceof RegExp ? a.test(origin) : a === origin))) {
        return cb(null, true);
      }
      cb(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(morgan("tiny"));

// Health straight on server (useful sanity check)
app.get("/health", (_req, res) => res.json({ ok: true, service: "vehicle-backend" }));

// ---- Mount API under /api (CRITICAL) ----
app.use("/api", router);

// 404 fallback for unknown API paths (kept as JSON for clarity)
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
});

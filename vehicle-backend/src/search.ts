import { Router, Request, Response } from "express";
import {
  queryVehiclesAdvanced,
  getVehicle,
  upsertVehicle,
  patchVehicle,
  deleteVehicle,
  markSold
} from "./store/sqlstore";
import type { Vehicle } from "./store/sqlstore";
import { requireAuth } from "./auth_mw";

export const searchRouter = Router();

/* ----------------- helpers ----------------- */
function num(v: unknown): number | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}
function bool(v: unknown): boolean | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  if (typeof v === "boolean") return v;
  const s = String(v).toLowerCase();
  if (["true", "1", "yes", "y"].includes(s)) return true;
  if (["false", "0", "no", "n"].includes(s)) return false;
  return undefined;
}

/* --------------- public search --------------- */
searchRouter.get("/search", async (req: Request, res: Response) => {
  const results = await queryVehiclesAdvanced({
    q: (req.query.q as string) ?? "",
    make: (req.query.make as string) ?? undefined,
    model: (req.query.model as string) ?? undefined,
    trim: (req.query.trim as string) ?? undefined,
    yearMin: num(req.query.yearMin),
    yearMax: num(req.query.yearMax),
    priceMin: num(req.query.priceMin),
    priceMax: num(req.query.priceMax),
    mileageMin: num(req.query.mileageMin),
    mileageMax: num(req.query.mileageMax),
    sort: (req.query.sort as string) ?? undefined,
    dir: (req.query.dir as "asc" | "desc") ?? "asc",
    page: num(req.query.page),
    pageSize: num(req.query.pageSize),
    includeOutOfStock: bool(req.query.includeOutOfStock)
  });
  res.json(results);
});

searchRouter.get("/vehicles", async (req: Request, res: Response) => {
  const results = await queryVehiclesAdvanced({
    q: (req.query.q as string) ?? "",
    make: (req.query.make as string) ?? undefined,
    model: (req.query.model as string) ?? undefined,
    trim: (req.query.trim as string) ?? undefined,
    yearMin: num(req.query.yearMin),
    yearMax: num(req.query.yearMax),
    priceMin: num(req.query.priceMin),
    priceMax: num(req.query.priceMax),
    mileageMin: num(req.query.mileageMin),
    mileageMax: num(req.query.mileageMax),
    sort: (req.query.sort as string) ?? undefined,
    dir: (req.query.dir as "asc" | "desc") ?? "asc",
    page: num(req.query.page),
    pageSize: num(req.query.pageSize),
    includeOutOfStock: bool(req.query.includeOutOfStock)
  });
  res.json(results);
});

searchRouter.get("/vehicles/:vin", async (req: Request, res: Response) => {
  const v = await getVehicle(req.params.vin);
  if (!v) return res.status(404).json({ error: "Not found" });
  res.json(v);
});

/* --------------- protected writes --------------- */
searchRouter.post("/vehicles", requireAuth, async (req: Request, res: Response) => {
  const payload = req.body as Vehicle;
  if (!payload?.vin) return res.status(400).json({ error: "VIN is required" });

  if (req.user?.role === "dealer") {
    payload.dealerId = req.user.dealerId ?? null;
    payload.ownerUserId = null;
  } else if (req.user?.role === "consumer") {
    payload.ownerUserId = req.user.id;
    payload.dealerId = null;
    payload.inStock = false;
  }

  const saved = await upsertVehicle(payload);
  res.status(201).json(saved);
});

searchRouter.patch("/vehicles/:vin", requireAuth, async (req: Request, res: Response) => {
  const vin = req.params.vin;
  const target = await getVehicle(vin);
  if (!target) return res.status(404).json({ error: "Not found" });

  if (req.user?.role !== "admin") {
    const ownsAsDealer = req.user?.role === "dealer" && target.dealerId === req.user?.dealerId;
    const ownsAsConsumer = req.user?.role === "consumer" && target.ownerUserId === req.user?.id;
    if (!ownsAsDealer && !ownsAsConsumer) return res.status(403).json({ error: "Forbidden" });
  }

  const updated = await patchVehicle(vin, req.body as Partial<Vehicle>);
  res.json(updated);
});

searchRouter.post("/vehicles/:vin/sold", requireAuth, async (req: Request, res: Response) => {
  const vin = req.params.vin;
  const target = await getVehicle(vin);
  if (!target) return res.status(404).json({ error: "Not found" });

  if (req.user?.role !== "admin") {
    const ownsAsDealer = req.user?.role === "dealer" && target.dealerId === req.user?.dealerId;
    const ownsAsConsumer = req.user?.role === "consumer" && target.ownerUserId === req.user?.id;
    if (!ownsAsDealer && !ownsAsConsumer) return res.status(403).json({ error: "Forbidden" });
  }

  const body: any = req.body || {};
  const note: string | undefined = body.note ? String(body.note) : undefined;
  const updated = await markSold(vin, note);
  res.json(updated);
});

searchRouter.delete("/vehicles/:vin", requireAuth, async (req: Request, res: Response) => {
  const vin = req.params.vin;
  const target = await getVehicle(vin);
  if (!target) return res.status(404).json({ error: "Not found" });

  if (req.user?.role !== "admin") {
    const ownsAsDealer = req.user?.role === "dealer" && target.dealerId === req.user?.dealerId;
    const ownsAsConsumer = req.user?.role === "consumer" && target.ownerUserId === req.user?.id;
    if (!ownsAsDealer && !ownsAsConsumer) return res.status(403).json({ error: "Forbidden" });
  }

  const ok = await deleteVehicle(vin);
  if (!ok) return res.status(404).json({ error: "Not found" });
  res.status(204).send();
});

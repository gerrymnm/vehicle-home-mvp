import { Router, Request, Response } from "express";
import { listEvents, addEvent } from "./store/sqlstore";
import type { VehicleEvent, VehicleEventType } from "./store/sqlstore";

export const eventsRouter = Router();

eventsRouter.get("/events", async (req: Request, res: Response) => {
  const vin = (req.query.vin as string) || undefined;
  const type = (req.query.type as VehicleEventType) || undefined;

  let since: Date | undefined;
  if (req.query.since) {
    const raw = String(req.query.since);
    const t = /^\d+$/.test(raw) ? new Date(Number(raw)) : new Date(raw);
    if (!isNaN(t.getTime())) since = t;
  }

  const limit = req.query.limit ? Math.max(1, Number(req.query.limit)) : 100;
  const events = await listEvents({ vin, type, since, limit });
  res.json({ count: events.length, events });
});

eventsRouter.post("/events", async (req: Request, res: Response) => {
  const body = req.body as Partial<VehicleEvent>;
  if (!body?.vin || !body?.type) {
    return res.status(400).json({ error: "vin and type are required" });
  }
  const created = await addEvent({
    vin: body.vin,
    type: body.type as VehicleEventType,
    note: body.note,
    payload: body.payload
  });
  res.status(201).json(created);
});

eventsRouter.get("/vehicles/:vin/events", async (req: Request, res: Response) => {
  const { vin } = req.params;
  const events = await listEvents({ vin, limit: 500 });
  res.json({ vin, count: events.length, events });
});

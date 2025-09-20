import { Router, Request, Response } from "express";
import { metricsSummary } from "./store/sqlstore";
import type { MetricsQuery } from "./store/sqlstore";

export const metricsRouter = Router();

metricsRouter.get("/metrics/summary", async (req: Request, res: Response) => {
  const includeOutOfStock = (() => {
    const v = req.query.includeOutOfStock;
    if (v === undefined) return false;
    const s = String(v).toLowerCase();
    if (["true","1","yes","y"].includes(s)) return true;
    if (["false","0","no","n"].includes(s)) return false;
    return false;
  })();

  const query: MetricsQuery = {
    make: (req.query.make as string) || undefined,
    model: (req.query.model as string) || undefined,
    trim: (req.query.trim as string) || undefined,
    includeOutOfStock,
  };

  const out = await metricsSummary(query);
  res.json(out);
});

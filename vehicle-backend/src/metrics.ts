import { Router, Request, Response } from "express";

const router = Router();

router.get("/metrics/health", (_req: Request, res: Response) => {
  res.json({ ok: true });
});

export { router as metricsRouter };
export default router;


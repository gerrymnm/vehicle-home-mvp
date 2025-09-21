import { Router, Request, Response } from "express";

const router = Router();

router.get("/events", (_req: Request, res: Response) => {
  res.json({ ok: true, events: [] });
});

export { router as eventsRouter };
export default router;

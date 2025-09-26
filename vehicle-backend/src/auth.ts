import { Router, type Request, type Response } from "express";
import { requireAuth, signAccessToken, signRefreshToken } from "./auth_mw";

const router = Router();

/** POST /api/auth/login — demo login returning tokens */
router.post("/login", async (req: Request, res: Response) => {
  const { email, role = "dealer" } = req.body || {};
  if (!email) return res.status(400).json({ error: "email_required" });

  const payload = { sub: email, email, role };
  const access = signAccessToken(payload);
  const refresh = signRefreshToken(payload);
  return res.json({ user: payload, access, refresh });
});

/** GET /api/auth/me — requires bearer token */
router.get("/me", requireAuth, (req: Request, res: Response) => {
  return res.json({ user: req.user ?? null });
});

export default router;

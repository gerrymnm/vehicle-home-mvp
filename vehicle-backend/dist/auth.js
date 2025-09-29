"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// vehicle-backend/src/auth.ts
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
// Minimal demo login that issues a JWT. Replace with real user auth later.
router.post("/auth/login", async (req, res) => {
    const { email = "user@example.com", role = "dealer", id = "u1" } = req.body ?? {};
    const token = jsonwebtoken_1.default.sign({ id, email, role }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ ok: true, token });
});
// Who am I? (requires auth middleware upstream if you want it enforced)
router.get("/auth/me", (req, res) => {
    res.json({ ok: true, user: req.user ?? null });
});
exports.default = router;

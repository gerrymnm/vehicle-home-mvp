"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = require("./db");
const auth_mw_1 = require("./auth_mw");
exports.authRouter = (0, express_1.Router)();
function toUser(row) {
    return { id: row.id, email: row.email, role: row.role, dealerId: row.dealer_id ?? null };
}
/** POST /api/auth/register */
exports.authRouter.post("/auth/register", async (req, res) => {
    const { email, password, role, dealerName } = req.body || {};
    if (!email || !password || !role)
        return res.status(400).json({ error: "email, password, role required" });
    if (!["dealer", "consumer", "admin"].includes(role))
        return res.status(400).json({ error: "invalid role" });
    const db = (0, db_1.getPool)();
    const client = await db.connect();
    try {
        const exists = await client.query("SELECT id FROM users WHERE email=$1", [email]);
        if (exists.rowCount)
            return res.status(409).json({ error: "email already exists" });
        await client.query("BEGIN");
        let dealerId = null;
        if (role === "dealer") {
            if (!dealerName)
                return res.status(400).json({ error: "dealerName required for dealer role" });
            const d = await client.query(`INSERT INTO dealers(name) VALUES ($1) RETURNING id`, [dealerName]);
            dealerId = Number(d.rows[0].id);
        }
        const hash = await bcryptjs_1.default.hash(password, 10);
        const u = await client.query(`INSERT INTO users(email, password_hash, role, dealer_id)
       VALUES ($1,$2,$3,$4) RETURNING id, email, role, dealer_id`, [email, hash, role, dealerId]);
        await client.query("COMMIT");
        const user = toUser(u.rows[0]);
        const access = (0, auth_mw_1.signAccessToken)(user);
        const refresh = (0, auth_mw_1.signRefreshToken)(user);
        res.status(201).json({ user, access, refresh });
    }
    catch (e) {
        await client.query("ROLLBACK");
        res.status(500).json({ error: "registration failed" });
    }
    finally {
        client.release();
    }
});
/** POST /api/auth/login */
exports.authRouter.post("/auth/login", async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password)
        return res.status(400).json({ error: "email and password required" });
    const db = (0, db_1.getPool)();
    const r = await db.query(`SELECT * FROM users WHERE email=$1`, [email]);
    if (!r.rowCount)
        return res.status(401).json({ error: "invalid credentials" });
    const row = r.rows[0];
    const ok = await bcryptjs_1.default.compare(password, row.password_hash);
    if (!ok)
        return res.status(401).json({ error: "invalid credentials" });
    const user = toUser(row);
    const access = (0, auth_mw_1.signAccessToken)(user);
    const refresh = (0, auth_mw_1.signRefreshToken)(user);
    res.json({ user, access, refresh });
});
/** POST /api/auth/refresh */
exports.authRouter.post("/auth/refresh", async (req, res) => {
    const { refresh } = req.body || {};
    if (!refresh)
        return res.status(400).json({ error: "refresh token required" });
    try {
        const jwt = require("jsonwebtoken");
        const payload = jwt.verify(refresh, process.env.JWT_SECRET || "dev-secret-change-me");
        if (payload.type !== "refresh")
            throw new Error("bad token");
        const db = (0, db_1.getPool)();
        const r = await db.query(`SELECT * FROM users WHERE id=$1`, [Number(payload.sub)]);
        if (!r.rowCount)
            return res.status(401).json({ error: "invalid token" });
        const user = toUser(r.rows[0]);
        const access = (0, auth_mw_1.signAccessToken)(user);
        res.json({ access });
    }
    catch {
        res.status(401).json({ error: "invalid token" });
    }
});
/** GET /api/auth/me */
exports.authRouter.get("/auth/me", auth_mw_1.requireAuth, (req, res) => {
    res.json({ user: req.user });
});

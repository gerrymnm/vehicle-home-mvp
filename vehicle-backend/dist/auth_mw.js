"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAccessToken = signAccessToken;
exports.signRefreshToken = signRefreshToken;
exports.requireAuth = requireAuth;
exports.requireRole = requireRole;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
function signAccessToken(user) {
    return jsonwebtoken_1.default.sign({ sub: user.id, email: user.email, role: user.role, dealerId: user.dealerId ?? null }, JWT_SECRET, { expiresIn: "30m" });
}
function signRefreshToken(user) {
    return jsonwebtoken_1.default.sign({ sub: user.id, type: "refresh" }, JWT_SECRET, { expiresIn: "30d" });
}
function requireAuth(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer "))
        return res.status(401).json({ error: "Unauthorized" });
    try {
        const payload = jsonwebtoken_1.default.verify(auth.slice(7), JWT_SECRET);
        req.user = {
            id: Number(payload.sub),
            email: payload.email,
            role: payload.role,
            dealerId: payload.dealerId ?? null,
        };
        next();
    }
    catch {
        res.status(401).json({ error: "Unauthorized" });
    }
}
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user)
            return res.status(401).json({ error: "Unauthorized" });
        if (!roles.includes(req.user.role))
            return res.status(403).json({ error: "Forbidden" });
        next();
    };
}

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = requireAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
function requireAuth(req, res, next) {
    try {
        const hdr = req.headers.authorization || "";
        const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
        if (!token)
            return res.status(401).json({ error: "missing_token" });
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = {
            id: decoded?.id ?? "unknown",
            role: decoded?.role ?? "consumer",
            email: decoded?.email
        };
        return next();
    }
    catch (e) {
        return res.status(401).json({ error: "invalid_token" });
    }
}

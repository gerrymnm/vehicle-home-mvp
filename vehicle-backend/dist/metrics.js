"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metricsRouter = void 0;
const express_1 = require("express");
const router = (0, express_1.Router)();
exports.metricsRouter = router;
router.get("/metrics/health", (_req, res) => {
    res.json({ ok: true });
});
exports.default = router;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventsRouter = void 0;
const express_1 = require("express");
const router = (0, express_1.Router)();
exports.eventsRouter = router;
router.get("/events", (_req, res) => {
    res.json({ ok: true, events: [] });
});
exports.default = router;

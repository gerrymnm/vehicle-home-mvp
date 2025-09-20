"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventsRouter = void 0;
const express_1 = require("express");
const sqlstore_1 = require("./store/sqlstore");
exports.eventsRouter = (0, express_1.Router)();
exports.eventsRouter.get("/events", async (req, res) => {
    const vin = req.query.vin || undefined;
    const type = req.query.type || undefined;
    let since;
    if (req.query.since) {
        const raw = String(req.query.since);
        const t = /^\d+$/.test(raw) ? new Date(Number(raw)) : new Date(raw);
        if (!isNaN(t.getTime()))
            since = t;
    }
    const limit = req.query.limit ? Math.max(1, Number(req.query.limit)) : 100;
    const events = await (0, sqlstore_1.listEvents)({ vin, type, since, limit });
    res.json({ count: events.length, events });
});
exports.eventsRouter.post("/events", async (req, res) => {
    const body = req.body;
    if (!body?.vin || !body?.type) {
        return res.status(400).json({ error: "vin and type are required" });
    }
    const created = await (0, sqlstore_1.addEvent)({
        vin: body.vin,
        type: body.type,
        note: body.note,
        payload: body.payload
    });
    res.status(201).json(created);
});
exports.eventsRouter.get("/vehicles/:vin/events", async (req, res) => {
    const { vin } = req.params;
    const events = await (0, sqlstore_1.listEvents)({ vin, limit: 500 });
    res.json({ vin, count: events.length, events });
});

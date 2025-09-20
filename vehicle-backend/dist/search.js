"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchRouter = void 0;
const express_1 = require("express");
const sqlstore_1 = require("./store/sqlstore");
const auth_mw_1 = require("./auth_mw");
exports.searchRouter = (0, express_1.Router)();
/* ----------------- helpers ----------------- */
function num(v) {
    if (v === undefined || v === null || v === "")
        return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
}
function bool(v) {
    if (v === undefined || v === null || v === "")
        return undefined;
    if (typeof v === "boolean")
        return v;
    const s = String(v).toLowerCase();
    if (["true", "1", "yes", "y"].includes(s))
        return true;
    if (["false", "0", "no", "n"].includes(s))
        return false;
    return undefined;
}
/* --------------- public search --------------- */
exports.searchRouter.get("/search", async (req, res) => {
    const results = await (0, sqlstore_1.queryVehiclesAdvanced)({
        q: req.query.q ?? "",
        make: req.query.make ?? undefined,
        model: req.query.model ?? undefined,
        trim: req.query.trim ?? undefined,
        yearMin: num(req.query.yearMin),
        yearMax: num(req.query.yearMax),
        priceMin: num(req.query.priceMin),
        priceMax: num(req.query.priceMax),
        mileageMin: num(req.query.mileageMin),
        mileageMax: num(req.query.mileageMax),
        sort: req.query.sort ?? undefined,
        dir: req.query.dir ?? "asc",
        page: num(req.query.page),
        pageSize: num(req.query.pageSize),
        includeOutOfStock: bool(req.query.includeOutOfStock)
    });
    res.json(results);
});
exports.searchRouter.get("/vehicles", async (req, res) => {
    const results = await (0, sqlstore_1.queryVehiclesAdvanced)({
        q: req.query.q ?? "",
        make: req.query.make ?? undefined,
        model: req.query.model ?? undefined,
        trim: req.query.trim ?? undefined,
        yearMin: num(req.query.yearMin),
        yearMax: num(req.query.yearMax),
        priceMin: num(req.query.priceMin),
        priceMax: num(req.query.priceMax),
        mileageMin: num(req.query.mileageMin),
        mileageMax: num(req.query.mileageMax),
        sort: req.query.sort ?? undefined,
        dir: req.query.dir ?? "asc",
        page: num(req.query.page),
        pageSize: num(req.query.pageSize),
        includeOutOfStock: bool(req.query.includeOutOfStock)
    });
    res.json(results);
});
exports.searchRouter.get("/vehicles/:vin", async (req, res) => {
    const v = await (0, sqlstore_1.getVehicle)(req.params.vin);
    if (!v)
        return res.status(404).json({ error: "Not found" });
    res.json(v);
});
/* --------------- protected writes --------------- */
exports.searchRouter.post("/vehicles", auth_mw_1.requireAuth, async (req, res) => {
    const payload = req.body;
    if (!payload?.vin)
        return res.status(400).json({ error: "VIN is required" });
    if (req.user?.role === "dealer") {
        payload.dealerId = req.user.dealerId ?? null;
        payload.ownerUserId = null;
    }
    else if (req.user?.role === "consumer") {
        payload.ownerUserId = req.user.id;
        payload.dealerId = null;
        payload.inStock = false;
    }
    const saved = await (0, sqlstore_1.upsertVehicle)(payload);
    res.status(201).json(saved);
});
exports.searchRouter.patch("/vehicles/:vin", auth_mw_1.requireAuth, async (req, res) => {
    const vin = req.params.vin;
    const target = await (0, sqlstore_1.getVehicle)(vin);
    if (!target)
        return res.status(404).json({ error: "Not found" });
    if (req.user?.role !== "admin") {
        const ownsAsDealer = req.user?.role === "dealer" && target.dealerId === req.user?.dealerId;
        const ownsAsConsumer = req.user?.role === "consumer" && target.ownerUserId === req.user?.id;
        if (!ownsAsDealer && !ownsAsConsumer)
            return res.status(403).json({ error: "Forbidden" });
    }
    const updated = await (0, sqlstore_1.patchVehicle)(vin, req.body);
    res.json(updated);
});
exports.searchRouter.post("/vehicles/:vin/sold", auth_mw_1.requireAuth, async (req, res) => {
    const vin = req.params.vin;
    const target = await (0, sqlstore_1.getVehicle)(vin);
    if (!target)
        return res.status(404).json({ error: "Not found" });
    if (req.user?.role !== "admin") {
        const ownsAsDealer = req.user?.role === "dealer" && target.dealerId === req.user?.dealerId;
        const ownsAsConsumer = req.user?.role === "consumer" && target.ownerUserId === req.user?.id;
        if (!ownsAsDealer && !ownsAsConsumer)
            return res.status(403).json({ error: "Forbidden" });
    }
    const body = req.body || {};
    const note = body.note ? String(body.note) : undefined;
    const updated = await (0, sqlstore_1.markSold)(vin, note);
    res.json(updated);
});
exports.searchRouter.delete("/vehicles/:vin", auth_mw_1.requireAuth, async (req, res) => {
    const vin = req.params.vin;
    const target = await (0, sqlstore_1.getVehicle)(vin);
    if (!target)
        return res.status(404).json({ error: "Not found" });
    if (req.user?.role !== "admin") {
        const ownsAsDealer = req.user?.role === "dealer" && target.dealerId === req.user?.dealerId;
        const ownsAsConsumer = req.user?.role === "consumer" && target.ownerUserId === req.user?.id;
        if (!ownsAsDealer && !ownsAsConsumer)
            return res.status(403).json({ error: "Forbidden" });
    }
    const ok = await (0, sqlstore_1.deleteVehicle)(vin);
    if (!ok)
        return res.status(404).json({ error: "Not found" });
    res.status(204).send();
});

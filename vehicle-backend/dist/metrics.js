"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metricsRouter = void 0;
const express_1 = require("express");
const sqlstore_1 = require("./store/sqlstore");
exports.metricsRouter = (0, express_1.Router)();
exports.metricsRouter.get("/metrics/summary", async (req, res) => {
    const includeOutOfStock = (() => {
        const v = req.query.includeOutOfStock;
        if (v === undefined)
            return false;
        const s = String(v).toLowerCase();
        if (["true", "1", "yes", "y"].includes(s))
            return true;
        if (["false", "0", "no", "n"].includes(s))
            return false;
        return false;
    })();
    const query = {
        make: req.query.make || undefined,
        model: req.query.model || undefined,
        trim: req.query.trim || undefined,
        includeOutOfStock,
    };
    const out = await (0, sqlstore_1.metricsSummary)(query);
    res.json(out);
});

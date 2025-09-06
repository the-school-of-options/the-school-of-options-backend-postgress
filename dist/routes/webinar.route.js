"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_js_1 = require("../config/database.js");
const webinar_entity_js_1 = require("../entities/webinar.entity.js");
const webinarRouter = (0, express_1.Router)();
webinarRouter.post("/register", async (req, res) => {
    try {
        const { email, name, webinarLink, source, preferedLanguage } = req.body;
        const repo = database_js_1.AppDataSource.getRepository(webinar_entity_js_1.Webinar);
        const webinar = await repo.create({
            email,
            name,
            webinarLink,
            source,
            preferedLanguage,
        });
        await repo.save(webinar);
        res.json({ ok: true, webinar });
    }
    catch (err) {
        res
            .status(500)
            .json({ ok: false, error: err?.message || "registered_failed" });
    }
});
exports.default = webinarRouter;

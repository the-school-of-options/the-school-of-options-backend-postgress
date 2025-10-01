"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_js_1 = require("../config/database.js");
const listmonk_service_js_1 = require("../services/listmonk.service.js");
const subscriber_entity_js_1 = require("../entities/subscriber.entity.js");
const emailHelper_js_1 = require("../utils/emailHelper.js");
const newsLetterRouter = (0, express_1.Router)();
function isValidEmail(email) {
    if (!email)
        return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
newsLetterRouter.post("/subscribe", async (req, res) => {
    try {
        const rawEmail = (req.body?.email ?? "").toString().trim();
        const email = rawEmail.toLowerCase();
        if (!isValidEmail(email)) {
            return res.status(400).json({ ok: false, error: "invalid_email" });
        }
        const repo = database_js_1.AppDataSource.getRepository(subscriber_entity_js_1.Subscribers);
        let user = await repo.findOne({ where: { email } });
        // if (user) {
        //   res.status(401).json({ error: "Email already subscribed" });
        // }
        let created = false;
        if (!user) {
            user = repo.create({
                email,
                name: req.body.name,
                subscribed: true,
            });
            await repo.save(user);
            created = true;
        }
        else if (!user.subscribed) {
            user.subscribed = true;
            await repo.save(user);
        }
        try {
            const lm = await (0, listmonk_service_js_1.upsertSubscriber)(email, user.name ?? null, req.body.listId !== undefined ? Number(req.body.listId) : null);
            if (lm?.data?.id && "listmonkId" in user && !user.listmonkId) {
                user.listmonkId = lm.data.id;
                await repo.save(user);
            }
        }
        catch (e) {
            return res.status(202).json({
                ok: true,
                user,
                warning: "listmonk_sync_deferred",
                detail: e?.message ?? "listmonk_upsert_failed",
            });
        }
        const emailSent = await emailHelper_js_1.EmailService.sendWelcomeToNewsLetter(user.email);
        return res.status(created ? 201 : 200).json({ ok: true, user });
    }
    catch (err) {
        return res
            .status(500)
            .json({ ok: false, error: err?.message || "subscribe_failed" });
    }
});
exports.default = newsLetterRouter;

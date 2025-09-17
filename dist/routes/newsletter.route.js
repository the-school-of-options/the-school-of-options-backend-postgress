"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_js_1 = require("../config/database.js");
const listmonk_service_js_1 = require("../services/listmonk.service.js");
const ses_service_js_1 = require("../services/ses.service.js");
const subscriber_entity_js_1 = require("../entities/subscriber.entity.js");
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
        if (user) {
            res.status(401).json({ error: "Email already subscribed" });
        }
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
            const lm = await (0, listmonk_service_js_1.upsertSubscriber)(email, user.name ?? null);
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
        return res.status(created ? 201 : 200).json({ ok: true, user });
    }
    catch (err) {
        return res
            .status(500)
            .json({ ok: false, error: err?.message || "subscribe_failed" });
    }
});
newsLetterRouter.get("/subscribers", async (req, res) => {
    try {
        const page = Number(req.query.page || 1);
        const limit = Number(req.query.limit || 50);
        const data = await (0, listmonk_service_js_1.listSubscribers)(limit, page);
        res.json({ ok: true, data });
    }
    catch (err) {
        res.status(500).json({ ok: false, error: err?.message || "list_failed" });
    }
});
newsLetterRouter.post("/campaign/listmonk", async (req, res) => {
    try {
        const { title, subject, html } = req.body;
        const result = await (0, listmonk_service_js_1.createAndStartCampaign)(title, subject, html);
        res.json({ ok: true, ...result });
    }
    catch (err) {
        res
            .status(500)
            .json({ ok: false, error: err?.message || "campaign_failed" });
    }
});
newsLetterRouter.post("/campaign/ses-bulk", async (req, res) => {
    try {
        const { toEmails, subject, html, text } = req.body;
        const result = await (0, ses_service_js_1.sendSesBulkPlain)(toEmails || [], subject, html, text);
        res.json({ ok: true, result });
    }
    catch (err) {
        res
            .status(500)
            .json({ ok: false, error: err?.message || "ses_bulk_failed" });
    }
});
exports.default = newsLetterRouter;

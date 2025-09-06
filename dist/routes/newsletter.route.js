"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_js_1 = require("../config/database.js");
const listmonk_service_1 = require("../services/listmonk.service");
const ses_service_1 = require("../services/ses.service");
const user_entity_1 = require("../entities/user.entity");
const newsLetterRouter = (0, express_1.Router)();
newsLetterRouter.post('/subscribe', async (req, res) => {
    try {
        const { email } = req.body;
        const repo = database_js_1.AppDataSource.getRepository(user_entity_1.User);
        let user = await repo.findOne({ where: { email } });
        if (user) {
            res.status(400).json({ ok: false, error: 'already_subscribed' });
        }
        if (!user) {
            user = repo.create({ email,
                subscribed: true
            });
            await repo.save(user);
        }
        else {
            user.subscribed = true;
            //   user.name = name ?? user.name;
            await repo.save(user);
        }
        // await upsertSubscriber(email);
        res.json({ ok: true, user });
    }
    catch (err) {
        res.status(500).json({ ok: false, error: err?.message || 'subscribe_failed' });
    }
});
// 2) List subscribers (from Listmonk)
newsLetterRouter.get('/subscribers', async (req, res) => {
    try {
        const page = Number(req.query.page || 1);
        const limit = Number(req.query.limit || 50);
        const data = await (0, listmonk_service_1.listSubscribers)(limit, page);
        res.json({ ok: true, data });
    }
    catch (err) {
        res.status(500).json({ ok: false, error: err?.message || 'list_failed' });
    }
});
// 3) Create + start a newsletter campaign in Listmonk (recommended path)
newsLetterRouter.post('/campaign/listmonk', async (req, res) => {
    try {
        const { title, subject, html } = req.body; // no validation
        const result = await (0, listmonk_service_1.createAndStartCampaign)(title, subject, html);
        res.json({ ok: true, ...result });
    }
    catch (err) {
        res.status(500).json({ ok: false, error: err?.message || 'campaign_failed' });
    }
});
// 4) Direct bulk send via SES (optional path)
newsLetterRouter.post('/campaign/ses-bulk', async (req, res) => {
    try {
        const { toEmails, subject, html, text } = req.body; // no validation
        const result = await (0, ses_service_1.sendSesBulkPlain)(toEmails || [], subject, html, text);
        res.json({ ok: true, result });
    }
    catch (err) {
        res.status(500).json({ ok: false, error: err?.message || 'ses_bulk_failed' });
    }
});
exports.default = newsLetterRouter;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_js_1 = require("../config/database.js");
const webinar_entity_js_1 = require("../entities/webinar.entity.js");
const axios_1 = __importDefault(require("axios"));
const listmonk_service_js_1 = require("../services/listmonk.service.js");
const emailHelper_js_1 = require("../utils/emailHelper.js");
const client = axios_1.default.create({
    baseURL: "https://mail.theschoolofoptions.com",
    headers: { "Content-Type": "application/json" },
    auth: {
        username: "tech-atomclass-api",
        password: "6DJKSXqcY788i10pt8AZIwGDyYL8tLZn",
    },
});
const webinarRouter = (0, express_1.Router)();
webinarRouter.post("/register", async (req, res) => {
    try {
        const { email, fullName, phoneNumber, source, webinarName } = req.body;
        if (!email || !webinarName) {
            return res.status(400).json({
                ok: false,
                error: "Email and webinarName are required",
            });
        }
        const findList = await client.get(`/api/lists?query=${webinarName}`);
        let listId = null;
        if (findList.data.data.results.length > 0) {
            listId = findList.data.data.results[0].id;
        }
        else {
            const resp = await client.post("/api/lists", {
                name: webinarName,
                type: "private",
                optin: "single",
            });
            if (resp.status === 200 && resp.data.data.id) {
                listId = resp.data.data.id;
            }
            else {
                return res.status(500).json({
                    ok: false,
                    error: "Failed to create list",
                });
            }
        }
        const repo = database_js_1.AppDataSource.getRepository(webinar_entity_js_1.Webinar);
        const webinar = repo.create({
            email,
            fullName,
            phoneNumber,
            source,
        });
        await repo.save(webinar);
        // Sync with Listmonk
        try {
            const lm = await (0, listmonk_service_js_1.upsertSubscriber)(email, fullName ?? null, req.body.listId !== undefined ? Number(req.body.listId) : listId);
            if (lm?.data?.id && !webinar.webinarName) {
                webinar.webinarName = webinarName;
                await repo.save(webinar);
            }
            const emailSent = await emailHelper_js_1.EmailService.sendWelcomeToWebinar(email, fullName, phoneNumber, webinarName);
        }
        catch (e) {
            console.error("Listmonk sync failed:", e);
            return res.status(202).json({
                ok: true,
                webinar,
                warning: "listmonk_sync_deferred",
                detail: e || "listmonk_upsert_failed",
            });
        }
        res.json({ ok: true, webinar });
    }
    catch (err) {
        console.error("Webinar registration failed:", err);
        res.status(500).json({
            ok: false,
            error: err || "registration_failed",
        });
    }
});
exports.default = webinarRouter;

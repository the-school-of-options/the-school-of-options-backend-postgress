import { Router } from "express";
import { AppDataSource } from "../config/database.js";
import { Webinar } from "../entities/webinar.entity.js";

import axios from "axios";
import { upsertSubscriber } from "../services/listmonk.service.js";
import { EmailService } from "../utils/emailHelper.js";

const client = axios.create({
  baseURL: "https://mail.theschoolofoptions.com",
  headers: { "Content-Type": "application/json" },
  auth: {
    username: "tech-atomclass-api",
    password: "6DJKSXqcY788i10pt8AZIwGDyYL8tLZn",
  },
});

const webinarRouter = Router();

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
    } else {
      const resp = await client.post("/api/lists", {
        name: webinarName,
        type: "private",
        optin: "single",
      });

      if (resp.status === 200 && resp.data.data.id) {
        listId = resp.data.data.id;
      } else {
        return res.status(500).json({
          ok: false,
          error: "Failed to create list",
        });
      }
    }

    const repo = AppDataSource.getRepository(Webinar);
    const webinar = repo.create({
      email,
      fullName,
      phoneNumber,
      source,
    });
    await repo.save(webinar);

    // Sync with Listmonk
    try {
      const lm = await upsertSubscriber(
        email,
        fullName ?? null,
        req.body.listId !== undefined ? Number(req.body.listId) : listId
      );

      if (lm?.data?.id && !webinar.webinarName) {
        webinar.webinarName = webinarName;
        await repo.save(webinar);
      }

      const emailSent = await EmailService.sendWelcomeToWebinar(
        email,
        fullName,
        phoneNumber,
        webinarName
      );
    } catch (e) {
      console.error("Listmonk sync failed:", e);
      return res.status(202).json({
        ok: true,
        webinar,
        warning: "listmonk_sync_deferred",
        detail: e || "listmonk_upsert_failed",
      });
    }

    res.json({ ok: true, webinar });
  } catch (err) {
    console.error("Webinar registration failed:", err);
    res.status(500).json({
      ok: false,
      error: err || "registration_failed",
    });
  }
});

export default webinarRouter;

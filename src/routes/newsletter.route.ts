import { Router } from "express";
import { AppDataSource } from "../config/database.js";
import { upsertSubscriber } from "../services/listmonk.service.js";
import { sendSesBulkPlain } from "../services/ses.service.js";
import { Subscribers } from "../entities/subscriber.entity.js";
import { AWSUtils } from "../utils/aws.js";
import { EmailService } from "../utils/emailHelper.js";

const newsLetterRouter = Router();

function isValidEmail(email?: string): email is string {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

newsLetterRouter.post("/subscribe", async (req, res) => {
  try {
    const rawEmail = (req.body?.email ?? "").toString().trim();
    const email = rawEmail.toLowerCase();
    if (!isValidEmail(email)) {
      return res.status(400).json({ ok: false, error: "invalid_email" });
    }

    const repo = AppDataSource.getRepository(Subscribers);

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
      } as Partial<Subscribers>);
      await repo.save(user);
      created = true;
    } else if (!user.subscribed) {
      user.subscribed = true;
      await repo.save(user);
    }

    try {
      const lm = await upsertSubscriber(
        email,
        user.name ?? null,
        req.body.listId !== undefined ? Number(req.body.listId) : null
      );

      if (lm?.data?.id && "listmonkId" in user && !user.listmonkId) {
        (user as any).listmonkId = lm.data.id;
        await repo.save(user);
      }
    } catch (e: any) {
      return res.status(202).json({
        ok: true,
        user,
        warning: "listmonk_sync_deferred",
        detail: e?.message ?? "listmonk_upsert_failed",
      });
    }

    const emailSent = await EmailService.sendWelcomeToNewsLetter(
      user.email,
    );
    
    return res.status(created ? 201 : 200).json({ ok: true, user });
  } catch (err: any) {
    return res
      .status(500)
      .json({ ok: false, error: err?.message || "subscribe_failed" });
  }
});

export default newsLetterRouter;

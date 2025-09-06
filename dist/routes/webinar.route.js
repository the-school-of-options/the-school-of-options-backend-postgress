import { Router } from "express";
import { AppDataSource } from "../config/database.js";
import { Webinar } from "../entities/webinar.entity.js";
const webinarRouter = Router();
webinarRouter.post("/register", async (req, res) => {
    try {
        const { email, name, webinarLink, source, preferedLanguage } = req.body;
        const repo = AppDataSource.getRepository(Webinar);
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
export default webinarRouter;

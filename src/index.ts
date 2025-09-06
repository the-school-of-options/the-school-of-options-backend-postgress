import express from "express";
import dotenv from "dotenv";
import { initDB } from "./config/database";
import newsLetterRouter from "./routes/newsletter.route";
import webinarRouter from "./routes/webinar.route";

dotenv.config();

async function main() {
  await initDB();

  const app = express();
  app.use(express.json({ limit: "2mb" }));

  app.get("/api/v1/health", (_, res) => res.send("OK"));
  app.use("/api/v1/newsletter", newsLetterRouter);
  app.use("/api/v1/webinar", webinarRouter);

  const port = Number(process.env.PORT || 3000);
  app.listen(port, () => {
    console.log(`the-school-of-options API running on :${port}`);
  });
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

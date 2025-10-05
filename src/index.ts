import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initDB } from "./config/database";
import newsLetterRouter from "./routes/newsletter.route";
import webinarRouter from "./routes/webinar.route";
import authRouter from "./routes/auth.route";
import { AWSUtils } from "./utils/aws";
import { EMAIL_TEMPLATES } from "./constants/emailTemplates";
dotenv.config();

async function main() {
  await initDB();

  const app = express();
  
  // CORS configuration
  app.use(cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001', 
      'https://theschoolofoptions.com',
      'https://www.theschoolofoptions.com',
      'https://dev.theschoolofoptions.com',

    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }));

  app.use(express.json({ limit: "2mb" }));

  app.get("/api/v1/health", async (_req, res) => {
    res.json({ status: "OK", timestamp: new Date().toISOString() });  
  });
  app.use("/api/v1/newsletter", newsLetterRouter);
  app.use("/api/v1/webinar", webinarRouter);
  app.use("/api/v1/auth", authRouter);

  const port = Number(process.env.PORT || 8000);
  app.listen(port, () => {
    console.log(`the-school-of-options API running on :${port}`);
  });
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
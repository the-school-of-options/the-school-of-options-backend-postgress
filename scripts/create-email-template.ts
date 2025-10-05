import { AWSUtils } from "../src/utils/aws";
import { EMAIL_TEMPLATES } from "../src/constants/emailTemplates";
import "dotenv/config";

async function createEmailVerificationTemplate() {
  console.log("Creating EmailVerificationLink template in AWS SES...");

  const result = await AWSUtils.createTemplate(EMAIL_TEMPLATES.EMAIL_VERIFICATION_LINK);

  if (result) {
    console.log("✅ Email verification template created successfully!");
  } else {
    console.log("❌ Failed to create email verification template");
    process.exit(1);
  }
}

createEmailVerificationTemplate();

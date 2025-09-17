import { AWSUtils } from "./aws";

export class EmailService {
  static async sendOTP(
    email: string,
    otp: string,
    name: string,
    type: "email_verification" | "password_reset",
    expiryMinutes: number = 10
  ) {
    const templates = {
      email_verification: {
        subject: "Verify Your Email",
        template: "EmailVerificationOTP",
      },
      password_reset: {
        subject: "Reset Your Password",
        template: "PasswordResetOTP",
      },
    };

    const config = templates[type];

    if (!config) {
      throw new Error(`Invalid OTP type: ${type}`);
    }

    try {
      await AWSUtils.sendEmail(
        "hello@theschoolofoptions.com",
        [email],
        config.template,
        {
          name,
          otp,
          expiryMinutes: expiryMinutes.toString(),
        }
      );
      return { success: true, message: "OTP email sent successfully" };
    } catch (error: any) {
      console.error("Failed to send OTP email:", error);
      return { success: false, message: "Failed to send OTP email", error };
    }
  }

  static async sendTalkToCounsellorEmail(
    name: string,
    email: string,
    phone: string
  ) {
    try {
      await AWSUtils.sendEmail(
        "hello@theschoolofoptions.com",
        ["hello@theschoolofoptions.com"],
        "CounsellorRequest",
        {
          fullName: name,
          email,
          phone,
        }
      );
      return {
        success: true,
        message: "Talk to Counsellor email sent successfully",
      };
    } catch (error: any) {
      console.error("Failed to send Talk to Counsellor email:", error);
      return {
        success: false,
        message: "Failed to send Talk to Counsellor email",
        error,
      };
    }
  }

  static async sendWelcomeToNewsLetter(email: string) {
    try {
      await AWSUtils.sendEmail(
        "hello@theschoolofoptions.com",
        [email],
        "NewsletterWelcome",
        {
          email,
        }
      );
      return {
        success: true,
        message: "News Letter Subcribed SuccessFully",
      };
    } catch (error: any) {
      console.error("Failed to News Letter Subcribed email:", error);
      return {
        success: false,
        message: "Failed to News Letter Subcribed email",
        error,
      };
    }
  }

  static async sendWelcomeToWebinar(
    email: string,
    fullName: string,
    phoneNumber: string,
    webinarName: string
  ) {
    try {
      await AWSUtils.sendEmail(
        "hello@theschoolofoptions.com",
        [email],
        "WebinarRegistrationThankYou",
        {
          email,
          fullName,
          phoneNumber,
          webinarName,
        }
      );
      return {
        success: true,
        message: "News Letter Subcribed SuccessFully",
      };
    } catch (error: any) {
      console.error("Failed to News Letter Subcribed email:", error);
      return {
        success: false,
        message: "Failed to News Letter Subcribed email",
        error,
      };
    }
  }
}

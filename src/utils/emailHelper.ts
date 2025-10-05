import { AWSUtils } from "./aws";

export class EmailService {
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

  static async passwordReset(
    email: string,
    link:string,
    expiryMinutes: number = 60
  ) {
    try {
      await AWSUtils.sendEmail(
        "hello@theschoolofoptions.com",
        [email],
        "PasswordResetLink-SchoolOfOptions",
        {
          email,
          link,
          expiryMinutes: expiryMinutes.toString()
        }
      );
      return {
        success: true,
        message: "Password Reset Link sent Successfully",
      };
    } catch (error: any) {
      console.error("Failed to send Password Reset Link email:", error);
      return {
        success: false,
        message: "Failed to send Password Reset Link email",
        error,
      };
    }
  }

  static async emailVerification(
    email: string,
    name: string,
    link: string,
    expiryMinutes: number = 60
  ) {
    try {
      await AWSUtils.sendEmail(
        "hello@theschoolofoptions.com",
        [email],
        "EmailVerificationLink-TheSchoolOfOptions",
        {
          name,
          email,
          link,
          expiryMinutes: expiryMinutes.toString()
        }
      );
      return true;
    } catch (error: any) {
      console.error("Failed to send email verification link:", error);
      return false;
    }
  }
}

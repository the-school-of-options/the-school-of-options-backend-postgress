import { OtpType } from "../entities/user.entity";

export class OTPService {
  static generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  static createOTPData(
    type: OtpType, // Use the enum instead of string literals
    expiryMinutes: number = 10
  ) {
    return {
      code: this.generateOTP(),
      expiresAt: new Date(Date.now() + expiryMinutes * 60 * 1000),
      attempts: 0,
      lastSentAt: new Date(),
      verified: false,
      type,
    };
  }

  static validateOTP(
    storedOTP: any,
    providedOTP: string
  ): { valid: boolean; message: string } {
    if (!storedOTP) {
      return {
        valid: false,
        message: "No OTP found. Please request a new one.",
      };
    }

    if (storedOTP.verified) {
      return { valid: false, message: "OTP has already been used." };
    }

    if (storedOTP.attempts >= 5) {
      return {
        valid: false,
        message: "Maximum OTP attempts exceeded. Please request a new one.",
      };
    }

    if (new Date() > storedOTP.expiresAt) {
      return {
        valid: false,
        message: "OTP has expired. Please request a new one.",
      };
    }

    if (storedOTP.code !== providedOTP) {
      return { valid: false, message: "Invalid OTP. Please try again." };
    }

    return { valid: true, message: "OTP verified successfully." };
  }

  static canResendOTP(lastSentAt?: Date, cooldownMinutes: number = 1): boolean {
    if (!lastSentAt) return true;

    const now = new Date();
    const timeDiff = now.getTime() - lastSentAt.getTime();
    const minutesDiff = timeDiff / (1000 * 60);

    return minutesDiff >= cooldownMinutes;
  }
}

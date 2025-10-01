import { Request, Response } from "express";
import { OTPService } from "../utils/otp";
import { authService } from "../services/auth.service";
import { AppDataSource } from "../config/database";
import { OtpType, User } from "../entities/user.entity";
import { EmailService } from "../utils/emailHelper";
import axios from "axios";

const userRepository = AppDataSource.getRepository(User);

const verifyOTP = async (req: Request, res: Response) => {
  const { email, otp, password } = req.body;

  try {
    if (!email || !otp) {
      return res.status(400).json({
        error: "Email and OTP are required",
      });
    }

    const user = await userRepository.findOne({
      where: { email: email.toLowerCase() },
    });
    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        error: "Email is already verified",
      });
    }

    if (user.otp) {
      user.otp.attempts = (user.otp.attempts || 0) + 1;
    }

    const validation = OTPService.validateOTP(user.otp, otp);

    if (!validation.valid) {
      await userRepository.save(user);
      return res.status(400).json({
        error: validation.message,
        attemptsRemaining: user.otp ? 5 - (user.otp.attempts || 0) : 0,
      });
    }

    user.isVerified = true;
    if (user.otp) {
      user.otp.verified = true;
    }
    await userRepository.save(user);
    if (!user.cognitoId) {
      return res.status(500).json({
        error: "User does not have a valid Cognito ID",
      });
    }
    await authService.verifyUserEmail(user.cognitoId);

    const tokens = await authService.loginUser(user.email, password);

      // Send WhatsApp message if mobile number is provided
    if (user.mobileNumber) {
      try {
        const sendWhatsapp = await axios.post('https://backend.aisensy.com/campaign/t1/api/v2', {
          apiKey: process.env.AI_SENSY_ACCESS_TOKEN!,
          campaignName: process.env.AI_SENSY_CAMPAIGN_NAME! ,
          destination: user.mobileNumber,
          userName: user.fullName,
          templateParams: [],
          source: "new-landing-page form",
          media: {},
          buttons: [],
          carouselCards: [],
          location: {},
          attributes: {},
          paramsFallbackValue: {}
        });
        console.log('WhatsApp response:', sendWhatsapp.data);
      } catch (whatsappError) {
        console.error('Failed to send WhatsApp message:', whatsappError);
        // Don't fail the entire signup if WhatsApp fails
      }
    }

    res.json({
      message: "Email verified successfully",
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isVerified: user.isVerified,
      },
      tokens,
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({
      error: "An error occurred during verification",
    });
  }
};

const resendOTP = async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({
        error: "Email is required",
      });
    }

    const user = await userRepository.findOne({
      where: { email: email.toLowerCase() },
    });
    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        error: "Email is already verified",
      });
    }

    // Check rate limiting
    if (
      user.otp &&
      !OTPService.canResendOTP(user.otp.lastSentAt ?? undefined)
    ) {
      return res.status(429).json({
        error: "Please wait before requesting another OTP",
      });
    }

    // Generate new OTP
    const otpData = OTPService.createOTPData(OtpType.EMAIL_VERIFICATION);
    if (otpData) {
      user.otp = otpData;
      await userRepository.save(user);
    }

    // Send OTP
    const emailSent = await EmailService.sendOTP(
      user.email,
      otpData.code,
      user.fullName,
      "email_verification"
    );

    if (!emailSent) {
      return res.status(500).json({
        error: "Failed to send OTP. Please try again.",
      });
    }

    res.json({
      message: "OTP resent successfully",
      otpSent: true,
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({
      error: "An error occurred while resending OTP",
    });
  }
};

export const otpController = {
  verifyOTP,
  resendOTP,
};

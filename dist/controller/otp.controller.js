"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.otpController = void 0;
const otp_1 = require("../utils/otp");
const auth_service_1 = require("../services/auth.service");
const database_1 = require("../config/database");
const user_entity_1 = require("../entities/user.entity");
const emailHelper_1 = require("../utils/emailHelper");
const userRepository = database_1.AppDataSource.getRepository(user_entity_1.User);
const verifyOTP = async (req, res) => {
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
        const validation = otp_1.OTPService.validateOTP(user.otp, otp);
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
        await auth_service_1.authService.verifyUserEmail(user.cognitoId);
        const tokens = await auth_service_1.authService.loginUser(user.email, password);
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
    }
    catch (error) {
        console.error("OTP verification error:", error);
        res.status(500).json({
            error: "An error occurred during verification",
        });
    }
};
const resendOTP = async (req, res) => {
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
        if (user.otp &&
            !otp_1.OTPService.canResendOTP(user.otp.lastSentAt ?? undefined)) {
            return res.status(429).json({
                error: "Please wait before requesting another OTP",
            });
        }
        // Generate new OTP
        const otpData = otp_1.OTPService.createOTPData(user_entity_1.OtpType.EMAIL_VERIFICATION);
        if (otpData) {
            user.otp = otpData;
            await userRepository.save(user);
        }
        // Send OTP
        const emailSent = await emailHelper_1.EmailService.sendOTP(user.email, otpData.code, user.fullName, "email_verification");
        if (!emailSent) {
            return res.status(500).json({
                error: "Failed to send OTP. Please try again.",
            });
        }
        res.json({
            message: "OTP resent successfully",
            otpSent: true,
        });
    }
    catch (error) {
        console.error("Resend OTP error:", error);
        res.status(500).json({
            error: "An error occurred while resending OTP",
        });
    }
};
exports.otpController = {
    verifyOTP,
    resendOTP,
};

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const auth_service_1 = require("../services/auth.service");
const user_service_1 = require("../services/user.service");
const bcryptUtils_1 = require("../utils/bcryptUtils");
const database_1 = require("../config/database");
const user_entity_1 = require("../entities/user.entity");
const otp_1 = require("../utils/otp");
const emailHelper_1 = require("../utils/emailHelper");
const userRepository = database_1.AppDataSource.getRepository(user_entity_1.User);
const signUp = async (req, res) => {
    const { email, password, fullName } = req.body;
    try {
        if (!email || !password || !fullName) {
            return res.status(400).json({
                error: "Email, password, and full name are required",
            });
        }
        const existingUser = await user_service_1.userService.getUserByEmail(email);
        if (existingUser) {
            res.status(400).json({ error: "Email is already registered. Please log in." });
        }
        const cognitoUserId = await auth_service_1.authService.createUserInCognito(email, password);
        const userData = {
            fullName: fullName.trim(),
            email: email.toLowerCase().trim(),
            cognitoId: cognitoUserId,
            role: user_entity_1.UserRole.USER,
            isVerified: false,
            isActive: true,
            loginCount: 0,
        };
        const user = await user_service_1.userService.createUserData(userData);
        const otpData = otp_1.OTPService.createOTPData(user_entity_1.OtpType.EMAIL_VERIFICATION);
        user.otp = { ...otpData, type: user_entity_1.OtpType.EMAIL_VERIFICATION };
        await userRepository.save(user);
        const emailSent = await emailHelper_1.EmailService.sendOTP(user.email, otpData.code, user.fullName, user_entity_1.OtpType.EMAIL_VERIFICATION);
        if (!emailSent) {
            return res.status(500).json({
                error: "Failed to send verification email. Please try again.",
            });
        }
        const responseUser = {};
        res.status(200).json({
            message: "OTP sent to your email. Please verify to complete registration.",
            user: responseUser,
            otpSent: true,
        });
    }
    catch (err) {
        console.error("Signup error:", err);
    }
};
const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const userInfo = await user_service_1.userService.getUserByEmail(email);
        if (userInfo?.isVerified === false) {
            res.status(403).json({ error: "Please verify your email." });
            return;
        }
        const tokens = await auth_service_1.authService.loginUser(email, password);
        if (userInfo) {
            userInfo.lastLogin = new Date();
            userInfo.loginCount += 1;
            await userRepository.save(userInfo);
        }
        const decodedToken = tokens.AccessToken ? (0, bcryptUtils_1.decodeTokenPayload)(tokens.AccessToken) : undefined;
        res.json({
            tokens,
            user: {
                id: userInfo?.id,
                email: userInfo?.email,
                fullName: userInfo?.fullName,
                role: userInfo?.role,
                isVerified: userInfo?.isVerified,
            },
            username: decodedToken?.username,
        });
    }
    catch (err) {
        if (err instanceof Error) {
            res.status(400).json({ error: err.message });
        }
        else {
            res.status(400).json({ error: "An unexpected error occurred" });
        }
    }
};
const forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await user_service_1.userService.getUserByEmail(email);
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        if (!user.cognitoId) {
            res
                .status(400)
                .json({ message: "Password reset not applicable for this account." });
            return;
        }
        const resetToken = (0, bcryptUtils_1.createToken)(user.cognitoId, user.email, "1h");
        const resetLink = `${process.env.PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}`;
        const emailSent = await emailHelper_1.EmailService.sendOTP(user.email, resetLink, user.fullName, "password_reset");
        if (!emailSent) {
            return res.status(500).json({
                error: "Failed to send verification email. Please try again.",
            });
        }
        // res
        //   .status(200)
        //   .json({ message: "Password reset process initiated successfully." });
        res.status(200).json({ resetLink: resetLink });
    }
    catch (error) {
        console.error("Error during forgot password request:", error);
        if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: "An unexpected error occurred" });
        }
    }
};
const resetPassword = async (req, res) => {
    const { token, password } = req.body;
    try {
        if ((0, bcryptUtils_1.verifyToken)(token)) {
            const decodedToken = (0, bcryptUtils_1.decodeTokenPayload)(token);
            const userId = decodedToken.userId;
            await auth_service_1.authService.resetPassword(userId, password);
            res.json({ message: "Password reset successful" });
        }
        else {
            res.status(500).json({ message: "Error verifying token" });
            throw new Error("Error verifying token");
        }
    }
    catch (err) {
        res.status(400).json({ error: err });
    }
};
const getUserById = async (req, res) => {
    try {
        const { user } = req;
        const userInfo = await userRepository.findOne({
            where: { cognitoId: user.username },
        });
        if (!userInfo) {
            return res.status(404).json({ error: "User not found" });
        }
        // Create a copy without the OTP field
        const { otp, ...userWithoutOtp } = userInfo;
        res.json({ user: userWithoutOtp });
    }
    catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.authController = {
    signUp,
    login,
    forgotPassword,
    resetPassword,
    getUserById,
};

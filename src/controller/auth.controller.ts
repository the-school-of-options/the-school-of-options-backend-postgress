import { Request, Response } from "express";
import { authService } from "../services/auth.service";
import { userService } from "../services/user.service";
import {
  createToken,
  decodeTokenPayload,
  verifyToken,
} from "../utils/bcryptUtils";
import { AppDataSource } from "../config/database";
import { OtpType, User, UserRole } from "../entities/user.entity";
import { OTPService } from "../utils/otp";
import { EmailService } from "../utils/emailHelper";
import { AuthRequest } from "../types/authReq.types";
import axios from "axios";

const userRepository = AppDataSource.getRepository(User);

const signUp = async (req: Request, res: Response) => {
  const { email, password, fullName, mobileNumber, role } = req.body;

  try {
    if (!email || !password || !fullName) {
      return res.status(400).json({
        error: "Email, password, and full name are required",
      });
    }

    const existingUser = await userService.getUserByEmail(email);
    if(existingUser){
      return res.status(400).json({ error: "Email is already registered. Please log in." });
    }
    const cognitoUserId = await authService.createUserInCognito(
      email,
      password
    );

    const userRole = role && role === UserRole.SUPER_ADMIN ? UserRole.SUPER_ADMIN : UserRole.USER;

    const userData: Partial<User> = {
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      mobileNumber: mobileNumber ? mobileNumber.trim() : null,
      cognitoId: cognitoUserId,
      role: userRole,
      isVerified: false,
      isActive: true,
      loginCount: 0,
    };

    console.log("Creating user with data:", userData);

    const user = await userService.createUserData(userData);

    // Add user to Cognito group
    try {
      await authService.addUserToCognitoGroup(cognitoUserId, userRole);
    } catch (error) {
      console.error("Failed to add user to Cognito group:", error);
    }

    const otpData = OTPService.createOTPData(OtpType.EMAIL_VERIFICATION);
    user.otp = { ...otpData, type: OtpType.EMAIL_VERIFICATION };
    await userRepository.save(user);

  

    const emailSent = await EmailService.sendOTP(
      user.email,
      otpData.code,
      user.fullName,
      OtpType.EMAIL_VERIFICATION
    );

    if (!emailSent) {
      return res.status(500).json({
        error: "Failed to send verification email. Please try again.",
      });
    }

    const responseUser = {};

    res.status(200).json({
      message:
        "OTP sent to your email. Please verify to complete registration.",
      user: responseUser,
      otpSent: true,
    });
  } catch (err: unknown) {
    console.error("Signup error:", err);
    if (err instanceof Error) {
      res.status(400).json({ error: err.message });
    } else {
      res.status(500).json({ error: "An unexpected error occurred during signup" });
    }
  }
};

const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const userInfo = await userService.getUserByEmail(email);
    if (userInfo?.isVerified === false) {
      res.status(403).json({ error: "Please verify your email." });
      return;
    }
    const tokens = await authService.loginUser(email, password);

    if (userInfo && userInfo.cognitoId) {
      // Sync role from Cognito groups to database
      const cognitoRole = await authService.getUserRoleFromCognitoGroups(userInfo.cognitoId);

      if (cognitoRole && cognitoRole !== userInfo.role) {
        // Update database role to match Cognito group
        userInfo.role = cognitoRole as UserRole;
        console.log(`Updated user ${userInfo.email} role to ${cognitoRole} from Cognito groups`);
      } else if (!cognitoRole) {
        // Sync database role to Cognito if user is not in any group
        await authService.syncUserRoleWithCognitoGroups(userInfo.cognitoId, userInfo.role);
      }

      userInfo.lastLogin = new Date();
      userInfo.loginCount += 1;
      await userRepository.save(userInfo);
    }

    const decodedToken = tokens.AccessToken ? decodeTokenPayload(tokens.AccessToken) : undefined;
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
  } catch (err: unknown) {
    if (err instanceof Error) {
      res.status(400).json({ error: err.message });
    } else {
      res.status(400).json({ error: "An unexpected error occurred" });
    }
  }
};

const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  try {
    const user = await userService.getUserByEmail(email);

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

    const resetToken = createToken(user.cognitoId, user.email, "1h");

    const resetLink = `${process.env.PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}`;

    const emailSent = await EmailService.sendOTP(
      user.email,
      resetLink,
      user.fullName,
      "password_reset"
    );

    if (!emailSent) {
      return res.status(500).json({
        error: "Failed to send verification email. Please try again.",
      });
    }

    // res
    //   .status(200)
    //   .json({ message: "Password reset process initiated successfully." });

    res.status(200).json({ resetLink: resetLink });
  } catch (error) {
    console.error("Error during forgot password request:", error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "An unexpected error occurred" });
    }
  }
};

const resetPassword = async (req: Request, res: Response) => {
  const { token, password } = req.body;
  try {
    if (verifyToken(token)) {
      const decodedToken = decodeTokenPayload(token);
      const userId = decodedToken!.userId;

      await authService.resetPassword(userId, password);
      res.json({ message: "Password reset successful" });
    } else {
      res.status(500).json({ message: "Error verifying token" });
      throw new Error("Error verifying token");
    }
  } catch (err) {
    res.status(400).json({ error: err });
  }
};

const getUserById = async (req: AuthRequest, res: Response) => {
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
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const authController = {
  signUp,
  login,
  forgotPassword,
  resetPassword,
  getUserById,
};

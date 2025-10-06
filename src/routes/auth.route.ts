import { Router } from "express";
import { authService } from "../services/auth.service";
import { loginRequired } from "../middleware/auth.middleware";
import { authController } from "../controller/auth.controller";

const authRouter = Router();

authRouter.post("/signup", authController.signUp);
authRouter.post("/signup-without-verify", authController.signUpWithoutVerify);
authRouter.post("/login", authController.login);
authRouter.post("/verify-email", authController.verifyEmail);
authRouter.post("/resend-verification", authController.resendVerificationCode);
authRouter.post("/forgot-password", authController.forgotPassword);
authRouter.post("/reset-password", authController.resetPassword);
authRouter.get("/get-user", [loginRequired], authController.getUserById);
authRouter.post("/refresh-token", async (req, res, next) => {
  try {
    const tokens = await authService.refreshTokens(
      req.body.email,
      req.body.refreshToken
    );
    res.json({ payload: tokens });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

export default authRouter;

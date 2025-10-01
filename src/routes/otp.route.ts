import { Router } from "express";
import { otpController } from "../controller/otp.controller";

const otpRouter = Router();

otpRouter.post("/verify", otpController.verifyOTP);
otpRouter.post("/generate", otpController.resendOTP);


export default otpRouter;

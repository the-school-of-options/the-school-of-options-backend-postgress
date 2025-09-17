"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const otp_controller_1 = require("../controller/otp.controller");
const otpRouter = (0, express_1.Router)();
otpRouter.post("/verify", otp_controller_1.otpController.verifyOTP);
otpRouter.post("/generate", otp_controller_1.otpController.resendOTP);
exports.default = otpRouter;

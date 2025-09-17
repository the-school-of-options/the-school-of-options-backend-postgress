"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_service_1 = require("../services/auth.service");
const auth_middleware_1 = require("../middleware/auth.middleware");
const auth_controller_1 = require("../controller/auth.controller");
const authRouter = (0, express_1.Router)();
authRouter.post("/signup", auth_controller_1.authController.signUp);
authRouter.post("/login", auth_controller_1.authController.login);
authRouter.post("/forgot-password", auth_controller_1.authController.forgotPassword);
authRouter.post("/reset-password", auth_controller_1.authController.resetPassword);
authRouter.get("/get-user", [auth_middleware_1.loginRequired], auth_controller_1.authController.getUserById);
authRouter.post("/refresh-token", async (req, res, next) => {
    try {
        const tokens = await auth_service_1.authService.refreshTokens(req.body.email, req.body.refreshToken);
        res.json({ payload: tokens });
    }
    catch (err) {
        console.error(err);
        next(err);
    }
});
exports.default = authRouter;

"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.userPoolId = exports.cognitoIdentityServiceProvider = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const client_cognito_identity_provider_1 = require("@aws-sdk/client-cognito-identity-provider");
const crypto = __importStar(require("crypto"));
const uuid_1 = require("uuid");
const user_entity_1 = require("../entities/user.entity");
const database_1 = require("../config/database");
const userRepository = database_1.AppDataSource.getRepository(user_entity_1.User);
exports.cognitoIdentityServiceProvider = new client_cognito_identity_provider_1.CognitoIdentityProvider({
    region: process.env.AWS_REGION || "",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
});
const clientId = process.env.AWS_COGNITO_CLIENT_ID || "";
exports.userPoolId = process.env.AWS_COGNITO_USER_POOL_ID || "";
exports.authService = {
    checkUserExistsByEmail: async (email) => {
        try {
            const users = await exports.cognitoIdentityServiceProvider.listUsers({
                UserPoolId: exports.userPoolId,
                Filter: `email = "${email.toLowerCase()}"`,
            });
            return users.Users && users.Users.length > 0 ? users.Users[0] : null;
        }
        catch (error) {
            console.error("Error checking user existence:", error);
            return null;
        }
    },
    findUserByEmail: async (email) => {
        try {
            const users = await exports.cognitoIdentityServiceProvider.listUsers({
                UserPoolId: exports.userPoolId,
                Filter: `email = "${email.toLowerCase()}"`,
            });
            return users.Users && users.Users.length > 0 ? users.Users[0] : null;
        }
        catch (error) {
            console.error("Error finding user by email:", error);
            return null;
        }
    },
    createUserInCognito: async (email, password) => {
        const userId = (0, uuid_1.v4)();
        try {
            const existingUser = await exports.authService.checkUserExistsByEmail(email);
            if (existingUser) {
                throw new Error(`User with email ${email} already exists`);
            }
            const params = {
                UserPoolId: exports.userPoolId,
                Username: userId,
                TemporaryPassword: password,
                MessageAction: client_cognito_identity_provider_1.MessageActionType.SUPPRESS,
                UserAttributes: [
                    { Name: "email", Value: email.toLowerCase() },
                    { Name: "preferred_username", Value: userId },
                    { Name: "email_verified", Value: "false" },
                ],
            };
            await exports.cognitoIdentityServiceProvider.adminCreateUser(params);
            await exports.cognitoIdentityServiceProvider.adminSetUserPassword({
                UserPoolId: exports.userPoolId,
                Username: userId,
                Password: password,
                Permanent: true,
            });
            return userId;
        }
        catch (error) {
            console.error("Error creating user in cognito:", error);
            if (error.code === "UsernameExistsException") {
                throw new Error(`User with email ${email} already exists`);
            }
            if (error.code === "InvalidPasswordException") {
                throw new Error("Password does not meet requirements");
            }
            if (error.code === "InvalidParameterException") {
                throw new Error("Invalid email format");
            }
            if (error.code === "TooManyRequestsException") {
                throw new Error("Too many requests. Please try again later");
            }
            throw error;
        }
    },
    createGoogleUserInCognito: async (email) => {
        const userId = (0, uuid_1.v4)();
        try {
            const existingUser = await exports.authService.checkUserExistsByEmail(email);
            if (existingUser) {
                throw new Error(`User with email ${email} already exists`);
            }
            const params = {
                UserPoolId: exports.userPoolId,
                Username: userId,
                MessageAction: client_cognito_identity_provider_1.MessageActionType.SUPPRESS,
                UserAttributes: [
                    { Name: "email", Value: email.toLowerCase() },
                    { Name: "preferred_username", Value: userId },
                    { Name: "email_verified", Value: "true" },
                ],
            };
            await exports.cognitoIdentityServiceProvider.adminCreateUser(params);
            const userDetails = await exports.cognitoIdentityServiceProvider.adminGetUser({
                UserPoolId: exports.userPoolId,
                Username: userId,
            });
            console.log("User status after creation:", userDetails.UserStatus);
            if (userDetails.UserStatus === "FORCE_CHANGE_PASSWORD") {
                const tempPassword = crypto.randomBytes(32).toString("hex") + "A1!";
                // Set permanent password
                await exports.cognitoIdentityServiceProvider.adminSetUserPassword({
                    UserPoolId: exports.userPoolId,
                    Username: userId,
                    Password: tempPassword,
                    Permanent: true,
                });
                console.log("Password set to bypass FORCE_CHANGE_PASSWORD");
                // Check status again after setting password
                const updatedUserDetails = await exports.cognitoIdentityServiceProvider.adminGetUser({
                    UserPoolId: exports.userPoolId,
                    Username: userId,
                });
                console.log("User status after password set:", updatedUserDetails.UserStatus);
                // Only confirm if user is not already confirmed
                if (updatedUserDetails.UserStatus !== "CONFIRMED") {
                    await exports.cognitoIdentityServiceProvider.adminConfirmSignUp({
                        UserPoolId: exports.userPoolId,
                        Username: userId,
                    });
                    console.log("User confirmed after password set");
                }
                else {
                    console.log("User already confirmed after password set");
                }
            }
            else if (userDetails.UserStatus === "CONFIRMED") {
                console.log("User already confirmed, no action needed");
            }
            else {
                // For any other status, only confirm if not already confirmed
                console.log(`User status is ${userDetails.UserStatus}, attempting to confirm`);
                try {
                    await exports.cognitoIdentityServiceProvider.adminConfirmSignUp({
                        UserPoolId: exports.userPoolId,
                        Username: userId,
                    });
                    console.log("User confirmed successfully");
                }
                catch (confirmError) {
                    // If confirmation fails because user is already confirmed, that's okay
                    if (confirmError.code === "NotAuthorizedException" &&
                        confirmError.message.includes("Current status is CONFIRMED")) {
                        console.log("User was already confirmed, continuing...");
                    }
                    else {
                        throw confirmError;
                    }
                }
            }
            return userId;
        }
        catch (error) {
            console.error("Error creating Google user in cognito:", error);
            if (error.code === "UsernameExistsException") {
                throw new Error(`User with email ${email} already exists`);
            }
            if (error.code === "InvalidParameterException") {
                throw new Error("Invalid email format");
            }
            if (error.code === "TooManyRequestsException") {
                throw new Error("Too many requests. Please try again later");
            }
            if (error.code === "NotAuthorizedException") {
                // Handle the specific case we're seeing in the logs
                if (error.message.includes("Current status is CONFIRMED")) {
                    console.log("User confirmation attempted on already confirmed user, continuing...");
                    return userId;
                }
                throw new Error("Unable to confirm user. Please try again.");
            }
            throw error;
        }
    },
    loginUser: async (emailOrUsername, password) => {
        try {
            return await exports.authService.getTokens(client_cognito_identity_provider_1.AuthFlowType.ADMIN_NO_SRP_AUTH, {
                USERNAME: emailOrUsername,
                PASSWORD: password,
            });
        }
        catch (error) {
            if (emailOrUsername.includes("@")) {
                try {
                    const user = await exports.authService.findUserByEmail(emailOrUsername);
                    if (user && user.Username) {
                        return await exports.authService.getTokens(client_cognito_identity_provider_1.AuthFlowType.ADMIN_NO_SRP_AUTH, {
                            USERNAME: user.Username,
                            PASSWORD: password,
                        });
                    }
                }
                catch (fallbackError) {
                    console.error("Fallback login failed:", fallbackError);
                }
            }
            throw error;
        }
    },
    generateSecretHash: (username, clientId, clientSecret) => {
        const hmac = crypto.createHmac("sha256", clientSecret);
        hmac.update(username + clientId);
        return hmac.digest("base64");
    },
    getTokens: async (authFlow, authParams) => {
        try {
            const clientSecret = "7o77bdr6n8kglesd1ailmfa4raphdlpd4rh6nbjj8j31o5g4u3f";
            authParams.SECRET_HASH = exports.authService.generateSecretHash(authParams.USERNAME, clientId, clientSecret);
            const response = await exports.cognitoIdentityServiceProvider.adminInitiateAuth({
                UserPoolId: exports.userPoolId,
                ClientId: clientId,
                AuthFlow: authFlow,
                AuthParameters: authParams,
            });
            if (response.AuthenticationResult) {
                return response.AuthenticationResult;
            }
            else {
                console.error("Authentication failed:", response);
                throw new Error(`Authentication failed: ${response.ChallengeName || "Unknown error"}`);
            }
        }
        catch (error) {
            console.error("Full Cognito error:", {
                code: error.code,
                message: error.message,
                statusCode: error.$metadata?.httpStatusCode,
                requestId: error.$metadata?.requestId,
                authFlow: authFlow,
                hasSecretHash: !!authParams.SECRET_HASH,
                username: authParams.USERNAME,
            });
            // Check specific error codes
            if (error.code === "TooManyRequestsException") {
                throw new Error("Too many requests. Please try again later.");
            }
            if (error.code === "NotAuthorizedException") {
                throw new Error("Invalid credentials or account temporarily locked");
            }
            if (error.code === "UserNotConfirmedException") {
                throw new Error("User account not confirmed. Please verify your email.");
            }
            if (error.code === "UserNotFoundException") {
                throw new Error("User not found. Please check your email and try again.");
            }
            if (error.code === "InvalidUserPoolConfigurationException") {
                throw new Error("User pool configuration error. Please contact support.");
            }
            throw error;
        }
    },
    resetPassword: async (userIdentifier, password) => {
        try {
            let username = userIdentifier;
            if (userIdentifier.includes("@")) {
                const user = await exports.authService.findUserByEmail(userIdentifier);
                if (user && user.Username) {
                    username = user.Username;
                }
                else {
                    throw new Error("User not found with this email");
                }
            }
            const userDetails = await exports.cognitoIdentityServiceProvider.adminGetUser({
                UserPoolId: exports.userPoolId,
                Username: username,
            });
            console.log("User status before reset:", userDetails.UserStatus);
            await exports.cognitoIdentityServiceProvider.adminSetUserPassword({
                UserPoolId: exports.userPoolId,
                Username: username,
                Password: password,
                Permanent: true,
            });
            const postPasswordUserDetails = await exports.cognitoIdentityServiceProvider.adminGetUser({
                UserPoolId: exports.userPoolId,
                Username: username,
            });
            console.log("User status after setting password:", postPasswordUserDetails.UserStatus);
            if (postPasswordUserDetails.UserStatus !== "CONFIRMED") {
                await exports.cognitoIdentityServiceProvider.adminConfirmSignUp({
                    UserPoolId: exports.userPoolId,
                    Username: username,
                });
                console.log("User manually confirmed during reset");
            }
            else {
                console.log("User already confirmed by adminSetUserPassword");
            }
            await exports.cognitoIdentityServiceProvider.adminUpdateUserAttributes({
                UserPoolId: exports.userPoolId,
                Username: username,
                UserAttributes: [
                    {
                        Name: "email_verified",
                        Value: "true",
                    },
                ],
            });
            const finalUserDetails = await exports.cognitoIdentityServiceProvider.adminGetUser({
                UserPoolId: exports.userPoolId,
                Username: username,
            });
            console.log("Final user status after reset:", finalUserDetails.UserStatus);
            return {
                $metadata: finalUserDetails.$metadata,
            };
        }
        catch (error) {
            console.error("Reset password error:", error);
            if (error.code === "UserNotFoundException") {
                throw new Error("User not found. Please check the email and try again.");
            }
            if (error.code === "InvalidPasswordException") {
                throw new Error("Password does not meet requirements");
            }
            if (error.code === "TooManyRequestsException") {
                throw new Error("Too many requests. Please try again later");
            }
            throw new Error("Failed to reset password. Please try again.");
        }
    },
    confirmEmail: async (email, otp) => {
        try {
            const safeEmail = email.trim().toLowerCase();
            const userData = await userRepository.findOne({
                where: { email: safeEmail },
            });
            if (!userData) {
                throw new Error("User not found. Please try registering again.");
            }
            if (!userData.otp || !userData.otp.expiresAt) {
                throw new Error("No active verification code. Please request a new one.");
            }
            if ((userData.otp.attempts ?? 0) >= 5) {
                throw new Error("Too many attempts. Please request a new code.");
            }
            const now = new Date();
            if (userData.otp.expiresAt <= now) {
                throw new Error("Verification code expired. Please request a new one.");
            }
            let isMatch = false;
            if (userData.otp.code === otp) {
                isMatch = true;
                userData.otp.attempts = 0;
                userData.otp.code = null;
                userData.otp.expiresAt = null;
            }
            if (!isMatch) {
                userData.otp.attempts = (userData.otp.attempts ?? 0) + 1;
                await userRepository.save(userData);
                throw new Error("Invalid verification code.");
            }
            userData.isVerified = true;
            userData.otp = undefined;
            await userRepository.save(userData);
            let username = userData.id;
            if (!username || (!username.includes("@") && userData.email)) {
                const cognitoUser = await exports.authService.findUserByEmail(userData.email);
                if (cognitoUser?.Username)
                    username = cognitoUser.Username;
                else
                    username = userData.email;
            }
            await exports.cognitoIdentityServiceProvider.adminUpdateUserAttributes({
                UserPoolId: exports.userPoolId,
                Username: username,
                UserAttributes: [{ Name: "email_verified", Value: "true" }],
            });
            try {
                await exports.cognitoIdentityServiceProvider.adminConfirmSignUp({
                    UserPoolId: exports.userPoolId,
                    Username: username,
                });
            }
            catch (err) {
                if (err.code !== "NotAuthorizedException") {
                    console.error("Error confirming user during email verification:", err);
                    throw err;
                }
            }
            return { ok: true };
        }
        catch (error) {
            console.error("Failed to verify email:", error);
            if (error.code === "UserNotFoundException") {
                throw new Error("User not found. Please try registering again.");
            }
            if (error.code === "TooManyRequestsException") {
                throw new Error("Too many requests. Please try again later.");
            }
            // bubble up our custom messages (e.g., invalid/expired/too many attempts)
            if (error.message) {
                throw new Error(error.message);
            }
            throw new Error("Failed to confirm email. Please try again.");
        }
    },
    confirmInvitedUserEmail: async (userIdentifier) => {
        try {
            let username = userIdentifier;
            if (userIdentifier.includes("@")) {
                const user = await exports.authService.findUserByEmail(userIdentifier);
                if (user && user.Username) {
                    username = user.Username;
                }
            }
            await exports.cognitoIdentityServiceProvider.adminUpdateUserAttributes({
                UserPoolId: exports.userPoolId,
                Username: username,
                UserAttributes: [{ Name: "email_verified", Value: "true" }],
            });
            try {
                await exports.cognitoIdentityServiceProvider.adminConfirmSignUp({
                    UserPoolId: exports.userPoolId,
                    Username: username,
                });
            }
            catch (error) {
                if (error.code !== "NotAuthorizedException") {
                    console.error("Error confirming invited user:", error);
                }
            }
        }
        catch (error) {
            console.error("Failed to verify invited user email:", error);
            if (error.code === "UserNotFoundException") {
                throw new Error("User not found.");
            }
            if (error.code === "TooManyRequestsException") {
                throw new Error("Too many requests. Please try again later");
            }
            throw new Error("Failed to confirm email");
        }
    },
    getCognitoUserbyUsername: async (userIdentifier) => {
        try {
            let username = userIdentifier;
            if (userIdentifier.includes("@")) {
                const user = await exports.authService.findUserByEmail(userIdentifier);
                if (user && user.Username) {
                    username = user.Username;
                }
            }
            const userResponse = await exports.cognitoIdentityServiceProvider.adminGetUser({
                UserPoolId: exports.userPoolId,
                Username: username,
            });
            const groupsResponse = await exports.cognitoIdentityServiceProvider.adminListGroupsForUser({
                UserPoolId: exports.userPoolId,
                Username: username,
            });
            return {
                ...userResponse,
                Groups: groupsResponse.Groups,
            };
        }
        catch (error) {
            console.error("Error getting user by username:", error);
            if (error.code === "UserNotFoundException") {
                throw new Error("User not found");
            }
            if (error.code === "TooManyRequestsException") {
                throw new Error("Too many requests. Please try again later");
            }
            throw error;
        }
    },
    getCognitoUsersbyGroupName: async (group) => {
        try {
            const response = await exports.cognitoIdentityServiceProvider.listUsersInGroup({
                UserPoolId: exports.userPoolId,
                GroupName: group,
            });
            return response;
        }
        catch (error) {
            console.error("Error getting users by group:", error);
            if (error.code === "ResourceNotFoundException") {
                throw new Error("Group not found");
            }
            if (error.code === "TooManyRequestsException") {
                throw new Error("Too many requests. Please try again later");
            }
            throw error;
        }
    },
    refreshTokens: async (userIdentifier, refreshToken) => {
        try {
            let username = userIdentifier;
            if (userIdentifier.includes("@")) {
                const user = await exports.authService.findUserByEmail(userIdentifier);
                if (user && user.Username) {
                    username = user.Username;
                }
            }
            const tokens = await exports.authService.getTokens("REFRESH_TOKEN", {
                USERNAME: username,
                REFRESH_TOKEN: refreshToken,
            });
            return tokens;
        }
        catch (error) {
            console.error("Error refreshing tokens:", error);
            if (error.code === "NotAuthorizedException") {
                throw new Error("Invalid refresh token. Please login again.");
            }
            if (error.code === "UserNotFoundException") {
                throw new Error("User not found. Please login again.");
            }
            if (error.code === "TooManyRequestsException") {
                throw new Error("Too many requests. Please try again later");
            }
            throw error;
        }
    },
    updateUserEmail: async (userIdentifier, newEmail) => {
        try {
            const existingUser = await exports.authService.checkUserExistsByEmail(newEmail);
            if (existingUser) {
                throw new Error(`Email ${newEmail} is already in use`);
            }
            let username = userIdentifier;
            if (userIdentifier.includes("@")) {
                const user = await exports.authService.findUserByEmail(userIdentifier);
                if (user && user.Username) {
                    username = user.Username;
                }
            }
            return await exports.cognitoIdentityServiceProvider.adminUpdateUserAttributes({
                UserPoolId: exports.userPoolId,
                Username: username,
                UserAttributes: [
                    { Name: "email", Value: newEmail.toLowerCase() },
                    { Name: "email_verified", Value: "false" },
                ],
            });
        }
        catch (error) {
            console.error("Failed to update email:", error);
            if (error.code === "UserNotFoundException") {
                throw new Error("User not found");
            }
            if (error.code === "InvalidParameterException") {
                throw new Error("Invalid email format");
            }
            if (error.code === "TooManyRequestsException") {
                throw new Error("Too many requests. Please try again later");
            }
            throw new Error("Failed to update email");
        }
    },
    verifyUserEmail: async (username) => {
        try {
            await exports.cognitoIdentityServiceProvider.adminUpdateUserAttributes({
                UserPoolId: exports.userPoolId,
                Username: username,
                UserAttributes: [{ Name: "email_verified", Value: "true" }],
            });
        }
        catch (error) {
            console.error("Failed to verify email:", error);
            if (error.code === "CodeMismatchException") {
                throw new Error("Invalid verification code");
            }
            if (error.code === "ExpiredCodeException") {
                throw new Error("Verification code has expired");
            }
            if (error.code === "NotAuthorizedException") {
                throw new Error("Invalid access token");
            }
            if (error.code === "TooManyRequestsException") {
                throw new Error("Too many requests. Please try again later");
            }
            throw new Error("Failed to verify email");
        }
    },
};

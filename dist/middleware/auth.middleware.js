"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginRequired = exports.getTokenFromHeader = void 0;
const aws_jwt_verify_1 = require("aws-jwt-verify");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function isJWT(token) {
    return token.split(".").length === 3;
}
const getTokenFromHeader = async (token) => {
    if (!isJWT(token)) {
        throw new Error("Token is not a valid JWT");
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const decodedToken = jsonwebtoken_1.default.decode(token, { complete: true });
    if (!decodedToken || !decodedToken.payload) {
        throw new Error("Invalid JWT structure");
    }
    const iss = decodedToken.payload.iss;
    if (iss.startsWith("https://cognito-idp.")) {
        try {
            const verifier = aws_jwt_verify_1.CognitoJwtVerifier.create({
                userPoolId: process.env.AWS_COGNITO_USER_POOL_ID,
                tokenUse: "access",
                clientId: process.env.AWS_COGNITO_CLIENT_ID,
            });
            const tokenData = await verifier.verify(token);
            return tokenData;
        }
        catch {
            throw new Error("Invalid Cognito token");
        }
    }
    else {
        throw new Error(`Unsupported token issuer: ${iss}`);
    }
};
exports.getTokenFromHeader = getTokenFromHeader;
const loginRequired = async (req, res, next) => {
    try {
        const authorizationHeader = req.headers.authorization || "";
        if (!authorizationHeader) {
            return res
                .status(401)
                .json({ error: "No authorization header provided" });
        }
        const token = authorizationHeader.replace("Bearer ", "");
        if (!token) {
            return res
                .status(401)
                .json({ error: "No token found in authorization header" });
        }
        const tokenData = await (0, exports.getTokenFromHeader)(token);
        req["user"] = tokenData;
        next();
    }
    catch (error) {
        return res.status(401).json({
            error: "Unauthorized",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
exports.loginRequired = loginRequired;

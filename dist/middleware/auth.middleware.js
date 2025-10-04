import { CognitoJwtVerifier } from "aws-jwt-verify";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../config/database";
import { User, UserRole } from "../entities/user.entity";
const userRepository = AppDataSource.getRepository(User);
function isJWT(token) {
    return token.split(".").length === 3;
}
export const getTokenFromHeader = async (token) => {
    if (!isJWT(token)) {
        throw new Error("Token is not a valid JWT");
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const decodedToken = jwt.decode(token, { complete: true });
    if (!decodedToken || !decodedToken.payload) {
        throw new Error("Invalid JWT structure");
    }
    const iss = decodedToken.payload.iss;
    if (iss.startsWith("https://cognito-idp.")) {
        try {
            const verifier = CognitoJwtVerifier.create({
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
export const loginRequired = async (req, res, next) => {
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
        const tokenData = await getTokenFromHeader(token);
        req["user"] = tokenData;
        // Fetch user from database
        const cognitoUsername = tokenData.username;
        if (cognitoUsername) {
            const dbUser = await userRepository.findOne({
                where: { cognitoId: cognitoUsername },
            });
            req.dbUser = dbUser || undefined;
        }
        next();
    }
    catch (error) {
        return res.status(401).json({
            error: "Unauthorized",
            details: error instanceof Error ? error.message : "Unknown error",
        });
    }
};
export const requireRole = (...allowedRoles) => {
    return async (req, res, next) => {
        try {
            if (!req.dbUser) {
                return res.status(401).json({
                    error: "Unauthorized",
                    message: "User not found in database",
                });
            }
            if (!allowedRoles.includes(req.dbUser.role)) {
                return res.status(403).json({
                    error: "Forbidden",
                    message: "You do not have permission to access this resource",
                });
            }
            next();
        }
        catch (error) {
            return res.status(500).json({
                error: "Internal server error",
                details: error instanceof Error ? error.message : "Unknown error",
            });
        }
    };
};
export const requireUser = requireRole(UserRole.USER, UserRole.SUPER_ADMIN);
export const requireSuperAdmin = requireRole(UserRole.SUPER_ADMIN);

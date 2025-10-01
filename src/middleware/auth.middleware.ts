import { RequestHandler, Request } from "express";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import jwt from "jsonwebtoken";

declare module "express-serve-static-core" {
  interface Request {
    user?: unknown;
  }
}

function isJWT(token: string): boolean {
  return token.split(".").length === 3;
}

export const getTokenFromHeader = async (token: string) => {
  if (!isJWT(token)) {
    throw new Error("Token is not a valid JWT");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const decodedToken = jwt.decode(token, { complete: true }) as any;
  if (!decodedToken || !decodedToken.payload) {
    throw new Error("Invalid JWT structure");
  }

  const iss = decodedToken.payload.iss;

  if (iss.startsWith("https://cognito-idp.")) {
    try {
      const verifier = CognitoJwtVerifier.create({
        userPoolId: process.env.AWS_COGNITO_USER_POOL_ID!,
        tokenUse: "access",
        clientId: process.env.AWS_COGNITO_CLIENT_ID!,
      });
      const tokenData = await verifier.verify(token);
      return tokenData;
    } catch {
      throw new Error("Invalid Cognito token");
    }
  } else {
    throw new Error(`Unsupported token issuer: ${iss}`);
  }
};

export const loginRequired: RequestHandler = async (req, res, next) => {
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
    next();
  } catch (error) {
    return res.status(401).json({
      error: "Unauthorized",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

import jwt from "jsonwebtoken";
import crypto from "crypto";
const secretKey = "_qAgWmD2uGcv+GuSNmJh7A12ENeE";
export const createToken = (userId, email, expiry) => {
    const payload = { userId, email };
    const options = { expiresIn: expiry };
    //@ts-ignore
    return jwt.sign(payload, secretKey, options);
};
export const decodeTokenPayload = (token) => {
    try {
        const decodedPayload = jwt.decode(token);
        return decodedPayload;
    }
    catch (error) {
        console.error("Error decoding token payload:", error.message);
        return null;
    }
};
export const verifyToken = (token) => {
    try {
        if (!secretKey) {
            throw new Error("SECRET KEY NOT FOUND IN ENV");
        }
        const decoded = jwt.verify(token, secretKey);
        return decoded;
    }
    catch (error) {
        console.error("Error verifying token:", error.message);
        return null;
    }
};
// Encrypt data
export const encrypt = (text) => {
    const cipher = crypto.createCipheriv("aes-256-cbc", secretKey, crypto.randomBytes(16));
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return encrypted;
};
// Decrypt data
export const decrypt = (encryptedText) => {
    const decipher = crypto.createDecipheriv("aes-256-cbc", secretKey, crypto.randomBytes(16));
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
};

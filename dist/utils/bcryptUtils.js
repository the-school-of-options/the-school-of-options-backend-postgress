"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decrypt = exports.encrypt = exports.verifyToken = exports.decodeTokenPayload = exports.createToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const secretKey = "_qAgWmD2uGcv+GuSNmJh7A12ENeE";
const createToken = (userId, email, expiry) => {
    const payload = { userId, email };
    const options = { expiresIn: expiry };
    //@ts-ignore
    return jsonwebtoken_1.default.sign(payload, secretKey, options);
};
exports.createToken = createToken;
const decodeTokenPayload = (token) => {
    try {
        const decodedPayload = jsonwebtoken_1.default.decode(token);
        return decodedPayload;
    }
    catch (error) {
        console.error("Error decoding token payload:", error.message);
        return null;
    }
};
exports.decodeTokenPayload = decodeTokenPayload;
const verifyToken = (token) => {
    try {
        if (!secretKey) {
            throw new Error("SECRET KEY NOT FOUND IN ENV");
        }
        const decoded = jsonwebtoken_1.default.verify(token, secretKey);
        return decoded;
    }
    catch (error) {
        console.error("Error verifying token:", error.message);
        return null;
    }
};
exports.verifyToken = verifyToken;
// Encrypt data
const encrypt = (text) => {
    const cipher = crypto_1.default.createCipheriv("aes-256-cbc", secretKey, crypto_1.default.randomBytes(16));
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return encrypted;
};
exports.encrypt = encrypt;
// Decrypt data
const decrypt = (encryptedText) => {
    const decipher = crypto_1.default.createDecipheriv("aes-256-cbc", secretKey, crypto_1.default.randomBytes(16));
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
};
exports.decrypt = decrypt;

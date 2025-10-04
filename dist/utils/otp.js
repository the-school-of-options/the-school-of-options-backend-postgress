export class OTPService {
    static generateOTP() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
    static createOTPData(type, // Use the enum instead of string literals
    expiryMinutes = 10) {
        return {
            code: this.generateOTP(),
            expiresAt: new Date(Date.now() + expiryMinutes * 60 * 1000),
            attempts: 0,
            lastSentAt: new Date(),
            verified: false,
            type,
        };
    }
    static validateOTP(storedOTP, providedOTP) {
        if (!storedOTP) {
            return {
                valid: false,
                message: "No OTP found. Please request a new one.",
            };
        }
        if (storedOTP.verified) {
            return { valid: false, message: "OTP has already been used." };
        }
        if (storedOTP.attempts >= 5) {
            return {
                valid: false,
                message: "Maximum OTP attempts exceeded. Please request a new one.",
            };
        }
        if (new Date() > storedOTP.expiresAt) {
            return {
                valid: false,
                message: "OTP has expired. Please request a new one.",
            };
        }
        if (storedOTP.code !== providedOTP) {
            return { valid: false, message: "Invalid OTP. Please try again." };
        }
        return { valid: true, message: "OTP verified successfully." };
    }
    static canResendOTP(lastSentAt, cooldownMinutes = 1) {
        if (!lastSentAt)
            return true;
        const now = new Date();
        const timeDiff = now.getTime() - lastSentAt.getTime();
        const minutesDiff = timeDiff / (1000 * 60);
        return minutesDiff >= cooldownMinutes;
    }
}

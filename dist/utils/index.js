import { v4 as uuidv4 } from "uuid";
const generatePrefixedUUID = (prefix = "") => {
    return prefix + uuidv4().slice(prefix.length);
};
const generateSecurePassword = () => {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const specialChars = "!@#$%^&*";
    const allChars = uppercase + lowercase + numbers + specialChars;
    return (uppercase[Math.floor(Math.random() * uppercase.length)] +
        lowercase[Math.floor(Math.random() * lowercase.length)] +
        numbers[Math.floor(Math.random() * numbers.length)] +
        specialChars[Math.floor(Math.random() * specialChars.length)] +
        Array.from({ length: 4 }, () => allChars[Math.floor(Math.random() * allChars.length)]).join(""))
        .split("")
        .sort(() => Math.random() - 0.5) // Shuffle the password to mix characters
        .join("");
};
const generateRandomPassword = (length) => {
    const lowercaseCharset = "abcdefghijklmnopqrstuvwxyz";
    const uppercaseCharset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numberCharset = "0123456789";
    const specialCharset = "!@#$%^&*()_+-=";
    let password = "";
    let hasUppercase = false;
    let hasNumber = false;
    let hasSpecialChar = false;
    // Generate the base password with lowercase letters
    for (let i = 0; i < length - 3; i++) {
        const randomIndex = Math.floor(Math.random() * lowercaseCharset.length);
        password += lowercaseCharset[randomIndex];
    }
    // Add at least one uppercase letter
    const randomUppercaseIndex = Math.floor(Math.random() * uppercaseCharset.length);
    password += uppercaseCharset[randomUppercaseIndex];
    hasUppercase = true;
    // Add at least one number
    const randomNumberIndex = Math.floor(Math.random() * numberCharset.length);
    password += numberCharset[randomNumberIndex];
    hasNumber = true;
    // Add at least one special character
    const randomSpecialCharIndex = Math.floor(Math.random() * specialCharset.length);
    password += specialCharset[randomSpecialCharIndex];
    hasSpecialChar = true;
    // Shuffle the password characters using Fisher-Yates algorithm
    const passwordArray = password.split("");
    for (let i = passwordArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
    }
    password = passwordArray.join("");
    // Check if all required character types are present
    if (!hasUppercase || !hasNumber || !hasSpecialChar) {
        // Recursively generate a new password if any required character type is missing
        return generateRandomPassword(length);
    }
    return password;
};
// sleep time expects milliseconds
const sleep = (time) => {
    return new Promise((resolve) => setTimeout(resolve, time));
};
const formatPhoneNumber = (phoneNumber = "", internationalDialingCode = "+1") => {
    if (phoneNumber.startsWith("+")) {
        return phoneNumber; //we assume it is already formatted
    }
    const numericPhoneNumber = phoneNumber.replace(/\D/g, "");
    if (numericPhoneNumber.length !== 10) {
        return "";
    }
    const formattedPhoneNumber = `${internationalDialingCode}${numericPhoneNumber}`;
    return formattedPhoneNumber;
};
export { generatePrefixedUUID, generateRandomPassword, sleep, formatPhoneNumber, generateSecurePassword, };

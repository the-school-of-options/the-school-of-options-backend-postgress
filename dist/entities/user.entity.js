"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = exports.OtpType = exports.UserRole = void 0;
const typeorm_1 = require("typeorm");
var UserRole;
(function (UserRole) {
    UserRole["SUPER_ADMIN"] = "Super-Admin";
    UserRole["USER"] = "User";
})(UserRole || (exports.UserRole = UserRole = {}));
var OtpType;
(function (OtpType) {
    OtpType["EMAIL_VERIFICATION"] = "email_verification";
    OtpType["PASSWORD_RESET"] = "password_reset";
    OtpType["LOGIN"] = "login";
})(OtpType || (exports.OtpType = OtpType = {}));
class Otp {
}
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 64, nullable: true }),
    __metadata("design:type", Object)
], Otp.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamptz", nullable: true }),
    __metadata("design:type", Object)
], Otp.prototype, "expiresAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "smallint", default: 0, nullable: true }),
    __metadata("design:type", Object)
], Otp.prototype, "attempts", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamptz", nullable: true }),
    __metadata("design:type", Object)
], Otp.prototype, "lastSentAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: false, nullable: true }),
    __metadata("design:type", Object)
], Otp.prototype, "verified", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: OtpType,
        enumName: "otp_type_enum",
        nullable: true,
    }),
    __metadata("design:type", Object)
], Otp.prototype, "type", void 0);
let User = class User {
    normalize() {
        if (this.email)
            this.email = this.email.trim().toLowerCase();
        if (this.fullName)
            this.fullName = this.fullName.trim();
        if (this.mobileNumber)
            this.mobileNumber = this.mobileNumber.trim();
    }
};
exports.User = User;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], User.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)({ unique: true }),
    (0, typeorm_1.Column)({ type: "varchar", length: 64, nullable: true, unique: true }),
    __metadata("design:type", Object)
], User.prototype, "cognitoId", void 0);
__decorate([
    (0, typeorm_1.Index)({ unique: true }),
    (0, typeorm_1.Column)({ type: "varchar", length: 320, unique: true }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 100 }),
    __metadata("design:type", String)
], User.prototype, "fullName", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: "varchar", length: 20, nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "mobileNumber", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: "varchar", length: 128, nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "googleId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "isGoogleAcc", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: UserRole,
        enumName: "user_role_enum",
        default: UserRole.USER,
    }),
    __metadata("design:type", String)
], User.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)(() => Otp, { prefix: "otp" }),
    __metadata("design:type", Otp)
], User.prototype, "otp", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "isVerified", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: true }),
    __metadata("design:type", Boolean)
], User.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamptz", nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "lastLogin", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "integer", default: 0 }),
    __metadata("design:type", Number)
], User.prototype, "loginCount", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: "timestamptz" }),
    __metadata("design:type", Date)
], User.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: "timestamptz" }),
    __metadata("design:type", Date)
], User.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.BeforeInsert)(),
    (0, typeorm_1.BeforeUpdate)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], User.prototype, "normalize", null);
exports.User = User = __decorate([
    (0, typeorm_1.Check)("CHK_user_fullname_len", 'char_length("fullName") <= 100'),
    (0, typeorm_1.Check)("CHK_user_otp_attempts", '"otpAttempts" <= 5 OR "otpAttempts" IS NULL'),
    (0, typeorm_1.Entity)({ name: "users" })
], User);

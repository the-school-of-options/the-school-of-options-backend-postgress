var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, BeforeInsert, BeforeUpdate, Check, } from "typeorm";
export var UserRole;
(function (UserRole) {
    UserRole["SUPER_ADMIN"] = "Super-Admin";
    UserRole["USER"] = "User";
})(UserRole || (UserRole = {}));
export var OtpType;
(function (OtpType) {
    OtpType["EMAIL_VERIFICATION"] = "email_verification";
    OtpType["PASSWORD_RESET"] = "password_reset";
    OtpType["LOGIN"] = "login";
})(OtpType || (OtpType = {}));
class Otp {
}
__decorate([
    Column({ type: "varchar", length: 64, nullable: true }),
    __metadata("design:type", Object)
], Otp.prototype, "code", void 0);
__decorate([
    Column({ type: "timestamptz", nullable: true }),
    __metadata("design:type", Object)
], Otp.prototype, "expiresAt", void 0);
__decorate([
    Column({ type: "smallint", default: 0, nullable: true }),
    __metadata("design:type", Object)
], Otp.prototype, "attempts", void 0);
__decorate([
    Column({ type: "timestamptz", nullable: true }),
    __metadata("design:type", Object)
], Otp.prototype, "lastSentAt", void 0);
__decorate([
    Column({ type: "boolean", default: false, nullable: true }),
    __metadata("design:type", Object)
], Otp.prototype, "verified", void 0);
__decorate([
    Column({
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
__decorate([
    PrimaryGeneratedColumn("uuid"),
    __metadata("design:type", String)
], User.prototype, "id", void 0);
__decorate([
    Index({ unique: true }),
    Column({ type: "varchar", length: 64, nullable: true, unique: true }),
    __metadata("design:type", Object)
], User.prototype, "cognitoId", void 0);
__decorate([
    Index({ unique: true }),
    Column({ type: "varchar", length: 320, unique: true }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    Column({ type: "varchar", length: 100 }),
    __metadata("design:type", String)
], User.prototype, "fullName", void 0);
__decorate([
    Index(),
    Column({ type: "varchar", length: 20, nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "mobileNumber", void 0);
__decorate([
    Index(),
    Column({ type: "varchar", length: 128, nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "googleId", void 0);
__decorate([
    Column({ type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "isGoogleAcc", void 0);
__decorate([
    Column({
        type: "enum",
        enum: UserRole,
        enumName: "user_role_enum",
        default: UserRole.USER,
    }),
    __metadata("design:type", String)
], User.prototype, "role", void 0);
__decorate([
    Column(() => Otp, { prefix: "otp" }),
    __metadata("design:type", Otp)
], User.prototype, "otp", void 0);
__decorate([
    Column({ type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "isVerified", void 0);
__decorate([
    Column({ type: "boolean", default: true }),
    __metadata("design:type", Boolean)
], User.prototype, "isActive", void 0);
__decorate([
    Column({ type: "timestamptz", nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "lastLogin", void 0);
__decorate([
    Column({ type: "integer", default: 0 }),
    __metadata("design:type", Number)
], User.prototype, "loginCount", void 0);
__decorate([
    CreateDateColumn({ type: "timestamptz" }),
    __metadata("design:type", Date)
], User.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn({ type: "timestamptz" }),
    __metadata("design:type", Date)
], User.prototype, "updatedAt", void 0);
__decorate([
    BeforeInsert(),
    BeforeUpdate(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], User.prototype, "normalize", null);
User = __decorate([
    Check("CHK_user_fullname_len", 'char_length("fullName") <= 100'),
    Check("CHK_user_otp_attempts", '"otpAttempts" <= 5 OR "otpAttempts" IS NULL'),
    Entity({ name: "users" })
], User);
export default User;
export { User };

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
exports.Webinar = void 0;
const typeorm_1 = require("typeorm");
let Webinar = class Webinar {
};
exports.Webinar = Webinar;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Webinar.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: "varchar", length: 320 }),
    __metadata("design:type", String)
], Webinar.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 160, nullable: true }),
    __metadata("design:type", Object)
], Webinar.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 2083, nullable: true }),
    __metadata("design:type", Object)
], Webinar.prototype, "webinarLink", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 100, nullable: true }),
    __metadata("design:type", Object)
], Webinar.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: ["english", "hindi"],
        nullable: true,
    }),
    __metadata("design:type", Object)
], Webinar.prototype, "preferedLanguage", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Webinar.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Webinar.prototype, "updatedAt", void 0);
exports.Webinar = Webinar = __decorate([
    (0, typeorm_1.Entity)("webinars")
], Webinar);

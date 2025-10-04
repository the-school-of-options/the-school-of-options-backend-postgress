var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, } from "typeorm";
let Subscribers = class Subscribers {
};
__decorate([
    PrimaryGeneratedColumn("uuid"),
    __metadata("design:type", String)
], Subscribers.prototype, "id", void 0);
__decorate([
    Index({ unique: true }),
    Column({ type: "varchar", length: 320 }),
    __metadata("design:type", String)
], Subscribers.prototype, "email", void 0);
__decorate([
    Column({ type: "varchar", length: 160, nullable: true }),
    __metadata("design:type", Object)
], Subscribers.prototype, "name", void 0);
__decorate([
    Column({ type: "boolean", default: true }),
    __metadata("design:type", Boolean)
], Subscribers.prototype, "subscribed", void 0);
__decorate([
    Column("simple-array", { default: "" }),
    __metadata("design:type", Array)
], Subscribers.prototype, "subscribedLists", void 0);
__decorate([
    CreateDateColumn(),
    __metadata("design:type", Date)
], Subscribers.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn(),
    __metadata("design:type", Date)
], Subscribers.prototype, "updatedAt", void 0);
Subscribers = __decorate([
    Entity("subscribers")
], Subscribers);
export default Subscribers;
export { Subscribers };

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
exports.initDB = initDB;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const dotenv_1 = __importDefault(require("dotenv"));
const subscriber_entity_1 = require("../entities/subscriber.entity");
const webinar_entity_1 = require("../entities/webinar.entity");
const user_entity_1 = require("../entities/user.entity");
dotenv_1.default.config();
const ssl = process.env.DB_SSL === "false"
    ? undefined
    :
        { rejectUnauthorized: false };
exports.AppDataSource = new typeorm_1.DataSource({
    type: "postgres",
    host: "theschoolofoptionsdatbase.cpm0s28o0c5k.ap-south-1.rds.amazonaws.com",
    port: 5432,
    username: "postgres",
    password: "TotalProfit1!",
    database: "theschoolofoptions",
    entities: [subscriber_entity_1.Subscribers, webinar_entity_1.Webinar, user_entity_1.User],
    synchronize: true,
    logging: false,
    ssl,
});
async function initDB() {
    if (!exports.AppDataSource.isInitialized) {
        await exports.AppDataSource.initialize();
    }
}

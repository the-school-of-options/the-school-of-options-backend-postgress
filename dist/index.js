"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("./config/database");
const newsletter_route_1 = __importDefault(require("./routes/newsletter.route"));
const webinar_route_1 = __importDefault(require("./routes/webinar.route"));
dotenv_1.default.config();
async function main() {
    await (0, database_1.initDB)();
    const app = (0, express_1.default)();
    app.use(express_1.default.json({ limit: "2mb" }));
    app.get("/api/v1/health", (_, res) => res.send("OK"));
    app.use("/api/v1/newsletter", newsletter_route_1.default);
    app.use("/api/v1/webinar", webinar_route_1.default);
    const port = Number(process.env.PORT || 3000);
    app.listen(port, () => {
        console.log(`the-school-of-options API running on :${port}`);
    });
}
main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});

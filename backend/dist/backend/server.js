"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const habitRoutes_1 = __importDefault(require("./routes/habitRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const rewardRoutes_1 = __importDefault(require("./routes/rewardRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: process.env.CLIENT_URL ?? "http://localhost:3000", credentials: true }));
app.use(express_1.default.json());
app.use("/api/habits", habitRoutes_1.default);
app.use("/api/users", userRoutes_1.default);
app.use("/api/rewards", rewardRoutes_1.default);
app.use("/api/auth", authRoutes_1.default);
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
const PORT = Number(process.env.PORT ?? 5000);
const MONGO_URI = process.env.MONGO_URI ?? "mongodb://localhost:27017/habitquest";
mongoose_1.default
    .connect(MONGO_URI)
    .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
})
    .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
});
exports.default = app;
//# sourceMappingURL=server.js.map
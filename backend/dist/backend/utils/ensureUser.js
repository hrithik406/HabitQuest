"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureUser = ensureUser;
const User_1 = __importDefault(require("../models/User"));
function buildGuestUser(userId, timezone = "UTC") {
    return {
        _id: userId,
        username: `guest-${userId}`,
        email: `guest-${userId}@habitquest.local`,
        passwordHash: `guest-${userId}`,
        timezone,
    };
}
async function ensureUser(userId, timezone = "UTC") {
    const existing = await User_1.default.findById(userId);
    if (existing) {
        if (timezone && existing.timezone !== timezone) {
            existing.timezone = timezone;
            await existing.save();
        }
        return existing;
    }
    return User_1.default.create(buildGuestUser(userId, timezone));
}
//# sourceMappingURL=ensureUser.js.map
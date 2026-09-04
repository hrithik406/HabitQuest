"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
// ── Schema ────────────────────────────────────────────────────────
const rewardSchema = new mongoose_1.Schema({
    itemId: { type: String, required: true },
    name: { type: String, required: true },
    purchasedAt: { type: Date, default: Date.now },
}, { _id: false });
const userSchema = new mongoose_1.Schema({
    username: {
        type: String,
        required: [true, "Username is required"],
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 30,
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: { type: String, required: true },
    resetPasswordToken: { type: String, required: false },
    resetPasswordExpire: { type: Date, required: false },
    xp: { type: Number, default: 0, min: 0 },
    gold: { type: Number, default: 0, min: 0 },
    level: { type: Number, default: 1, min: 1 },
    ownedRewards: [rewardSchema],
    timezone: { type: String, default: "UTC" },
    joinedAt: { type: Date, default: Date.now },
    // ⬇️ 2. ADDED THESE THREE LINES TO THE MONGOOSE SCHEMA ⬇️
    activeTheme: { type: String, default: null },
    activeAvatar: { type: String, default: null },
    showcase: { type: [String], default: [null, null, null, null] },
    activePowerups: {
        type: [{ itemId: String, expiresAt: Date }],
        default: []
    }, // ⬅️ Changed to an array of objects
    // Stats
    stats: {
        totalHabitsCompleted: { type: Number, default: 0 },
        totalAchievements: { type: Number, default: 0 },
        totalGoldSpent: { type: Number, default: 0 },
        highestStreak: { type: Number, default: 0 }
    },
    // Unlocked Achievements
    unlockedAchievements: {
        type: [{
                achievementId: { type: String, required: true },
                unlockedAt: { type: Date, default: Date.now },
                isClaimed: { type: Boolean, default: false } // ⬅️ NEW: Tracks if the user clicked "Claim"
            }],
        default: []
    },
    // Verification Fields
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    verificationExpire: { type: Date },
}, { timestamps: true });
// ── Virtuals ──────────────────────────────────────────────────────
userSchema.virtual("xpForNextLevel").get(function () {
    return Math.floor(100 * Math.pow(this.level + 1, 1.5));
});
userSchema.virtual("xpProgress").get(function () {
    // Level 1 starts at 0 XP. All other levels use the formula.
    const currentLevelBaseXp = this.level === 1 ? 0 : Math.floor(100 * Math.pow(this.level, 1.5));
    const nextLevelBaseXp = Math.floor(100 * Math.pow(this.level + 1, 1.5));
    return {
        current: this.xp - currentLevelBaseXp,
        required: nextLevelBaseXp - currentLevelBaseXp,
        // Math.max(0, ...) ensures percentage never visually drops below 0
        percentage: Math.max(0, Math.min(100, Math.floor(((this.xp - currentLevelBaseXp) / (nextLevelBaseXp - currentLevelBaseXp)) * 100))),
    };
});
// ── Instance methods ──────────────────────────────────────────────
userSchema.methods.awardCurrency = function (xpGained, goldGained) {
    this.xp += xpGained;
    this.gold += goldGained;
    let leveledUp = false;
    const prevLevel = this.level;
    while (this.xp >= Math.floor(100 * Math.pow(this.level + 1, 1.5))) {
        this.level += 1;
        leveledUp = true;
    }
    return { leveledUp, prevLevel, newLevel: this.level, xpGained, goldGained };
};
userSchema.methods.deductCurrency = function (xpToDeduct, goldToDeduct) {
    // 1. Subtract the currency safely, making sure gold never falls below 0
    this.gold = Math.max(0, this.gold - goldToDeduct);
    this.xp = Math.max(0, this.xp - xpToDeduct);
    let leveledDown = false;
    // 2. Roll back levels if total absolute XP drops below the current level's minimum entrance threshold
    while (this.level > 1 && this.xp < Math.floor(100 * Math.pow(this.level, 1.5))) {
        this.level -= 1;
        leveledDown = true;
    }
    return { leveledDown, newLevel: this.level };
};
userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });
const User = mongoose_1.default.model("User", userSchema);
exports.default = User;
//# sourceMappingURL=User.js.map
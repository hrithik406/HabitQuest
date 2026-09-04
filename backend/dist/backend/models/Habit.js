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
// ── Completion log sub-schema ─────────────────────────────────────
const completionLogSchema = new mongoose_1.Schema({
    date: { type: String, required: true },
    xpAwarded: { type: Number, default: 0 },
    goldAwarded: { type: Number, default: 0 },
    streakAtCompletion: { type: Number, default: 1 },
}, { _id: false });
// ── Milestone sub-schema ──────────────────────────────────────────
// _id is kept (default true) so we can target individual milestones
// via PUT /habits/:id/milestone/:milestoneId
const milestoneSchema = new mongoose_1.Schema({
    title: { type: String, required: true, trim: true, maxlength: 120 },
    isCompleted: { type: Boolean, default: false },
});
// ── Habit schema ──────────────────────────────────────────────────
const habitSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    title: {
        type: String,
        required: [true, "Habit title is required"],
        trim: true,
        maxlength: 100,
    },
    description: { type: String, trim: true, maxlength: 300 },
    icon: { type: String, default: "⚡" },
    color: { type: String, default: "#6366f1" },
    frequency: {
        type: String,
        enum: ["daily", "weekdays", "weekends", "custom"],
        default: "daily",
    },
    customDays: { type: [Boolean], default: [true, true, true, true, true, true, true] },
    currentStreak: { type: Number, default: 0, min: 0 },
    longestStreak: { type: Number, default: 0, min: 0 },
    lastCompletedDate: { type: String, default: "" },
    lastInteractedDate: { type: String, default: "" }, // ← NEW: Initializes as empty string
    baseXp: { type: Number, default: 20, min: 1 },
    baseGold: { type: Number, default: 5, min: 0 },
    completionLog: [completionLogSchema],
    milestones: [milestoneSchema],
    isArchived: { type: Boolean, default: false },
}, { timestamps: true });
// ── Virtuals ──────────────────────────────────────────────────────
/** +5 % per 7-day streak milestone, capped at +25 % */
habitSchema.virtual("streakMultiplier").get(function () {
    const m = Math.min(Math.floor(this.currentStreak / 7), 5);
    return 1 + m * 0.05;
});
habitSchema.virtual("todayComplete").get(function () {
    return this.lastCompletedDate === new Date().toISOString().split("T")[0];
});
/** 0–100 percentage of milestones completed (0 when no milestones) */
habitSchema.virtual("milestoneProgress").get(function () {
    if (!this.milestones.length)
        return 0;
    const done = this.milestones.filter((m) => m.isCompleted).length;
    return Math.round((done / this.milestones.length) * 100);
});
habitSchema.set("toJSON", { virtuals: true });
habitSchema.set("toObject", { virtuals: true });
const Habit = mongoose_1.default.model("Habit", habitSchema);
exports.default = Habit;
//# sourceMappingURL=Habit.js.map
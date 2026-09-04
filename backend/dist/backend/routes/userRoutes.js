"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const User_1 = __importDefault(require("../models/User"));
const ensureUser_1 = require("../utils/ensureUser");
const achievement_1 = require("../../shared/achievement"); // ⬅️ IMPORT YOUR SHARED DICTIONARY
const router = (0, express_1.Router)();
// ─────────────────────────────────────────────────────────────────
// GET /api/users/:id (Fetch full user profile)
// ─────────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
    try {
        const user = await User_1.default.findById(req.params.id);
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        res.status(200).json({ user });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch user data" });
    }
});
// PUT /api/users/:id/timezone
router.put("/:id/timezone", async (req, res) => {
    try {
        const { timezone } = req.body;
        if (!timezone) {
            res.status(400).json({ error: "timezone is required" });
            return;
        }
        const user = await (0, ensureUser_1.ensureUser)(req.params.id, timezone);
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        res.json({ user });
    }
    catch (err) {
        res.status(500).json({ error: "Server error", details: err.message });
    }
});
// PUT /api/users/:id/profile updation
// ── Update Player Profile (Username, Avatar, Showcase) ──
router.put('/:id/profile', async (req, res) => {
    try {
        const { username, activeAvatar, showcase } = req.body;
        const user = await User_1.default.findById(req.params.id);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        // Update fields
        if (username !== undefined)
            user.username = username;
        if (activeAvatar !== undefined)
            user.activeAvatar = activeAvatar;
        if (showcase !== undefined)
            user.showcase = showcase;
        // ⬇️ ADD THIS: Check for Fashionista Achievement ⬇️
        if (activeAvatar !== undefined || showcase !== undefined) {
            const hasEco1 = user.unlockedAchievements.some(a => a.achievementId === "eco_1");
            if (!hasEco1) {
                user.unlockedAchievements.push({
                    achievementId: "eco_1",
                    unlockedAt: new Date(),
                    isClaimed: false
                });
            }
        }
        await user.save();
        res.status(200).json({ message: 'Profile updated successfully', user });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update profile' });
    }
});
// GET /api/users/:id
router.get("/:id", async (req, res) => {
    try {
        const user = await User_1.default.findById(req.params.id).select("-passwordHash");
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        res.json({ user });
    }
    catch (err) {
        res.status(500).json({ error: "Server error", details: err.message });
    }
});
// ── POST /api/users/:id/achievements/claim ──
// ── Claim an unlocked achievement reward ──
router.post("/:id/achievements/claim", async (req, res) => {
    try {
        const userId = req.params.id;
        const { achievementId } = req.body;
        if (!achievementId) {
            res.status(400).json({ error: "achievementId is required" });
            return;
        }
        const user = await User_1.default.findById(userId);
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        // 1. Check if they actually unlocked it
        const unlockedRecord = user.unlockedAchievements.find((a) => a.achievementId === achievementId);
        if (!unlockedRecord) {
            res.status(400).json({ error: "You haven't unlocked this achievement yet!" });
            return;
        }
        // 2. Check if they already claimed it (Prevent double-dipping!)
        if (unlockedRecord.isClaimed) {
            res.status(400).json({ error: "Reward already claimed." });
            return;
        }
        // 3. Look up the reward amounts from the Shared Master Dictionary
        const achievementDef = (0, achievement_1.getAchievementById)(achievementId);
        if (!achievementDef) {
            res.status(400).json({ error: "Achievement definition not found." });
            return;
        }
        // 4. Update the claim status
        unlockedRecord.isClaimed = true;
        // 5. Deposit the currency using your model method
        const awardResult = user.awardCurrency(achievementDef.xp || 0, achievementDef.gold || 0);
        // Save the user securely to the database
        await user.save();
        res.status(200).json({
            message: "Reward claimed successfully!",
            awardResult,
            user
        });
    }
    catch (error) {
        console.error("Claim Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.default = router;
//# sourceMappingURL=userRoutes.js.map
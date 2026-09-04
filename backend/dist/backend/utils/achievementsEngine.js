"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateAchievements = void 0;
const achievement_1 = require("../../shared/achievement");
const evaluateAchievements = (user, currentStreak) => {
    const newlyUnlocked = [];
    const totalHabits = user.stats?.totalHabitsCompleted || 0;
    // 1. FLATTEN THE ARRAY: Pull all items out of their categories into one giant list
    const allAchievements = achievement_1.ACHIEVEMENTS_DATA.flatMap(category => category.items);
    // 2. Check every achievement in the new flat list
    allAchievements.forEach((ach) => {
        // Skip if the user already unlocked it
        if (user.unlockedAchievements.some(a => a.achievementId === ach.id))
            return;
        let isUnlocked = false;
        // 3. DYNAMIC CRITERIA: Read the ID to figure out the requirement!
        // Example: "streak_21" splits into ["streak", "21"]
        if (ach.id.startsWith("streak_")) {
            const requiredStreak = parseInt(ach.id.split("_")[1]);
            if (currentStreak >= requiredStreak)
                isUnlocked = true;
        }
        else if (ach.id.startsWith("grind_")) {
            const requiredHabits = parseInt(ach.id.split("_")[1]);
            if (totalHabits >= requiredHabits)
                isUnlocked = true;
        }
        // Note: "eco_" achievements are triggered inside the shop/profile controllers, not here!
        // 4. If unlocked, prepare it for the Claim System!
        if (isUnlocked) {
            user.unlockedAchievements.push({
                achievementId: ach.id,
                unlockedAt: new Date(),
                isClaimed: false // ⬅️ VERY IMPORTANT: Leaves it unclaimed so the button works!
            });
            newlyUnlocked.push(ach.id);
        }
    });
    // Note: We completely removed totalBonusXp and totalBonusGold! 
    // The user will now securely receive those rewards ONLY when they click the "Claim" button.
    return { newlyUnlocked };
};
exports.evaluateAchievements = evaluateAchievements;
//# sourceMappingURL=achievementsEngine.js.map
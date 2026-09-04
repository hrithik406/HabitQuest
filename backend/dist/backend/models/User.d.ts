import { Document, Model } from "mongoose";
export interface IOwnedReward {
    itemId: string;
    name: string;
    purchasedAt: Date;
}
export interface IXpProgress {
    current: number;
    required: number;
    percentage: number;
}
export interface IAwardResult {
    leveledUp: boolean;
    prevLevel: number;
    newLevel: number;
    xpGained: number;
    goldGained: number;
}
export interface IUser extends Document {
    username: string;
    email: string;
    password: string;
    resetPasswordToken?: string;
    resetPasswordExpire?: Date;
    xp: number;
    gold: number;
    level: number;
    ownedRewards: IOwnedReward[];
    timezone: string;
    joinedAt: Date;
    activeTheme: string | null;
    activeAvatar: string | null;
    showcase?: (string | null)[];
    activePowerups: {
        itemId: string;
        expiresAt: Date;
    }[];
    xpForNextLevel: number;
    xpProgress: IXpProgress;
    awardCurrency(xpGained: number, goldGained: number): IAwardResult;
    deductCurrency(xpToDeduct: number, goldToDeduct: number): {
        leveledDown: boolean;
        newLevel: number;
    };
    stats: {
        totalHabitsCompleted: number;
        totalAchievements: number;
        totalGoldSpent: number;
        highestStreak: number;
    };
    unlockedAchievements: {
        achievementId: string;
        unlockedAt: Date;
        isClaimed: boolean;
    }[];
    isVerified: Boolean;
    verificationToken: String | null;
    verificationExpire: Date | null;
}
export type IUserModel = Model<IUser>;
declare const User: IUserModel;
export default User;
//# sourceMappingURL=User.d.ts.map
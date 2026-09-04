export interface AchievementItem {
    id: string;
    title: string;
    desc: string;
    icon: string;
    xp: number;
    gold: number;
    rewardText?: string;
}
export interface AchievementCategory {
    category: string;
    items: AchievementItem[];
}
export declare const ACHIEVEMENTS_DATA: AchievementCategory[];
export declare const getAchievementById: (id: string) => AchievementItem | null;
//# sourceMappingURL=achievement.d.ts.map
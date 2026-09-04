import mongoose, { Document, Model } from "mongoose";
export interface ICompletionLog {
    date: string;
    xpAwarded: number;
    goldAwarded: number;
    streakAtCompletion: number;
}
/**
 * IMilestone — a single step within a habit.
 * When ALL milestones are isCompleted = true, the habit is
 * automatically marked complete and XP/Gold are awarded.
 */
export interface IMilestone {
    _id: mongoose.Types.ObjectId;
    title: string;
    isCompleted: boolean;
}
export type HabitFrequency = "daily" | "weekdays" | "weekends" | "custom";
export interface IHabit extends Document {
    userId: mongoose.Types.ObjectId;
    title: string;
    description?: string;
    icon: string;
    color: string;
    frequency: HabitFrequency;
    customDays: boolean[];
    currentStreak: number;
    longestStreak: number;
    lastCompletedDate: string;
    lastInteractedDate: string;
    baseXp: number;
    baseGold: number;
    completionLog: ICompletionLog[];
    milestones: IMilestone[];
    isArchived: boolean;
    streakMultiplier: number;
    todayComplete: boolean;
    milestoneProgress: number;
}
export type IHabitModel = Model<IHabit>;
declare const Habit: IHabitModel;
export default Habit;
//# sourceMappingURL=Habit.d.ts.map
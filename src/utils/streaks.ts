import { createClient } from "@/utils/supabase/client";
import { logSquadEvent } from "@/utils/squads";

export const STREAK_MILESTONES = [3, 5, 10, 21, 30, 50, 100] as const;
export type StreakMilestone = (typeof STREAK_MILESTONES)[number];

export interface BadgeInfo {
    milestone: StreakMilestone;
    emoji: string;
    label: string;
    colorClass: string;
}

export const BADGE_CONFIG: Record<StreakMilestone, BadgeInfo> = {
    3: { milestone: 3, emoji: "🌱", label: "Getting Started", colorClass: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
    5: { milestone: 5, emoji: "🔥", label: "On a Roll", colorClass: "text-orange-400 bg-orange-400/10 border-orange-400/20" },
    10: { milestone: 10, emoji: "⚡", label: "Locked In", colorClass: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" },
    21: { milestone: 21, emoji: "💪", label: "Habit Formed", colorClass: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
    30: { milestone: 30, emoji: "🎯", label: "One Month", colorClass: "text-purple-400 bg-purple-400/10 border-purple-400/20" },
    50: { milestone: 50, emoji: "💎", label: "Committed", colorClass: "text-brand-emerald bg-brand-emerald/10 border-brand-emerald/20" },
    100: { milestone: 100, emoji: "👑", label: "Legend", colorClass: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
};

export function getBestBadge(bestStreak: number): BadgeInfo | null {
    const achieved = STREAK_MILESTONES.filter(m => bestStreak >= m);
    if (achieved.length === 0) return null;
    return BADGE_CONFIG[achieved[achieved.length - 1]];
}

export function getNextMilestone(currentStreak: number): StreakMilestone | null {
    const next = STREAK_MILESTONES.find(m => m > currentStreak);
    return next ?? null;
}

/**
 * Call after a habit is marked complete. 
 * - Increments streak if last_completed_date was yesterday (strict).
 * - Resets streak to 1 if a day was skipped.
 * - Awards new badge if milestone crossed (inserts to habit_badges).
 * - Fires squad event if new milestone.
 * Returns { currentStreak, bestStreak, newMilestone } 
 */
export async function processHabitStreak(
    userId: string,
    habitId: string,
    habitName: string,
): Promise<{ currentStreak: number; bestStreak: number; newMilestone: StreakMilestone | null }> {
    const supabase = createClient();
    const todayStr = new Date().toISOString().split("T")[0];
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().split("T")[0];

    // Get or create streak record
    const { data: existing } = await supabase
        .from("habit_streaks")
        .select("*")
        .eq("user_id", userId)
        .eq("habit_id", habitId)
        .maybeSingle();

    let currentStreak = 1;
    let bestStreak = existing?.best_streak || 0;

    if (existing) {
        if (existing.last_completed_date === todayStr) {
            // Already counted today, just return current values
            return {
                currentStreak: existing.current_streak,
                bestStreak: existing.best_streak,
                newMilestone: null,
            };
        } else if (existing.last_completed_date === yesterdayStr) {
            // Consecutive - extend streak
            currentStreak = (existing.current_streak || 0) + 1;
        }
        // else: gap > 1 day → reset to 1 (strict)
    }

    bestStreak = Math.max(bestStreak, currentStreak);

    // Upsert streak record
    await supabase.from("habit_streaks").upsert({
        user_id: userId,
        habit_id: habitId,
        current_streak: currentStreak,
        best_streak: bestStreak,
        last_completed_date: todayStr,
    }, { onConflict: "user_id,habit_id" });

    // Check if we crossed a new milestone
    let newMilestone: StreakMilestone | null = null;
    const crossedMilestones = STREAK_MILESTONES.filter(m => currentStreak >= m);

    if (crossedMilestones.length > 0) {
        const topMilestone = crossedMilestones[crossedMilestones.length - 1];

        // Check if this milestone badge is already earned
        const { data: existingBadge } = await supabase
            .from("habit_badges")
            .select("id")
            .eq("user_id", userId)
            .eq("habit_id", habitId)
            .eq("milestone", topMilestone)
            .maybeSingle();

        if (!existingBadge) {
            // Award the badge
            await supabase.from("habit_badges").insert({
                user_id: userId,
                habit_id: habitId,
                pillar: "habit",
                milestone: topMilestone,
            });

            newMilestone = topMilestone;

            // Fire squad event for individual habit milestone
            const eventType = `streak_${topMilestone}` as `streak_${typeof topMilestone}`;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            logSquadEvent(userId, eventType as any, {
                habit_name: habitName,
                milestone: topMilestone,
                streak: currentStreak,
            });
        }
    }

    return { currentStreak, bestStreak, newMilestone };
}

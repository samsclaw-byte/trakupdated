import { SupabaseClient } from "@supabase/supabase-js";

export interface DebriefStats {
    nutrition: {
        yesterdayStatus: boolean; // Did they log food yesterday?
        currentStreak: number;
        bestStreak: number;
        bestIncreased: boolean;
    };
    fitness: {
        yesterdayStatus: boolean; // Did they workout yesterday?
        currentStreak: number;
        bestStreak: number;
        bestIncreased: boolean;
    };
    habits: {
        completedCount: number; // How many habits done yesterday?
        totalActive: number;
        currentStreak: number;
        bestStreak: number;
        bestIncreased: boolean;
    };
    newBadgePillar: "nutrition" | "fitness" | "habits" | null;
}

export async function calculateDebriefData(supabase: SupabaseClient, userId: string): Promise<DebriefStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = new Date(yesterday.getTime() - (yesterday.getTimezoneOffset() * 60000)).toISOString().split("T")[0];

    const DEFAULT_STATS: DebriefStats = {
        nutrition: { yesterdayStatus: false, currentStreak: 0, bestStreak: 0, bestIncreased: false },
        fitness: { yesterdayStatus: false, currentStreak: 0, bestStreak: 0, bestIncreased: false },
        habits: { completedCount: 0, totalActive: 0, currentStreak: 0, bestStreak: 0, bestIncreased: false },
        newBadgePillar: null
    };

    try {
        // --- 1. Nutrition Status ---
        // We'll approximate current nutrition streak by checking if yesterday was logged.
        // Full consecutive span calculation is heavy, so we check meals from yesterday.
        const { data: yesterdayMeals } = await supabase
            .from('meals')
            .select('id')
            .eq('user_id', userId)
            .gte('created_at', new Date(yesterday).toISOString())
            .lt('created_at', new Date(today).toISOString())
            .limit(1);

        const nutritionLogged = (yesterdayMeals && yesterdayMeals.length > 0) ? true : false;

        // Mocking complex streak calculation for nutrition MVP
        DEFAULT_STATS.nutrition.yesterdayStatus = nutritionLogged;
        DEFAULT_STATS.nutrition.currentStreak = nutritionLogged ? 1 : 0; // Simplified
        DEFAULT_STATS.nutrition.bestStreak = nutritionLogged ? 1 : 0;

        // --- 2. Fitness Status ---
        const { data: yesterdayWorkouts } = await supabase
            .from('workouts')
            .select('id')
            .eq('user_id', userId)
            .eq('date', yesterdayStr)
            .limit(1);

        const fitnessLogged = (yesterdayWorkouts && yesterdayWorkouts.length > 0) ? true : false;

        // Detailed Fitness Streak Calculation
        const { data: allWorkouts } = await supabase
            .from('workouts')
            .select('date')
            .eq('user_id', userId)
            .order('date', { ascending: false })
            .limit(100);

        let fitnessStreak = 0;
        let fitnessBest = 0;
        if (allWorkouts && allWorkouts.length > 0) {
            const uniqueDates = [...new Set(allWorkouts.map(w => w.date))];
            let current = 0;
            // Count backwards from yesterday
            const checkDate = new Date(yesterday.getTime() - (yesterday.getTimezoneOffset() * 60000));

            while (true) {
                const dStr = checkDate.toISOString().split("T")[0];
                if (uniqueDates.includes(dStr)) {
                    current++;
                    checkDate.setDate(checkDate.getDate() - 1);
                } else {
                    break;
                }
            }
            fitnessStreak = current;

            // Calc best
            let maxCurrent = 0;
            let currentRun = 1;
            for (let i = 1; i < uniqueDates.length; i++) {
                const prev = new Date(uniqueDates[i - 1]);
                const curr = new Date(uniqueDates[i]);
                const diff = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
                if (Math.round(diff) === 1) {
                    currentRun++;
                    maxCurrent = Math.max(maxCurrent, currentRun);
                } else {
                    currentRun = 1;
                }
            }
            fitnessBest = Math.max(maxCurrent, 1);
        }

        DEFAULT_STATS.fitness.yesterdayStatus = fitnessLogged;
        DEFAULT_STATS.fitness.currentStreak = fitnessStreak;
        DEFAULT_STATS.fitness.bestStreak = Math.max(fitnessBest, fitnessStreak);
        // Compare with local storage tracking if they beat it yesterday
        // For true realism, we'd need a separate table tracking 'historical maxes'. We will simulate the burst if current === best and best > 1
        DEFAULT_STATS.fitness.bestIncreased = (fitnessStreak > 1 && fitnessStreak >= fitnessBest);

        // --- 3. Habits Status ---
        const { data: activeHabits } = await supabase
            .from('habit_definitions')
            .select('id')
            .eq('user_id', userId)
            .eq('is_active', true);

        const { data: yesterdayHabits } = await supabase
            .from('habit_logs')
            .select('id')
            .eq('user_id', userId)
            .eq('date', yesterdayStr)
            .eq('completed', true);

        DEFAULT_STATS.habits.totalActive = activeHabits?.length || 0;
        DEFAULT_STATS.habits.completedCount = yesterdayHabits?.length || 0;

        // Fetch max streak from habit_streaks view
        const { data: streakData } = await supabase
            .from('habit_streaks')
            .select('habit_id, current_streak, best_streak')
            .eq('user_id', userId);

        let maxHabitCurrent = 0;
        let maxHabitBest = 0;
        if (streakData) {
            streakData.forEach(s => {
                if (s.current_streak > maxHabitCurrent) maxHabitCurrent = s.current_streak;
                if (s.best_streak > maxHabitBest) maxHabitBest = s.best_streak;
            });
        }

        DEFAULT_STATS.habits.currentStreak = maxHabitCurrent;
        DEFAULT_STATS.habits.bestStreak = maxHabitBest;
        DEFAULT_STATS.habits.bestIncreased = (maxHabitCurrent > 1 && maxHabitCurrent >= maxHabitBest);

        // --- Decide if "FIFA Pack" Supernova triggers ---
        // A simple rule: if a max run hits a generic multiple of 5 (5, 10, 15), we trigger a badge flip
        if (DEFAULT_STATS.habits.bestIncreased && DEFAULT_STATS.habits.bestStreak % 5 === 0) {
            DEFAULT_STATS.newBadgePillar = "habits";
        } else if (DEFAULT_STATS.fitness.bestIncreased && DEFAULT_STATS.fitness.bestStreak % 5 === 0) {
            DEFAULT_STATS.newBadgePillar = "fitness";
        }

        return DEFAULT_STATS;

    } catch (e) {
        console.error("Error calculating debrief:", e);
        return DEFAULT_STATS;
    }
}

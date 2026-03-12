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
        // --- 1. Nutrition Status (Under calorie goal = achieved) ---
        // Fetch user's daily calorie goal
        const { data: userProfile } = await supabase
            .from('users')
            .select('daily_calories')
            .eq('id', userId)
            .single();
        const dailyCalorieGoal = userProfile?.daily_calories || 2400;

        // Fetch last 30 days of meals with calorie sums per day
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);

        const { data: recentMeals } = await supabase
            .from('meals')
            .select('calories, created_at')
            .eq('user_id', userId)
            .gte('created_at', thirtyDaysAgo.toISOString());

        // Sum calories per day
        const caloriesByDay = new Map<string, number>();
        if (recentMeals) {
            for (const meal of recentMeals) {
                const mealDate = new Date(meal.created_at);
                const dayStr = new Date(mealDate.getTime() - (mealDate.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
                caloriesByDay.set(dayStr, (caloriesByDay.get(dayStr) || 0) + (Number(meal.calories) || 0));
            }
        }

        // Check if yesterday was under calorie goal (must have logged at least 1 meal)
        const yesterdayCalories = caloriesByDay.get(yesterdayStr) || 0;
        const yesterdayHasMeals = caloriesByDay.has(yesterdayStr);
        const nutritionLogged = yesterdayHasMeals && yesterdayCalories <= dailyCalorieGoal;

        // Calculate streak: count backwards from yesterday
        let nutritionStreak = 0;
        let nutritionBest = 0;
        const checkDate = new Date(yesterday);
        while (true) {
            const dStr = new Date(checkDate.getTime() - (checkDate.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
            const dayCals = caloriesByDay.get(dStr);
            if (dayCals !== undefined && dayCals <= dailyCalorieGoal) {
                nutritionStreak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }
        // Simple best: scan all days for longest consecutive run
        let currentRun = 0;
        const sortedDays = [...caloriesByDay.entries()].sort((a, b) => a[0].localeCompare(b[0]));
        for (let i = 0; i < sortedDays.length; i++) {
            if (sortedDays[i][1] <= dailyCalorieGoal) {
                currentRun++;
                nutritionBest = Math.max(nutritionBest, currentRun);
            } else {
                currentRun = 0;
            }
        }

        DEFAULT_STATS.nutrition.yesterdayStatus = nutritionLogged;
        DEFAULT_STATS.nutrition.currentStreak = nutritionStreak;
        DEFAULT_STATS.nutrition.bestStreak = Math.max(nutritionBest, nutritionStreak);

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

        // Fetch overall streak from perfect_days
        const { data: streakData } = await supabase
            .from('habit_streaks')
            .select('current_streak, best_streak')
            .eq('user_id', userId)
            .eq('habit_id', 'perfect_days')
            .limit(1);

        let maxHabitCurrent = 0;
        let maxHabitBest = 0;
        if (streakData && streakData.length > 0) {
            maxHabitCurrent = streakData[0].current_streak;
            maxHabitBest = streakData[0].best_streak;
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

import { SupabaseClient } from "@supabase/supabase-js";
import { RecapData } from "@/components/hub/DailyRecapOverlay";

/**
 * Calculate all recap data for the Daily Recap overlay.
 * Gathers yesterday's meals, workouts, habits, whoop data,
 * streak calculations (current + best), and profile badge info.
 */
export async function calculateRecapData(
    supabase: SupabaseClient,
    userId: string,
    userName: string
): Promise<RecapData | null> {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const yesterdayStr = new Date(yesterday.getTime() - (yesterday.getTimezoneOffset() * 60000)).toISOString().split("T")[0];

        const yesterdayDate = yesterday.toLocaleDateString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
        });

        // --- 1. Profile ---
        const { data: profile } = await supabase
            .from("users")
            .select("bmr, daily_calories, weight, name, created_at, member_number, is_trak_plus")
            .eq("id", userId)
            .single();

        const bmr = profile?.bmr || profile?.daily_calories || 2000;
        const fullName = profile?.name || userName;
        const nameParts = fullName.split(" ");
        const userInitials = nameParts.map((n: string) => n[0]).join("").toUpperCase().substring(0, 2);
        const sinceDate = profile?.created_at
            ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
            : "2026";
        const memberNumber = profile?.member_number || "0001";
        const isTrakPlus = !!profile?.is_trak_plus;

        // --- 2. Yesterday's Meals ---
        const startOfYesterday = yesterday.toISOString();
        const endOfYesterday = new Date(today).toISOString();

        const { data: yesterdayMeals } = await supabase
            .from("meals")
            .select("meal_type, calories")
            .eq("user_id", userId)
            .gte("created_at", startOfYesterday)
            .lt("created_at", endOfYesterday);

        const meals = (yesterdayMeals || []).map(m => ({
            meal_type: m.meal_type || "Meal",
            calories: Number(m.calories) || 0,
        }));
        const totalEaten = meals.reduce((sum, m) => sum + m.calories, 0);
        const hasMeals = meals.length > 0 && totalEaten > 0;

        // --- 3. Yesterday's Workouts ---
        const { data: yesterdayWorkouts } = await supabase
            .from("workouts")
            .select("activity_type, calories_burned, duration_minutes")
            .eq("user_id", userId)
            .eq("date", yesterdayStr);

        const workouts = (yesterdayWorkouts || []).map(w => ({
            activity_type: w.activity_type || "Workout",
            calories_burned: Number(w.calories_burned) || 0,
            duration_minutes: Number(w.duration_minutes) || 0,
        }));
        const totalWorkoutCalories = workouts.reduce((sum, w) => sum + w.calories_burned, 0);

        // --- 4. Yesterday's Habits ---
        const { data: activeHabits } = await supabase
            .from("habit_definitions")
            .select("id, name")
            .eq("user_id", userId)
            .eq("is_active", true);

        const { data: habitLogs } = await supabase
            .from("habit_logs")
            .select("habit_id")
            .eq("user_id", userId)
            .eq("date", yesterdayStr)
            .eq("completed", true);

        const completedIds = new Set((habitLogs || []).map(l => l.habit_id));
        const habits = (activeHabits || []).map(h => ({
            name: h.name || "Habit",
            completed: completedIds.has(h.id),
        }));
        const habitsCompleted = habits.filter(h => h.completed).length;
        const habitsTotal = habits.length;
        const habitsAchieved = habitsTotal > 0 && habitsCompleted === habitsTotal;

        // --- 5. Whoop Data ---
        const { data: whoopDaily } = await supabase
            .from("whoop_daily")
            .select("recovery_score, strain, hrv, sleep_duration_minutes, sleep_performance")
            .eq("user_id", userId)
            .eq("date", yesterdayStr)
            .maybeSingle();

        // --- 6. Streak Calculations ---
        const totalBudget = bmr + totalWorkoutCalories;
        const nutritionAchieved = hasMeals && totalEaten <= totalBudget;
        const fitnessAchieved = workouts.length > 0;

        // Nutrition streak: consecutive days under calorie budget with meals logged
        const nutritionStreaks = await calculatePillarStreak(supabase, userId, "calorie_target_hit", yesterdayStr, nutritionAchieved);

        // Fitness streak: consecutive days with workouts
        const fitnessStreaks = await calculatePillarStreak(supabase, userId, "workout_completed", yesterdayStr, fitnessAchieved);

        // Habits streak = perfect days (all habits completed)
        const habitsStreaks = await calculatePillarStreak(supabase, userId, "habit_completed", yesterdayStr, habitsAchieved);

        return {
            userName: nameParts[0] || userName,
            userInitials,
            sinceDate,
            memberNumber,
            isTrakPlus,
            yesterdayDate,
            bmr,
            workouts,
            totalWorkoutCalories,
            totalEaten,
            meals,
            nutritionAchieved,
            fitnessAchieved,
            fitnessStreak: fitnessStreaks.current,
            habits,
            habitsCompleted,
            habitsTotal,
            habitsAchieved,
            habitStreak: habitsStreaks.current,
            whoopData: whoopDaily ? {
                recovery_score: whoopDaily.recovery_score,
                strain: whoopDaily.strain,
                hrv: whoopDaily.hrv,
                sleep_duration_minutes: whoopDaily.sleep_duration_minutes,
                sleep_performance: whoopDaily.sleep_performance,
            } : undefined,
            streaks: {
                nutrition: nutritionStreaks,
                fitness: fitnessStreaks,
                habits: habitsStreaks,
            },
            pointsEarned: {
                nutrition: nutritionAchieved ? 1 : 0,
                fitness: fitnessAchieved ? 1 : 0,
                habits: habitsAchieved ? 1 : 0,
            },
        };
    } catch (e) {
        console.error("Error calculating recap data:", e);
        return null;
    }
}

/**
 * Calculate current and best streak for a pillar based on squad_feed events.
 */
async function calculatePillarStreak(
    supabase: SupabaseClient,
    userId: string,
    eventType: string,
    yesterdayStr: string,
    achievedYesterday: boolean
): Promise<{ current: number; best: number }> {
    try {
        // Get all dates this event was achieved, ordered newest first
        const { data: events } = await supabase
            .from("squad_feed")
            .select("created_at")
            .eq("user_id", userId)
            .eq("event_type", eventType)
            .order("created_at", { ascending: false })
            .limit(365);

        if (!events || events.length === 0) {
            return { current: achievedYesterday ? 1 : 0, best: achievedYesterday ? 1 : 0 };
        }

        // Get unique dates
        const dates = [...new Set(events.map(e => {
            const d = new Date(e.created_at);
            return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
        }))].sort().reverse();

        // Current streak: count consecutive days from yesterday backward
        let currentStreak = 0;
        const checkDate = new Date(yesterdayStr + "T12:00:00Z");

        // If achieved yesterday, include it
        if (achievedYesterday) {
            currentStreak = 1;
            checkDate.setDate(checkDate.getDate() - 1);
        }

        while (true) {
            const dStr = checkDate.toISOString().split("T")[0];
            if (dates.includes(dStr)) {
                currentStreak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }

        // Best streak: iterate through all dates
        let bestStreak = currentStreak;
        if (dates.length > 1) {
            let streak = 1;
            for (let i = 1; i < dates.length; i++) {
                const prev = new Date(dates[i - 1] + "T12:00:00Z");
                const curr = new Date(dates[i] + "T12:00:00Z");
                const diff = Math.round((prev.getTime() - curr.getTime()) / (1000 * 3600 * 24));
                if (diff === 1) {
                    streak++;
                    bestStreak = Math.max(bestStreak, streak);
                } else {
                    streak = 1;
                }
            }
        }

        return { current: currentStreak, best: Math.max(bestStreak, currentStreak) };
    } catch {
        return { current: 0, best: 0 };
    }
}

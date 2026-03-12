import { SupabaseClient } from "@supabase/supabase-js";
import { RecapData } from "@/components/hub/DailyRecapOverlay";

/**
 * Calculate all recap data for the Daily Recap overlay.
 * This gathers yesterday's meals, workouts, habits, whoop data,
 * and profile card points.
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

        // Format yesterday's date nicely
        const yesterdayDate = yesterday.toLocaleDateString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
        });

        // --- 1. Profile (BMR) ---
        const { data: profile } = await supabase
            .from("users")
            .select("bmr, daily_calories, weight")
            .eq("id", userId)
            .single();

        const bmr = profile?.bmr || profile?.daily_calories || 2000;

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

        // Habit streak
        const { data: streakData } = await supabase
            .from("habit_streaks")
            .select("current_streak")
            .eq("user_id", userId)
            .eq("habit_id", "perfect_days")
            .limit(1);
        const habitStreak = streakData?.[0]?.current_streak || 0;

        // --- 5. Fitness streak ---
        const { data: allWorkoutDates } = await supabase
            .from("workouts")
            .select("date")
            .eq("user_id", userId)
            .order("date", { ascending: false })
            .limit(100);

        let fitnessStreak = 0;
        if (allWorkoutDates && allWorkoutDates.length > 0) {
            const uniqueDates = [...new Set(allWorkoutDates.map(w => w.date))];
            const checkDate = new Date(yesterday.getTime() - (yesterday.getTimezoneOffset() * 60000));
            while (true) {
                const dStr = checkDate.toISOString().split("T")[0];
                if (uniqueDates.includes(dStr)) {
                    fitnessStreak++;
                    checkDate.setDate(checkDate.getDate() - 1);
                } else {
                    break;
                }
            }
        }

        // --- 6. Whoop Data (yesterday) ---
        const { data: whoopDaily } = await supabase
            .from("whoop_daily")
            .select("recovery_score, strain, hrv, sleep_duration_minutes, sleep_performance")
            .eq("user_id", userId)
            .eq("date", yesterdayStr)
            .maybeSingle();

        // --- 7. Points calculation ---
        const totalBudget = bmr + totalWorkoutCalories;
        const nutritionAchieved = hasMeals && totalEaten <= totalBudget;
        const fitnessAchieved = workouts.length > 0;

        // Fetch current profile card points (from squad_feed counts or a dedicated field)
        // For now, count historical pillar achievements
        const { count: nutritionCount } = await supabase
            .from("squad_feed")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("event_type", "calorie_target_hit");
        const { count: fitnessCount } = await supabase
            .from("squad_feed")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("event_type", "workout_completed");
        const { count: habitsCount } = await supabase
            .from("squad_feed")
            .select("id", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("event_type", "habit_completed");

        return {
            userName,
            yesterdayDate,
            bmr,
            workouts,
            totalWorkoutCalories,
            totalEaten,
            meals,
            nutritionAchieved,
            fitnessAchieved,
            fitnessStreak,
            habits,
            habitsCompleted,
            habitsTotal,
            habitsAchieved,
            habitStreak,
            whoopData: whoopDaily ? {
                recovery_score: whoopDaily.recovery_score,
                strain: whoopDaily.strain,
                hrv: whoopDaily.hrv,
                sleep_duration_minutes: whoopDaily.sleep_duration_minutes,
                sleep_performance: whoopDaily.sleep_performance,
            } : undefined,
            currentPoints: {
                nutrition: nutritionCount || 0,
                fitness: fitnessCount || 0,
                habits: habitsCount || 0,
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

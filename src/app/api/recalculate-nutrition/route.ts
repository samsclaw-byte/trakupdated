import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// One-time recalculation: check last 7 days for under-calorie days
// For each qualifying day, post calorie_target_hit to squad_feed if not already posted
export async function POST(req: Request) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const results: Record<string, unknown> = {};

    try {
        // Get all users with meals in the last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: users } = await supabase
            .from("users")
            .select("id, daily_calories");

        if (!users || users.length === 0) {
            return NextResponse.json({ message: "No users found" });
        }

        for (const user of users) {
            const dailyGoal = user.daily_calories || 2400;

            // Fetch meals for last 7 days
            const { data: meals } = await supabase
                .from("meals")
                .select("calories, created_at")
                .eq("user_id", user.id)
                .gte("created_at", sevenDaysAgo.toISOString());

            if (!meals || meals.length === 0) continue;

            // Sum calories per day
            const caloriesByDay = new Map<string, number>();
            for (const meal of meals) {
                const mealDate = new Date(meal.created_at);
                const dayStr = new Date(mealDate.getTime() - (mealDate.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
                caloriesByDay.set(dayStr, (caloriesByDay.get(dayStr) || 0) + (Number(meal.calories) || 0));
            }

            // Check which days are under goal
            const qualifyingDays: string[] = [];
            for (const [day, totalCals] of caloriesByDay.entries()) {
                if (totalCals <= dailyGoal && totalCals > 0) {
                    qualifyingDays.push(day);
                }
            }

            if (qualifyingDays.length === 0) continue;

            // Find user's squads
            const { data: userSquads } = await supabase
                .from("squad_members")
                .select("squad_id")
                .eq("user_id", user.id);

            if (!userSquads || userSquads.length === 0) continue;

            // Check which calorie_target_hit events already exist this week
            const { data: existingEvents } = await supabase
                .from("squad_feed")
                .select("created_at")
                .eq("user_id", user.id)
                .eq("event_type", "calorie_target_hit")
                .gte("created_at", sevenDaysAgo.toISOString());

            const existingDays = new Set(
                (existingEvents || []).map(e => {
                    const d = new Date(e.created_at);
                    return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
                })
            );

            // Post missing events
            let awarded = 0;
            for (const day of qualifyingDays) {
                if (existingDays.has(day)) continue;

                const feedInserts = userSquads.map(s => ({
                    squad_id: s.squad_id,
                    user_id: user.id,
                    event_type: "calorie_target_hit",
                    metadata: { calories: caloriesByDay.get(day), retroactive: true },
                    created_at: new Date(day + "T23:59:00Z").toISOString(),
                }));

                await supabase.from("squad_feed").insert(feedInserts);
                awarded++;
            }

            if (awarded > 0) {
                results[user.id] = { qualifying_days: qualifyingDays.length, new_events_posted: awarded };
            }
        }

        return NextResponse.json({
            success: true,
            message: "Nutrition recalculation complete",
            results,
        });
    } catch (error) {
        console.error("Recalculation error:", error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

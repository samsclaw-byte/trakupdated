import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { fetchWhoopAPI, mapWhoopSport } from "@/utils/whoop";

interface WhoopWorkout {
    id: number;
    start: string;
    end: string;
    sport_id: number;
    score: {
        strain: number;
        average_heart_rate: number;
        max_heart_rate: number;
        kilojoule: number;
        distance_meter?: number;
    } | null;
}

interface WhoopCycle {
    id: number;
    start: string;
    end: string;
    score: {
        strain: number;
        kilojoule: number;
        average_heart_rate: number;
        max_heart_rate: number;
    } | null;
}

interface WhoopRecovery {
    cycle_id: number;
    score: {
        recovery_score: number;
        resting_heart_rate: number;
        hrv_rmssd_milli: number;
        spo2_percentage?: number;
        skin_temp_celsius?: number;
    } | null;
}

interface WhoopSleep {
    id: number;
    start: string;
    end: string;
    score: {
        sleep_performance_percentage: number;
        total_in_bed_time_milli: number;
        total_light_sleep_time_milli: number;
        total_slow_wave_sleep_time_milli: number;
        total_rem_sleep_time_milli: number;
        total_awake_time_milli: number;
    } | null;
}

/**
 * POST /api/whoop/sync
 * Fetches the latest Whoop data and saves to Supabase.
 */
export async function POST() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get stored tokens
        const { data: tokens, error: tokenErr } = await supabase
            .from("whoop_tokens")
            .select("*")
            .eq("user_id", user.id)
            .single();

        if (tokenErr || !tokens) {
            return NextResponse.json({ error: "Whoop not connected" }, { status: 400 });
        }

        const results = {
            workouts_synced: 0,
            recovery_synced: false,
            sleep_synced: false,
            workout_error: null as string | null,
            recovery_error: null as string | null,
        };

        // ─── Fetch recent workouts (last 7 days) ──────────────
        try {
            const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
            const workoutData = await fetchWhoopAPI(
                `/v2/activity/workout?start=${sevenDaysAgo}&limit=25`,
                tokens,
                supabase,
                user.id
            ) as { records: WhoopWorkout[] };

            for (const w of workoutData.records || []) {
                const startDate = new Date(w.start);
                const endDate = new Date(w.end);
                const durationMinutes = Math.round((endDate.getTime() - startDate.getTime()) / 60000);
                const dateStr = startDate.toISOString().split("T")[0];
                const caloriesBurned = w.score ? Math.round(w.score.kilojoule / 4.184) : 0;

                // Upsert: avoid duplicate Whoop workouts
                const { error: wErr } = await supabase
                    .from("workouts")
                    .upsert({
                        user_id: user.id,
                        activity_type: mapWhoopSport(w.sport_id),
                        intensity: w.score && w.score.strain > 14 ? "high" : w.score && w.score.strain > 8 ? "moderate" : "light",
                        duration_minutes: durationMinutes,
                        calories_burned: caloriesBurned,
                        date: dateStr,
                        source: "whoop",
                        external_id: `whoop_${w.id}`,
                    }, { onConflict: "external_id" });

                if (!wErr) results.workouts_synced++;
            }
        } catch (e) {
            console.error("Failed to sync Whoop workouts:", e);
            results.workout_error = e instanceof Error ? e.message : String(e);
        }

        // ─── Fetch today's recovery ──────────────────────────
        try {
            const today = new Date().toISOString().split("T")[0];
            const cycleData = await fetchWhoopAPI(
                `/v2/cycle?start=${today}T00:00:00.000Z&limit=1`,
                tokens,
                supabase,
                user.id
            ) as { records: WhoopCycle[] };

            if (cycleData.records?.length > 0) {
                const cycle = cycleData.records[0];

                // Get recovery for this cycle
                const recoveryData = await fetchWhoopAPI(
                    `/v2/recovery?start=${today}T00:00:00.000Z&limit=1`,
                    tokens,
                    supabase,
                    user.id
                ) as { records: WhoopRecovery[] };

                // Get sleep for today
                const sleepData = await fetchWhoopAPI(
                    `/v2/activity/sleep?start=${today}T00:00:00.000Z&limit=1`,
                    tokens,
                    supabase,
                    user.id
                ) as { records: WhoopSleep[] };

                const recovery = recoveryData.records?.[0];
                const sleep = sleepData.records?.[0];

                // Upsert daily data
                const { error: dailyErr } = await supabase
                    .from("whoop_daily")
                    .upsert({
                        user_id: user.id,
                        date: today,
                        recovery_score: recovery?.score?.recovery_score ?? null,
                        hrv: recovery?.score?.hrv_rmssd_milli ?? null,
                        resting_heart_rate: recovery?.score?.resting_heart_rate ?? null,
                        spo2: recovery?.score?.spo2_percentage ?? null,
                        skin_temp: recovery?.score?.skin_temp_celsius ?? null,
                        sleep_performance: sleep?.score?.sleep_performance_percentage ?? null,
                        sleep_duration_minutes: sleep?.score
                            ? Math.round(sleep.score.total_in_bed_time_milli / 60000)
                            : null,
                        strain: cycle.score?.strain ?? null,
                        calories_burned: cycle.score
                            ? Math.round(cycle.score.kilojoule / 4.184)
                            : null,
                        raw_data: { cycle, recovery, sleep },
                    }, { onConflict: "user_id,date" });

                if (!dailyErr) {
                    results.recovery_synced = true;
                    results.sleep_synced = true;
                }
            }
        } catch (e) {
            console.error("Failed to sync Whoop recovery:", e);
            results.recovery_error = e instanceof Error ? e.message : String(e);
        }

        return NextResponse.json({
            success: true,
            ...results,
        });
    } catch (error) {
        console.error("Whoop sync error:", error);
        const msg = error instanceof Error ? error.message : "Sync failed";
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

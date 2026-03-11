/**
 * Core Whoop sync logic — reusable by both the manual sync route and the cron job.
 */

import { fetchWhoopAPI, mapWhoopSport } from "@/utils/whoop";
import { SupabaseClient } from "@supabase/supabase-js";

// ─── Whoop v2 type definitions ──────────────────────────────────

interface WhoopWorkout {
    id: string;
    start: string;
    end: string;
    sport_id: number;
    score_state: string;
    score: {
        strain: number;
        average_heart_rate: number;
        max_heart_rate: number;
        kilojoule: number;
        distance_meter?: number;
    } | null;
}

interface WhoopCycle {
    id: string;
    start: string;
    end: string;
    score_state: string;
    score: {
        strain: number;
        kilojoule: number;
        average_heart_rate: number;
        max_heart_rate: number;
    } | null;
}

interface WhoopRecovery {
    cycle_id: string;
    score_state: string;
    score: {
        recovery_score: number;
        resting_heart_rate: number;
        hrv_rmssd_milli: number;
        spo2_percentage?: number;
        skin_temp_celsius?: number;
    } | null;
}

interface WhoopSleep {
    id: string;
    start: string;
    end: string;
    score_state: string;
    score: {
        sleep_performance_percentage: number;
        respiratory_rate?: number;
        sleep_efficiency_percentage?: number;
        stage_summary: {
            total_in_bed_time_milli: number;
            total_light_sleep_time_milli: number;
            total_slow_wave_sleep_time_milli: number;
            total_rem_sleep_time_milli: number;
            total_awake_time_milli: number;
        };
    } | null;
}

interface PaginatedResponse<T> {
    records: T[];
    next_token?: string;
}

export interface SyncResults {
    workouts_synced: number;
    recovery_days_synced: number;
    sleep_synced: boolean;
    workout_error: string | null;
    recovery_error: string | null;
}

// ─── Paginated fetch helper ─────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchAllPages<T>(endpoint: string, tokens: any, supabase: SupabaseClient, userId: string): Promise<T[]> {
    const allRecords: T[] = [];
    let nextToken: string | undefined = undefined;
    let pageCount = 0;
    const maxPages = 20; // Safety limit

    do {
        const separator = endpoint.includes("?") ? "&" : "?";
        const url = nextToken
            ? `${endpoint}${separator}nextToken=${encodeURIComponent(nextToken)}`
            : endpoint;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await fetchWhoopAPI(url, tokens, supabase, userId) as any;
        const records = response.records || response.data || [];
        if (records.length > 0) {
            allRecords.push(...records);
        }
        // Whoop v2 uses next_token for pagination
        nextToken = response.next_token || response.nextToken || undefined;
        pageCount++;
        console.log(`[Whoop Pagination] Page ${pageCount}: ${records.length} records, nextToken: ${nextToken ? 'yes' : 'no'}`);
    } while (nextToken && pageCount < maxPages);

    console.log(`[Whoop Pagination] Total: ${allRecords.length} records across ${pageCount} pages`);
    return allRecords;
}

// ─── Core sync logic ────────────────────────────────────────────

export async function syncWhoopData(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tokens: any,
    supabase: SupabaseClient,
    userId: string,
    days: number
): Promise<SyncResults> {
    const results: SyncResults = {
        workouts_synced: 0,
        recovery_days_synced: 0,
        sleep_synced: false,
        workout_error: null,
        recovery_error: null,
    };

    const startDate = new Date(Date.now() - days * 86400000).toISOString();

    // ─── Fetch workouts ──────────────────────────────
    try {
        const workouts = await fetchAllPages<WhoopWorkout>(
            `/v2/activity/workout?start=${startDate}&limit=25`,
            tokens, supabase, userId
        );

        for (const w of workouts) {
            if (w.score_state !== "SCORED" || !w.score) continue;

            const startDt = new Date(w.start);
            const endDt = new Date(w.end);
            const durationMinutes = Math.round((endDt.getTime() - startDt.getTime()) / 60000);
            const dateStr = startDt.toISOString().split("T")[0];
            const caloriesBurned = Math.round(w.score.kilojoule / 4.184);

            const { error: wErr } = await supabase
                .from("workouts")
                .upsert({
                    user_id: userId,
                    activity_type: mapWhoopSport(w.sport_id),
                    intensity: w.score.strain > 14 ? "high" : w.score.strain > 8 ? "moderate" : "light",
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

    // ─── Fetch cycles + recovery + sleep ─────────────
    try {
        const cycles = await fetchAllPages<WhoopCycle>(
            `/v2/cycle?start=${startDate}&limit=25`,
            tokens, supabase, userId
        );

        const recoveries = await fetchAllPages<WhoopRecovery>(
            `/v2/recovery?start=${startDate}&limit=25`,
            tokens, supabase, userId
        );

        const sleeps = await fetchAllPages<WhoopSleep>(
            `/v2/activity/sleep?start=${startDate}&limit=25`,
            tokens, supabase, userId
        );

        // Build lookup maps by date
        const recoveryByDate = new Map<string, WhoopRecovery>();
        for (const r of recoveries) {
            const matchingCycle = cycles.find(c => c.id === r.cycle_id);
            if (matchingCycle) {
                const dateKey = new Date(matchingCycle.start).toISOString().split("T")[0];
                recoveryByDate.set(dateKey, r);
            }
        }

        const sleepByDate = new Map<string, WhoopSleep>();
        for (const s of sleeps) {
            const dateKey = new Date(s.end).toISOString().split("T")[0];
            if (!sleepByDate.has(dateKey)) {
                sleepByDate.set(dateKey, s);
            }
        }

        // Upsert a whoop_daily row per cycle date
        for (const cycle of cycles) {
            const dateKey = new Date(cycle.start).toISOString().split("T")[0];
            const recovery = recoveryByDate.get(dateKey);
            const sleep = sleepByDate.get(dateKey);

            const sleepDurationMins = sleep?.score?.stage_summary
                ? Math.round(sleep.score.stage_summary.total_in_bed_time_milli / 60000)
                : null;

            const { error: dailyErr } = await supabase
                .from("whoop_daily")
                .upsert({
                    user_id: userId,
                    date: dateKey,
                    recovery_score: recovery?.score?.recovery_score ?? null,
                    hrv: recovery?.score?.hrv_rmssd_milli ?? null,
                    resting_heart_rate: recovery?.score?.resting_heart_rate ?? null,
                    spo2: recovery?.score?.spo2_percentage ?? null,
                    skin_temp: recovery?.score?.skin_temp_celsius ?? null,
                    sleep_performance: sleep?.score?.sleep_performance_percentage ?? null,
                    sleep_duration_minutes: sleepDurationMins,
                    strain: cycle.score?.strain ?? null,
                    calories_burned: cycle.score
                        ? Math.round(cycle.score.kilojoule / 4.184)
                        : null,
                    raw_data: { cycle, recovery, sleep },
                }, { onConflict: "user_id,date" });

            if (!dailyErr) results.recovery_days_synced++;
        }

        if (sleeps.length > 0) results.sleep_synced = true;
    } catch (e) {
        console.error("Failed to sync Whoop recovery/sleep:", e);
        results.recovery_error = e instanceof Error ? e.message : String(e);
    }

    // Update last_synced_at
    await supabase
        .from("whoop_tokens")
        .update({ updated_at: new Date().toISOString() })
        .eq("user_id", userId);

    return results;
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { syncWhoopData } from "@/utils/whoop-sync";

/**
 * POST /api/whoop/sync
 * Fetches the latest Whoop data and saves to Supabase.
 * Auto-detects deep sync (90 days) vs regular (7 days).
 */
export async function POST(req: NextRequest) {
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

        // Determine sync depth
        const urlParams = new URL(req.url).searchParams;
        let days = parseInt(urlParams.get("days") || "0", 10);

        if (!days) {
            // Auto-detect: if no data exists, do deep sync (90 days)
            const { count } = await supabase
                .from("whoop_daily")
                .select("id", { count: "exact", head: true })
                .eq("user_id", user.id);

            days = (count && count > 0) ? 7 : 90;
        }

        const results = await syncWhoopData(tokens, supabase, user.id, days);

        return NextResponse.json({
            success: true,
            days_synced: days,
            ...results,
        });
    } catch (error) {
        console.error("Whoop sync error:", error);
        const msg = error instanceof Error ? error.message : "Sync failed";
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

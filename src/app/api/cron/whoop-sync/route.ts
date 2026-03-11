import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { syncWhoopData } from "@/utils/whoop-sync";

/**
 * GET /api/cron/whoop-sync
 * Triggered by Vercel Cron daily at 00:00 UTC.
 * Syncs last 7 days of Whoop data for all connected users.
 */
export async function GET(req: NextRequest) {
    try {
        // Verify cron secret (Vercel sends this automatically)
        const authHeader = req.headers.get("authorization");
        const cronSecret = process.env.CRON_SECRET;

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Use service role to bypass RLS for all users
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

        if (!supabaseServiceKey) {
            return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY not configured" }, { status: 500 });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Get all users with Whoop tokens
        const { data: allTokens, error: tokensErr } = await supabase
            .from("whoop_tokens")
            .select("*");

        if (tokensErr || !allTokens) {
            return NextResponse.json({
                error: "Failed to fetch Whoop tokens",
                details: tokensErr?.message,
            }, { status: 500 });
        }

        const syncResults = [];

        for (const tokens of allTokens) {
            try {
                const result = await syncWhoopData(tokens, supabase, tokens.user_id, 7);
                syncResults.push({
                    user_id: tokens.user_id,
                    success: true,
                    ...result,
                });
            } catch (e) {
                syncResults.push({
                    user_id: tokens.user_id,
                    success: false,
                    error: e instanceof Error ? e.message : String(e),
                });
            }
        }

        return NextResponse.json({
            success: true,
            users_synced: syncResults.filter(r => r.success).length,
            users_failed: syncResults.filter(r => !r.success).length,
            details: syncResults,
        });
    } catch (error) {
        console.error("Cron whoop-sync error:", error);
        const msg = error instanceof Error ? error.message : "Cron sync failed";
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

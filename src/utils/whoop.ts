/**
 * Whoop API utility helpers
 * Handles token management, API calls, and data sync
 */

import { SupabaseClient } from "@supabase/supabase-js";


const WHOOP_API_BASE = "https://api.prod.whoop.com/developer";
const WHOOP_TOKEN_URL = "https://api.prod.whoop.com/oauth/oauth2/token";

// ─── Token helpers ──────────────────────────────────────────────

interface WhoopTokens {
    access_token: string;
    refresh_token: string;
    expires_at: string;
    whoop_user_id: string | null;
}

export async function refreshWhoopToken(refreshToken: string): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
}> {
    const res = await fetch(WHOOP_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: refreshToken,
            client_id: process.env.WHOOP_CLIENT_ID!,
            client_secret: process.env.WHOOP_CLIENT_SECRET!,
            scope: "offline",
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Whoop token refresh failed (${res.status}): ${err}`);
    }

    return res.json();
}

// ─── API call with auto-refresh ─────────────────────────────────

export async function fetchWhoopAPI(
    endpoint: string,
    tokens: WhoopTokens,
    supabase: SupabaseClient,
    userId: string
): Promise<unknown> {
    let accessToken = tokens.access_token;

    // Check if token is expired (with 5 min buffer)
    const expiresAt = new Date(tokens.expires_at);
    const now = new Date();
    if (now >= new Date(expiresAt.getTime() - 5 * 60 * 1000)) {
        // Refresh token
        const refreshed = await refreshWhoopToken(tokens.refresh_token);
        accessToken = refreshed.access_token;

        // Update the tokens object in-memory so subsequent calls use new tokens
        tokens.access_token = refreshed.access_token;
        tokens.refresh_token = refreshed.refresh_token;
        tokens.expires_at = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();

        // Update in DB
        await supabase
            .from("whoop_tokens")
            .update({
                access_token: refreshed.access_token,
                refresh_token: refreshed.refresh_token,
                expires_at: tokens.expires_at,
                updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId);
    }

    const res = await fetch(`${WHOOP_API_BASE}${endpoint}`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Whoop API error (${res.status}): ${err}`);
    }

    return res.json();
}

// ─── Sport ID → activity type mapper ────────────────────────────

const WHOOP_SPORT_MAP: Record<number, string> = {
    0: "Running",
    1: "Cycling",
    2: "Swimming",
    3: "Strength Training",
    4: "HIIT",
    5: "Yoga",
    6: "Walking",
    16: "CrossFit",
    33: "Rowing",
    44: "Weightlifting",
    48: "Basketball",
    49: "Soccer",
    52: "Tennis",
    63: "Boxing",
    71: "Functional Fitness",
    84: "Pilates",
    // Default fallback handled in the function
};

export function mapWhoopSport(sportId: number): string {
    return WHOOP_SPORT_MAP[sportId] || "Workout";
}

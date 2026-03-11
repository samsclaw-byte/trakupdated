import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

/**
 * GET /api/whoop/callback
 * Exchanges the authorization code for tokens and stores them.
 */
export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const error = url.searchParams.get("error");

        if (error) {
            console.error("Whoop auth denied:", error);
            return NextResponse.redirect(new URL("/profile?whoop=denied", req.url));
        }

        if (!code || !state) {
            return NextResponse.redirect(new URL("/profile?whoop=error&reason=missing_code_or_state", req.url));
        }

        // Verify CSRF state
        const cookieStore = await cookies();
        const storedState = cookieStore.get("whoop_oauth_state")?.value;
        if (state !== storedState) {
            console.error("Whoop OAuth state mismatch", { state, storedState });
            return NextResponse.redirect(new URL(`/profile?whoop=error&reason=state_mismatch&s=${state}&c=${storedState}`, req.url));
        }
        cookieStore.delete("whoop_oauth_state");

        // Auth check
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.redirect(new URL("/?error=unauthorized", req.url));
        }

        // Exchange code for tokens
        const clientId = process.env.WHOOP_CLIENT_ID!;
        const clientSecret = process.env.WHOOP_CLIENT_SECRET!;
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
        const redirectUri = `${appUrl}/api/whoop/callback`;

        const tokenRes = await fetch("https://api.prod.whoop.com/oauth/oauth2/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                grant_type: "authorization_code",
                code,
                redirect_uri: redirectUri,
                client_id: clientId,
                client_secret: clientSecret,
            }),
        });

        if (!tokenRes.ok) {
            const errText = await tokenRes.text();
            console.error("Whoop token exchange failed:", tokenRes.status, errText);
            return NextResponse.redirect(new URL(`/profile?whoop=error&reason=exchange_failed&status=${tokenRes.status}`, req.url));
        }

        const tokenData = await tokenRes.json();
        const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();

        // Try to get Whoop user ID
        let whoopUserId: string | null = null;
        try {
            const profileRes = await fetch("https://api.prod.whoop.com/developer/v1/user/profile/basic", {
                headers: { Authorization: `Bearer ${tokenData.access_token}` },
            });
            if (profileRes.ok) {
                const profile = await profileRes.json();
                whoopUserId = String(profile.user_id);
            }
        } catch {
            // Non-critical — continue without Whoop user ID
        }

        // Upsert tokens into whoop_tokens table
        const { error: dbError } = await supabase
            .from("whoop_tokens")
            .upsert({
                user_id: user.id,
                access_token: tokenData.access_token,
                refresh_token: tokenData.refresh_token,
                expires_at: expiresAt,
                whoop_user_id: whoopUserId,
                updated_at: new Date().toISOString(),
            }, { onConflict: "user_id" });

        if (dbError) {
            console.error("Failed to store Whoop tokens:", dbError);
            return NextResponse.redirect(new URL(`/profile?whoop=error&reason=db_error&details=${encodeURIComponent(dbError.message)}`, req.url));
        }

        return NextResponse.redirect(new URL("/profile?whoop=connected", req.url));
    } catch (error) {
        console.error("Whoop callback error:", error);
        const errMessage = error instanceof Error ? error.message : "unknown";
        return NextResponse.redirect(new URL(`/profile?whoop=error&reason=catch_block&details=${encodeURIComponent(errMessage)}`, req.url));
    }
}

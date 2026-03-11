import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

/**
 * GET /api/whoop/auth
 * Redirects the user to Whoop's OAuth2 authorization page.
 */
export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const clientId = process.env.WHOOP_CLIENT_ID;
        if (!clientId) {
            return NextResponse.json({ error: "WHOOP_CLIENT_ID not configured" }, { status: 500 });
        }

        // Determine callback URL
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
        const redirectUri = `${appUrl}/api/whoop/callback`;

        // CSRF state token
        const state = crypto.randomUUID();
        const cookieStore = await cookies();
        cookieStore.set("whoop_oauth_state", state, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 600, // 10 minutes
            path: "/",
            sameSite: "lax",
        });

        const scopes = [
            "read:workout",
            "read:recovery",
            "read:sleep",
            "read:cycles",
            "read:profile",
            "read:body_measurement",
        ].join(" ");

        const authUrl = new URL("https://api.prod.whoop.com/oauth/oauth2/auth");
        authUrl.searchParams.set("client_id", clientId);
        authUrl.searchParams.set("redirect_uri", redirectUri);
        authUrl.searchParams.set("response_type", "code");
        authUrl.searchParams.set("scope", scopes);
        authUrl.searchParams.set("state", state);

        return NextResponse.redirect(authUrl.toString());
    } catch (error) {
        console.error("Whoop auth error:", error);
        return NextResponse.json({ error: "Failed to initiate Whoop auth" }, { status: 500 });
    }
}

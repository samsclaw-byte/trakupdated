"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const NutritionClient = dynamic(() => import("./NutritionClient"), { ssr: false });

export default function NutritionPage() {
    const router = useRouter();

    // Check for any pending squad invite redirect after login
    useEffect(() => {
        const pendingRedirect = localStorage.getItem('trak_auth_redirect');
        if (pendingRedirect) {
            localStorage.removeItem('trak_auth_redirect');
            console.log('[Auth] Redirecting to pending invite:', pendingRedirect);
            try {
                // If it's a full URL pasted maliciously or by buggy messaging apps, safely extract just path/query
                // e.g. "/squads?code=XYZ https://..." -> encode the URI or parse it
                const encodedUrl = encodeURI(pendingRedirect.trim());
                router.push(encodedUrl);
            } catch (err) {
                console.error('[Auth] Failed to parse pending redirect:', err);
            }
        }
    }, [router]);

    return <NutritionClient />;
}

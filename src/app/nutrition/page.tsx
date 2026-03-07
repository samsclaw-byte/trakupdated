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
            router.push(pendingRedirect);
        }
    }, [router]);

    return <NutritionClient />;
}

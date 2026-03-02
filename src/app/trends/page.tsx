"use client";

import dynamic from "next/dynamic";

// Load the trends page only on the client side — it uses Supabase auth
// which requires browser context and must not run during SSR/static export.
const TrendsClient = dynamic(() => import("./TrendsClient"), {
    ssr: false,
});

export default function TrendsPage() {
    return <TrendsClient />;
}

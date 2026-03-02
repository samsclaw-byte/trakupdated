"use client";

import dynamic from "next/dynamic";

// Load the dashboard only on the client side — it uses Supabase auth
// which requires browser context and must not run during SSR/static export.
const DashboardClient = dynamic(() => import("./DashboardClient"), {
    ssr: false,
});

export default function DashboardPage() {
    return <DashboardClient />;
}

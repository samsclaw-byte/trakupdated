import dynamic from "next/dynamic";

// Load the dashboard only on the client — it uses Supabase auth
// which requires browser context and cannot be server-side rendered.
const DashboardClient = dynamic(() => import("./DashboardClient"), {
    ssr: false,
    loading: () => (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background">
            <div className="w-16 h-16 border-t-2 border-brand-emerald rounded-full animate-spin" />
        </div>
    ),
});

export default function DashboardPage() {
    return <DashboardClient />;
}

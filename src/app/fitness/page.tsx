export const dynamic = "force-dynamic";

import FitnessClient from "./FitnessClient";

// Simple un-authenticated redirect handle should be at layout level but we can rely on supabase RLS for bad queries

export default function FitnessPage() {
    return <FitnessClient />;
}

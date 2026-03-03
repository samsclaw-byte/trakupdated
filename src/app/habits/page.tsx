"use client";

import dynamic from "next/dynamic";

const HabitsClient = dynamic(() => import("./HabitsClient"), { ssr: false });

export default function HabitsPage() {
    return <HabitsClient />;
}

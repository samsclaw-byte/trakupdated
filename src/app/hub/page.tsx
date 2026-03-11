"use client";

import dynamic from "next/dynamic";

const HubClient = dynamic(() => import("./HubClient"), {
    ssr: false,
});

export default function HubPage() {
    return <HubClient />;
}

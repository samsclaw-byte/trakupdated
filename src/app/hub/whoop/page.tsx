"use client";

import dynamic from "next/dynamic";

const WhoopHubClient = dynamic(() => import("./WhoopHubClient"), {
    ssr: false,
});

export default function WhoopHubPage() {
    return <WhoopHubClient />;
}

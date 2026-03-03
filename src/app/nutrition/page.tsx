"use client";

import dynamic from "next/dynamic";

const NutritionClient = dynamic(() => import("./NutritionClient"), { ssr: false });

export default function NutritionPage() {
    return <NutritionClient />;
}

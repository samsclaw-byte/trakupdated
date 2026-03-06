"use client";

import { useState } from "react";
import { TopBar } from "@/components/ui/TopBar";
import { BottomTabBar } from "@/components/ui/BottomTabBar";
import { SubViewToggle } from "@/components/ui/SubViewToggle";
import FitnessToday from "./FitnessToday";
import FitnessTrends from "./FitnessTrends";

export default function FitnessClient() {
    const [activeView, setActiveView] = useState<"today" | "trends">("today");

    return (
        <div className="min-h-screen bg-background text-foreground pb-24">
            <TopBar title="Fitness" showAvatar={true} />

            <div className="pt-24 px-6 max-w-md mx-auto">
                <SubViewToggle
                    activeView={activeView}
                    onViewChange={setActiveView}
                />

                <div className="mt-8">
                    {activeView === "today" ? <FitnessToday /> : <FitnessTrends />}
                </div>
            </div>

            <BottomTabBar />
        </div>
    );
}

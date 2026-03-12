"use client";

import { Logo } from "@/components/ui/logo";
import { User } from "lucide-react";
import { BottomTabBar } from "@/components/ui/BottomTabBar";
import { SubViewToggle } from "@/components/ui/SubViewToggle";
import Link from "next/link";
import FitnessToday from "./FitnessToday";
import FitnessTrends from "./FitnessTrends";

export default function FitnessClient() {
    return (
        <div className="flex flex-col min-h-screen bg-background pb-24">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-6 border-b border-white/5">
                <Logo className="text-xl" />
                <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Today</span>
                        <span className="text-sm font-semibold">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                    <Link
                        href="/profile"
                        className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center transition-all hover:bg-white/10 hover:text-brand-emerald active:scale-95"
                    >
                        <User className="w-4 h-4 text-muted-foreground" />
                    </Link>
                </div>
            </div>

            {/* Today / Trends Toggle + Content */}
            <SubViewToggle
                views={[
                    { key: "today", label: "Today", content: <FitnessToday /> },
                    { key: "trends", label: "Trends", content: <FitnessTrends /> },
                ]}
            />

            {/* Bottom Tab Bar */}
            <BottomTabBar />
        </div>
    );
}

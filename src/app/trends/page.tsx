"use client";

import { motion } from "framer-motion";
import { ChevronLeft, TrendingUp, Trophy, Zap, Footprints } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const values = [2100, 2450, 2200, 2600, 2300, 1900, 2100];
const maxValue = Math.max(...values);

export default function TrendsPage() {
    const [view, setView] = useState<"7d" | "28d">("7d");

    return (
        <div className="flex flex-col min-h-screen bg-background pb-12">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-6 border-b border-white/5">
                <Link href="/dashboard">
                    <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/5 active:scale-90 transition-transform">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                </Link>
                <span className="text-sm font-bold uppercase tracking-[0.2em]">Performance Insights</span>
                <div className="w-10" />
            </div>

            <div className="px-6 py-8 space-y-10">
                {/* Toggle */}
                <div className="flex p-1 bg-white/5 border border-white/5 rounded-2xl">
                    {(["7d", "28d"] as const).map((v) => (
                        <button
                            key={v}
                            onClick={() => setView(v)}
                            className={cn(
                                "flex-1 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all",
                                view === v ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white"
                            )}
                        >
                            {v === "7d" ? "7 Days" : "28 Days"}
                        </button>
                    ))}
                </div>

                {/* Main Chart Card */}
                <div className="p-8 bg-white/5 border border-white/5 rounded-[2.5rem] space-y-8">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <h3 className="text-2xl font-bold tracking-tight">2,235</h3>
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Avg Daily Calories</p>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-emerald/10 rounded-full">
                            <TrendingUp className="w-3 h-3 text-brand-emerald" />
                            <span className="text-[10px] font-bold text-brand-emerald">12% vs last week</span>
                        </div>
                    </div>

                    {/* Chart Visualization */}
                    <div className="flex items-end justify-between h-48 gap-2 pt-4">
                        {values.map((v, i) => (
                            <div key={i} className="relative flex-1 flex flex-col items-center group">
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${(v / maxValue) * 100}%` }}
                                    transition={{ duration: 1, delay: i * 0.1 }}
                                    className="w-full bg-white/5 rounded-lg group-hover:bg-brand-emerald/40 transition-colors relative"
                                >
                                    {/* Target Line Reference Mockup */}
                                    {i === 4 && <div className="absolute top-0 left-0 right-0 h-[2px] bg-brand-emerald opacity-50 -translate-y-8" />}
                                </motion.div>
                                <span className="text-[10px] uppercase tracking-tighter text-muted-foreground mt-4 font-bold">{days[i]}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 bg-white/5 border border-white/5 rounded-3xl space-y-4">
                        <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center">
                            <Trophy className="w-5 h-5 text-yellow-400" />
                        </div>
                        <div>
                            <h4 className="text-xl font-bold">14 Days</h4>
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Current Streak</p>
                        </div>
                    </div>
                    <div className="p-6 bg-white/5 border border-white/5 rounded-3xl space-y-4">
                        <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center">
                            <Footprints className="w-5 h-5 text-brand-emerald" />
                        </div>
                        <div>
                            <h4 className="text-xl font-bold">8.4k</h4>
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Avg Steps</p>
                        </div>
                    </div>
                </div>

                {/* Projection Card */}
                <div className="p-6 bg-emerald-gradient rounded-[2rem] text-brand-black">
                    <div className="flex items-start justify-between mb-8">
                        < Zap className="w-6 h-6 fill-current" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Projection</span>
                    </div>
                    <h3 className="text-2xl font-bold tracking-tight mb-2">Estimated Goal Hit</h3>
                    <p className="text-sm font-medium opacity-70 mb-8 leading-relaxed">
                        Based on your consistency over the last 7 days, you are on track to hit your weight target by <span className="underline decoration-black/20 decoration-2 underline-offset-4">March 24th.</span>
                    </p>
                    <button className="w-full py-4 bg-brand-black/10 border border-black/10 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-black/5 transition-all">
                        Refine Strategy
                    </button>
                </div>
            </div>
        </div>
    );
}

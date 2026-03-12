"use client";

import { motion } from "framer-motion";
import { Scale, HeartPulse, Check, Sparkles, ChevronRight, Sun } from "lucide-react";
import Link from "next/link";

export type HeroCardType = "daily_recap" | "log_weight" | "weekly_review" | "synced_whoop" | "all_caught_up";

interface HubHeroCardProps {
    type: HeroCardType;
    onAction?: () => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data?: any;
    userName?: string;
}

export function HubHeroCard({ type, onAction, data, userName = "there" }: HubHeroCardProps) {
    if (type === "log_weight") {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full rounded-3xl p-6 bg-gradient-to-br from-amber-500/10 to-amber-900/10 border border-amber-500/20 relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-[0.05]" />
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 blur-[50px] -translate-y-1/2 translate-x-1/2 rounded-full pointer-events-none" />

                <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-2 text-amber-500 mb-1">
                        <Scale className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Action Required</span>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-white leading-tight">
                            Good morning, {userName}.<br />Time to log today&apos;s weight.
                        </h2>
                        <p className="text-xs text-amber-500/70 mt-1 font-medium">Calibrate your daily macro targets.</p>
                    </div>
                    <button
                        onClick={onAction}
                        className="w-full py-3.5 bg-amber-500 text-amber-950 font-bold rounded-2xl flex items-center justify-center transition-transform active:scale-[0.98]"
                    >
                        Log Weight Now
                    </button>
                </div>
            </motion.div>
        );
    }

    if (type === "daily_recap") {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full rounded-3xl p-6 bg-gradient-to-br from-amber-500/10 via-brand-emerald/5 to-transparent border border-amber-500/20 relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-[0.05]" />
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/15 blur-[50px] -translate-y-1/2 translate-x-1/2 rounded-full pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-brand-emerald/15 blur-[40px] translate-y-1/2 -translate-x-1/2 rounded-full pointer-events-none" />

                <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-2 text-amber-400 mb-1">
                        <Sun className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Daily Recap</span>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-white leading-tight">
                            Your daily recap is ready.
                        </h2>
                        <p className="text-xs text-amber-400/70 mt-1 font-medium">Review yesterday &amp; unlock today.</p>
                    </div>
                    <button
                        onClick={onAction}
                        className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-brand-emerald text-brand-black font-bold rounded-2xl flex items-center justify-center transition-transform active:scale-[0.98]"
                    >
                        Start Recap
                    </button>
                </div>
            </motion.div>
        );
    }

    if (type === "weekly_review") {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full rounded-3xl p-6 bg-gradient-to-br from-brand-emerald/10 to-transparent border border-brand-emerald/30 relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-[0.05]" />
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-emerald/20 blur-[50px] -translate-y-1/2 translate-x-1/2 rounded-full pointer-events-none" />

                <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-2 text-brand-emerald mb-1">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Weekly Milestone</span>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold tracking-tight text-white leading-tight">
                            Week complete.<br />View your performance report.
                        </h2>
                    </div>
                    <button
                        onClick={onAction}
                        className="w-full py-3.5 bg-brand-emerald text-brand-black font-bold rounded-2xl flex items-center justify-center transition-transform active:scale-[0.98]"
                    >
                        Start Weekly Review
                    </button>
                </div>
            </motion.div>
        );
    }

    if (type === "synced_whoop") {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full rounded-3xl p-6 bg-gradient-to-br from-white/10 to-white/5 border border-white/20 relative overflow-hidden group"
            >
                <Link href="/hub/whoop" className="absolute inset-0 z-20" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-[0.05]" />
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-[50px] -translate-y-1/2 translate-x-1/2 rounded-full pointer-events-none" />

                <div className="relative z-10 flex items-center justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-foreground/70 mb-2">
                            <HeartPulse className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">New Data Synced</span>
                        </div>
                        <h2 className="text-lg font-bold tracking-tight text-white">
                            Whoop Recovery: {data?.recovery_score || "..."}%
                        </h2>
                        <p className="text-xs text-muted-foreground font-medium">Strain: {data?.strain || "..."} • Sleep: {data?.sleep_performance || "..."}%</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                        <ChevronRight className="w-5 h-5 text-white" />
                    </div>
                </div>
            </motion.div>
        );
    }

    // Default "all_caught_up"
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full rounded-3xl p-6 bg-white/5 border border-white/5 relative overflow-hidden"
        >
            <div className="relative z-10 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-brand-emerald/20 flex items-center justify-center shrink-0">
                    <Check className="w-6 h-6 text-brand-emerald" />
                </div>
                <div>
                    <h2 className="text-lg font-bold tracking-tight text-white">
                        You&apos;re all caught up, {userName}.
                    </h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Let&apos;s dominate the day.</p>
                </div>
            </div>
        </motion.div>
    );
}

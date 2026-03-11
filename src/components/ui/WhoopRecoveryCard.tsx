"use client";

import { motion } from "framer-motion";
import { Heart, Activity, Moon, Zap } from "lucide-react";

interface WhoopRecoveryCardProps {
    recoveryScore: number | null;
    hrv: number | null;
    restingHR: number | null;
    sleepPerformance: number | null;
    strain: number | null;
}

function getRecoveryColor(score: number): string {
    if (score >= 67) return "text-green-400";
    if (score >= 34) return "text-yellow-400";
    return "text-red-400";
}

function getRecoveryBg(score: number): string {
    if (score >= 67) return "bg-green-500/10 border-green-500/20";
    if (score >= 34) return "bg-yellow-500/10 border-yellow-500/20";
    return "bg-red-500/10 border-red-500/20";
}

function getRecoveryGlow(score: number): string {
    if (score >= 67) return "shadow-[0_0_20px_rgba(34,197,94,0.15)]";
    if (score >= 34) return "shadow-[0_0_20px_rgba(234,179,8,0.15)]";
    return "shadow-[0_0_20px_rgba(239,68,68,0.15)]";
}

export function WhoopRecoveryCard({
    recoveryScore,
    hrv,
    restingHR,
    sleepPerformance,
    strain,
}: WhoopRecoveryCardProps) {
    if (recoveryScore === null) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-3xl border p-5 ${getRecoveryBg(recoveryScore)} ${getRecoveryGlow(recoveryScore)}`}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center">
                        <Activity className="w-3.5 h-3.5 text-brand-emerald" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                        Whoop Recovery
                    </span>
                </div>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-emerald animate-pulse" />
                    <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">
                        Synced
                    </span>
                </div>
            </div>

            {/* Score */}
            <div className="text-center mb-4">
                <p className={`text-5xl font-black tracking-tighter ${getRecoveryColor(recoveryScore)}`}>
                    {recoveryScore}
                    <span className="text-xl opacity-60">%</span>
                </p>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">
                    {recoveryScore >= 67 ? "Peak Recovery" : recoveryScore >= 34 ? "Moderate Recovery" : "Low Recovery"}
                </p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-4 gap-2">
                {hrv !== null && (
                    <div className="bg-white/5 rounded-xl p-2.5 text-center border border-white/5">
                        <Heart className="w-3.5 h-3.5 text-red-400 mx-auto mb-1" />
                        <p className="text-sm font-bold">{Math.round(hrv)}</p>
                        <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest">HRV</p>
                    </div>
                )}
                {restingHR !== null && (
                    <div className="bg-white/5 rounded-xl p-2.5 text-center border border-white/5">
                        <Heart className="w-3.5 h-3.5 text-pink-400 mx-auto mb-1" />
                        <p className="text-sm font-bold">{Math.round(restingHR)}</p>
                        <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest">RHR</p>
                    </div>
                )}
                {sleepPerformance !== null && (
                    <div className="bg-white/5 rounded-xl p-2.5 text-center border border-white/5">
                        <Moon className="w-3.5 h-3.5 text-blue-400 mx-auto mb-1" />
                        <p className="text-sm font-bold">{sleepPerformance}%</p>
                        <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest">Sleep</p>
                    </div>
                )}
                {strain !== null && (
                    <div className="bg-white/5 rounded-xl p-2.5 text-center border border-white/5">
                        <Zap className="w-3.5 h-3.5 text-amber-400 mx-auto mb-1" />
                        <p className="text-sm font-bold">{strain.toFixed(1)}</p>
                        <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest">Strain</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

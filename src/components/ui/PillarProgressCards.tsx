"use client";

import { motion } from "framer-motion";
import { Leaf, Check, Dumbbell, ChevronRight } from "lucide-react";
import { STREAK_MILESTONES, getBestBadge, getNextMilestone, BADGE_CONFIG } from "@/utils/streaks";

interface PillarProgressCardsProps {
    nutritionStreak: number;
    habitsStreak: number;
    fitnessStreak: number;
}

const PILLARS = [
    { key: "nutrition", label: "Nutrition", icon: Leaf, colorClass: "text-emerald-400", bgClass: "bg-emerald-400/10", borderClass: "border-emerald-400/20" },
    { key: "habits", label: "Habits", icon: Check, colorClass: "text-purple-400", bgClass: "bg-purple-400/10", borderClass: "border-purple-400/20" },
    { key: "fitness", label: "Fitness", icon: Dumbbell, colorClass: "text-blue-400", bgClass: "bg-blue-400/10", borderClass: "border-blue-400/20" },
];

export function PillarProgressCards({ nutritionStreak, habitsStreak, fitnessStreak }: PillarProgressCardsProps) {
    const streaks: Record<string, number> = {
        nutrition: nutritionStreak,
        habits: habitsStreak,
        fitness: fitnessStreak,
    };

    return (
        <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60">Pillar Streaks</h3>
            {PILLARS.map((pillar, idx) => {
                const streak = streaks[pillar.key];
                const badge = getBestBadge(streak);
                const nextMilestone = getNextMilestone(streak);
                const Icon = pillar.icon;

                // Progress toward next milestone
                const prevMilestone = [...STREAK_MILESTONES].reverse().find(m => m <= streak) || 0;
                const progressPct = nextMilestone
                    ? ((streak - prevMilestone) / (nextMilestone - prevMilestone)) * 100
                    : 100;

                return (
                    <motion.div
                        key={pillar.key}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={`p-4 bg-white/[0.04] rounded-2xl border ${pillar.borderClass} flex items-center gap-4`}
                    >
                        {/* Icon */}
                        <div className={`w-11 h-11 rounded-xl ${pillar.bgClass} flex items-center justify-center shrink-0`}>
                            <Icon className={`w-5 h-5 ${pillar.colorClass}`} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-white">{pillar.label}</span>
                                    {badge && (
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${BADGE_CONFIG[badge.milestone].colorClass}`}>
                                            {pillar.key === 'nutrition' ? badge.emoji : (pillar.key === 'habits' ? (badge.milestone >= 5 ? '🔥' : '✅') : (badge.milestone >= 5 ? '⚡' : '💪'))} {badge.label}
                                        </span>
                                    )}
                                </div>
                                <span className="text-xs font-bold text-white/60">{streak}d</span>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(progressPct, 100)}%` }}
                                    transition={{ duration: 1, ease: "easeOut", delay: 0.3 + idx * 0.1 }}
                                    className={`h-full rounded-full ${pillar.bgClass.replace('/10', '')}`}
                                    style={{ backgroundColor: pillar.key === 'nutrition' ? '#34d399' : pillar.key === 'habits' ? '#c084fc' : '#60a5fa' }}
                                />
                            </div>

                            {/* Next milestone label */}
                            {nextMilestone ? (
                                <div className="flex items-center gap-1 mt-1.5">
                                    <ChevronRight className="w-3 h-3 text-white/20" />
                                    {streak} / {nextMilestone} to {pillar.key === 'nutrition' ? BADGE_CONFIG[nextMilestone].emoji : (pillar.key === 'habits' ? (nextMilestone >= 5 ? '🔥' : '✅') : (nextMilestone >= 5 ? '⚡' : '💪'))} {BADGE_CONFIG[nextMilestone].label}
                                </div>
                            ) : (
                                <p className="text-[10px] text-white/30 mt-1.5">Max tier reached! Keep going.</p>
                            )}
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}

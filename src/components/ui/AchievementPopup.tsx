"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { getQuadrant } from "./ProfileBadgeCard";

const TIER_LEGEND = [
    { min: 3, emoji: "🌱", label: "Getting Started" },
    { min: 5, emoji: "🔥", label: "Momentum" },
    { min: 10, emoji: "⚡", label: "Double Digits" },
    { min: 21, emoji: "💪", label: "Habit Formed" },
    { min: 30, emoji: "🎯", label: "Monthly Master" },
    { min: 50, emoji: "💎", label: "Elite" },
    { min: 100, emoji: "👑", label: "Legendary" },
];

const PILLAR_COLORS: Record<string, { label: string; barColor: string; textColor: string; bgColor: string }> = {
    nutrition: { label: "Nutrition", barColor: "bg-emerald-500", textColor: "text-emerald-400", bgColor: "bg-emerald-500/10" },
    fitness: { label: "Fitness", barColor: "bg-blue-500", textColor: "text-blue-400", bgColor: "bg-blue-500/10" },
    habits: { label: "Habits", barColor: "bg-purple-500", textColor: "text-purple-400", bgColor: "bg-purple-500/10" },
};

interface AchievementPopupProps {
    name: string;
    pillars: { pillar: string; current: number; best: number }[];
    onClose: () => void;
}

export function AchievementPopup({ name, pillars, onClose }: AchievementPopupProps) {
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[90] flex items-center justify-center p-6"
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-card w-full max-w-sm rounded-3xl p-6 border border-white/10 shadow-2xl"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold">{name}&apos;s Achievements</h3>
                        <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Pillar Sections */}
                    <div className="space-y-5 mb-6">
                        {pillars.map(({ pillar, current, best }) => {
                            const colors = PILLAR_COLORS[pillar];
                            if (!colors) return null;
                            const q = getQuadrant(pillar, best);
                            const Icon = q.icon;
                            const progress = best > 0 ? Math.min((current / best) * 100, 100) : 0;
                            const isRecord = current >= best && current > 0;

                            return (
                                <div key={pillar} className={`p-4 rounded-2xl ${colors.bgColor} border border-white/5`}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Icon className={`w-4 h-4 ${colors.textColor}`} />
                                        <span className={`text-sm font-bold ${colors.textColor}`}>{colors.label}</span>
                                        {isRecord && (
                                            <span className="text-[9px] font-black uppercase tracking-widest text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                                                At Record
                                            </span>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground mb-3">
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wider font-bold mb-0.5">Current</p>
                                            <p className="text-white font-bold text-lg">{current} <span className="text-xs text-muted-foreground font-normal">days</span></p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wider font-bold mb-0.5">Best Ever</p>
                                            <p className="text-white font-bold text-lg">{best} <span className="text-xs text-muted-foreground font-normal">days</span></p>
                                        </div>
                                    </div>
                                    {/* Progress bar */}
                                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            transition={{ duration: 0.8, ease: "easeOut" }}
                                            className={`h-full rounded-full ${colors.barColor}`}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Badge Tier Legend */}
                    <div className="border-t border-white/5 pt-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3">Badge Tiers</p>
                        <div className="grid grid-cols-4 gap-2">
                            {TIER_LEGEND.map(tier => (
                                <div key={tier.min} className="flex flex-col items-center text-center gap-0.5">
                                    <span className="text-lg">{tier.emoji}</span>
                                    <span className="text-[9px] text-muted-foreground font-bold">{tier.min}+ days</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

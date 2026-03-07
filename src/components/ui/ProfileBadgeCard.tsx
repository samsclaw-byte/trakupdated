/* eslint-disable */
"use client";

import { motion } from "framer-motion";
import { Crown, Lock, Leaf, Apple, UtensilsCrossed, Trophy, Gem, Check, Star, Sparkles, Flame, Zap, Dumbbell, Award } from "lucide-react";
import { useState } from "react";
import { AchievementPopup } from "./AchievementPopup";

/* ── Overall card theme based on minimum cross-pillar streak ── */
export interface BadgeTheme {
    borderClass: string;
    glowClass: string;
    initialsClass: string;
    numberClass: string;
    sinceClass: string;
}

const THEMES: { min: number; theme: BadgeTheme }[] = [
    { min: 100, theme: { borderClass: "border-amber-400/40", glowClass: "shadow-[0_0_30px_rgba(251,191,36,0.12)]", initialsClass: "bg-gradient-to-br from-amber-300 to-amber-500", numberClass: "text-amber-300/90", sinceClass: "text-amber-400/60" } },
    { min: 50, theme: { borderClass: "border-amber-400/25", glowClass: "shadow-[0_0_20px_rgba(251,191,36,0.08)]", initialsClass: "bg-gradient-to-br from-amber-200 to-amber-400", numberClass: "text-amber-200/80", sinceClass: "text-amber-300/50" } },
    { min: 30, theme: { borderClass: "border-emerald-400/30", glowClass: "shadow-[0_0_20px_rgba(52,211,153,0.1)]", initialsClass: "bg-gradient-to-br from-white to-emerald-200", numberClass: "text-white/80", sinceClass: "text-muted-foreground" } },
    { min: 21, theme: { borderClass: "border-purple-400/25", glowClass: "shadow-[0_0_15px_rgba(168,85,247,0.08)]", initialsClass: "bg-gradient-to-br from-white to-purple-100", numberClass: "text-white/80", sinceClass: "text-muted-foreground" } },
    { min: 10, theme: { borderClass: "border-blue-400/25", glowClass: "shadow-[0_0_12px_rgba(96,165,250,0.08)]", initialsClass: "bg-gradient-to-br from-white to-blue-100", numberClass: "text-white/80", sinceClass: "text-muted-foreground" } },
    { min: 5, theme: { borderClass: "border-orange-400/20", glowClass: "shadow-[0_0_10px_rgba(251,146,60,0.06)]", initialsClass: "bg-gradient-to-br from-white to-white/50", numberClass: "text-white/80", sinceClass: "text-muted-foreground" } },
    { min: 3, theme: { borderClass: "border-emerald-500/15", glowClass: "", initialsClass: "bg-gradient-to-br from-white to-white/50", numberClass: "text-white/80", sinceClass: "text-muted-foreground" } },
    { min: 0, theme: { borderClass: "border-white/10", glowClass: "", initialsClass: "bg-gradient-to-br from-white to-white/50", numberClass: "text-white/80", sinceClass: "text-muted-foreground" } },
];

function getTheme(overallStreak: number): BadgeTheme {
    for (const t of THEMES) {
        if (overallStreak >= t.min) return t.theme;
    }
    return THEMES[THEMES.length - 1].theme;
}

/* ── Quadrant icon configuration ── */
interface QuadrantConfig {
    icon: React.ElementType;
    colorClass: string;
    glowColor: string;
}

const QUADRANT_ICONS: Record<string, { thresholds: { min: number; config: QuadrantConfig }[] }> = {
    nutrition: {
        thresholds: [
            { min: 100, config: { icon: Trophy, colorClass: "text-emerald-300", glowColor: "rgba(52,211,153,0.3)" } },
            { min: 50, config: { icon: Gem, colorClass: "text-emerald-400", glowColor: "rgba(52,211,153,0.2)" } },
            { min: 30, config: { icon: UtensilsCrossed, colorClass: "text-emerald-400", glowColor: "rgba(52,211,153,0.15)" } },
            { min: 21, config: { icon: Apple, colorClass: "text-emerald-400", glowColor: "rgba(52,211,153,0.12)" } },
            { min: 10, config: { icon: Apple, colorClass: "text-emerald-500", glowColor: "rgba(52,211,153,0.1)" } },
            { min: 5, config: { icon: Leaf, colorClass: "text-emerald-500/80", glowColor: "rgba(52,211,153,0.06)" } },
            { min: 3, config: { icon: Leaf, colorClass: "text-emerald-600/60", glowColor: "" } },
            { min: 0, config: { icon: Leaf, colorClass: "text-white/15", glowColor: "" } },
        ],
    },
    habits: {
        thresholds: [
            { min: 100, config: { icon: Award, colorClass: "text-purple-300", glowColor: "rgba(168,85,247,0.3)" } },
            { min: 50, config: { icon: Gem, colorClass: "text-purple-400", glowColor: "rgba(168,85,247,0.2)" } },
            { min: 30, config: { icon: Sparkles, colorClass: "text-purple-400", glowColor: "rgba(168,85,247,0.15)" } },
            { min: 21, config: { icon: Star, colorClass: "text-purple-400", glowColor: "rgba(168,85,247,0.12)" } },
            { min: 10, config: { icon: Star, colorClass: "text-purple-500", glowColor: "rgba(168,85,247,0.1)" } },
            { min: 5, config: { icon: Check, colorClass: "text-purple-500/80", glowColor: "rgba(168,85,247,0.06)" } },
            { min: 3, config: { icon: Check, colorClass: "text-purple-600/60", glowColor: "" } },
            { min: 0, config: { icon: Check, colorClass: "text-white/15", glowColor: "" } },
        ],
    },
    fitness: {
        thresholds: [
            { min: 100, config: { icon: Trophy, colorClass: "text-blue-300", glowColor: "rgba(96,165,250,0.3)" } },
            { min: 50, config: { icon: Gem, colorClass: "text-blue-400", glowColor: "rgba(96,165,250,0.2)" } },
            { min: 30, config: { icon: Award, colorClass: "text-blue-400", glowColor: "rgba(96,165,250,0.15)" } },
            { min: 21, config: { icon: Zap, colorClass: "text-blue-400", glowColor: "rgba(96,165,250,0.12)" } },
            { min: 10, config: { icon: Zap, colorClass: "text-blue-500", glowColor: "rgba(96,165,250,0.1)" } },
            { min: 5, config: { icon: Flame, colorClass: "text-blue-500/80", glowColor: "rgba(96,165,250,0.06)" } },
            { min: 3, config: { icon: Flame, colorClass: "text-blue-600/60", glowColor: "" } },
            { min: 0, config: { icon: Dumbbell, colorClass: "text-white/15", glowColor: "" } },
        ],
    },
};

export function getQuadrant(pillar: string, streak: number): QuadrantConfig {
    const config = QUADRANT_ICONS[pillar];
    if (!config) return { icon: Lock, colorClass: "text-white/15", glowColor: "" };
    for (const t of config.thresholds) {
        if (streak >= t.min) return t.config;
    }
    return config.thresholds[config.thresholds.length - 1].config;
}

/* ── Component ── */
export interface ProfileBadgeCardProps {
    initials: string;
    sinceDate: string;
    memberNumber: string;
    isTrakPlus: boolean;
    nutritionStreak: number;  // best ever
    habitsStreak: number;     // best ever
    fitnessStreak: number;    // best ever
    currentNutritionStreak?: number;
    currentHabitsStreak?: number;
    currentFitnessStreak?: number;
    tappable?: boolean;
    name?: string;
}

export function ProfileBadgeCard({
    initials, sinceDate, memberNumber, isTrakPlus,
    nutritionStreak, habitsStreak, fitnessStreak,
    currentNutritionStreak, currentHabitsStreak, currentFitnessStreak,
    tappable = false, name,
}: ProfileBadgeCardProps) {
    const [showPopup, setShowPopup] = useState(false);
    const overallStreak = Math.min(nutritionStreak, habitsStreak, fitnessStreak);
    const theme = getTheme(overallStreak);

    const quadrants = [
        { pillar: "nutrition", best: nutritionStreak, current: currentNutritionStreak ?? nutritionStreak, pos: "top-3 left-3" },
        { pillar: "habits", best: habitsStreak, current: currentHabitsStreak ?? habitsStreak, pos: "top-3 right-3" },
        { pillar: "fitness", best: fitnessStreak, current: currentFitnessStreak ?? fitnessStreak, pos: "bottom-3 left-3" },
    ];

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={tappable ? () => setShowPopup(!showPopup) : undefined}
                className={`relative w-full max-w-sm h-32 bg-white/[0.04] rounded-3xl border overflow-hidden ${theme.borderClass} ${theme.glowClass} ${tappable ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''}`}
            >
                {/* Glass shine */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.03] to-transparent pointer-events-none" />

                {/* Quadrant icons with current/best */}
                {quadrants.map(({ pillar, best, current, pos }) => {
                    const q = getQuadrant(pillar, best);
                    const Icon = q.icon;
                    return (
                        <div
                            key={pillar}
                            className={`absolute ${pos} flex items-center gap-1`}
                            title={`${pillar}: ${current}/${best}`}
                            style={q.glowColor ? { filter: `drop-shadow(0 0 4px ${q.glowColor})` } : undefined}
                        >
                            <Icon className={`w-3.5 h-3.5 ${q.colorClass}`} />
                            {best > 0 && (
                                <span className={`text-[9px] font-bold ${q.colorClass}`}>
                                    {current}/{best}
                                </span>
                            )}
                        </div>
                    );
                })}

                {/* Future quadrant — locked */}
                <div className="absolute bottom-3 right-3 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-white/10" />
                    <motion.div
                        animate={{ opacity: [0.1, 0.25, 0.1] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="w-1.5 h-1.5 rounded-full bg-white/20"
                    />
                </div>

                {/* Centre content */}
                <div className="absolute inset-0 flex items-center justify-between px-8">
                    <div className="space-y-1">
                        <h2 className={`text-4xl font-black tracking-tighter bg-clip-text text-transparent ${theme.initialsClass}`}>
                            {initials}
                        </h2>
                        <p className={`text-[10px] uppercase tracking-widest font-bold ${theme.sinceClass}`}>
                            Since {sinceDate}
                        </p>
                    </div>
                    <div className="text-right">
                        {isTrakPlus ? (
                            <div className="flex items-center gap-1 mb-1 text-brand-emerald">
                                <Crown className="w-3 h-3 fill-current" />
                                <p className="text-[10px] uppercase tracking-widest font-bold">Trak+ Pro</p>
                            </div>
                        ) : (
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Trak Free</p>
                        )}
                        <p className={`text-2xl font-serif italic tracking-widest ${theme.numberClass}`}>
                            No. {memberNumber}
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Achievement Popup */}
            {tappable && showPopup && (
                <AchievementPopup
                    name={name || initials}
                    pillars={quadrants.map(q => ({ pillar: q.pillar, current: q.current, best: q.best }))}
                    onClose={() => setShowPopup(false)}
                />
            )}
        </>
    );
}

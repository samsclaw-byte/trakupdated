"use client";

import { getBestBadge } from "@/utils/streaks";

interface StreakBadgeProps {
    bestStreak: number;
    className?: string;
}

export function StreakBadge({ bestStreak, className = "" }: StreakBadgeProps) {
    const badge = getBestBadge(bestStreak);
    if (!badge) return null;

    return (
        <span
            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full border text-[10px] font-bold ${badge.colorClass} ${className}`}
            title={`${badge.label} — ${bestStreak} day best streak`}
        >
            {badge.emoji}{badge.milestone}
        </span>
    );
}

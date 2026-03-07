/* eslint-disable */
"use client";

import { motion } from "framer-motion";
import { User, Target, Flame, Dumbbell, CheckCircle2, Trophy, Sparkles } from "lucide-react";
import { EmojiReactionBar } from "./EmojiReactionBar";

export interface FeedItem {
    id: string;
    event_type: 'perfect_day' | 'calorie_target_hit' | 'streak_3' | 'streak_5' | 'streak_10' | 'streak_21' | 'streak_30' | 'streak_50' | 'streak_100' | 'joined' | 'habit_completed' | 'workout_completed' | 'trifecta';
    metadata: Record<string, unknown>;
    created_at: string;
    users: {
        id: string;
        name: string;
    };
    squad_reactions: {
        id: string;
        emoji: string;
        user_id: string;
    }[];
}

interface FeedCardProps {
    item: FeedItem;
    currentUserId: string;
}

// Visual tier system
type CardTier = 'standard' | 'notable' | 'milestone';

function getCardTier(eventType: string): CardTier {
    if (eventType.startsWith('streak_')) return 'milestone';
    if (['perfect_day', 'calorie_target_hit', 'workout_completed', 'trifecta'].includes(eventType)) return 'notable';
    return 'standard';
}

const MILESTONE_THRESHOLDS: Record<string, { emoji: string; label: string }> = {
    '3': { emoji: '🌱', label: 'Getting Started' },
    '5': { emoji: '🔥', label: 'Momentum' },
    '10': { emoji: '⚡', label: 'Double Digits' },
    '21': { emoji: '💪', label: 'Habit Formed' },
    '30': { emoji: '🎯', label: 'Monthly Master' },
    '50': { emoji: '💎', label: 'Elite' },
    '100': { emoji: '👑', label: 'Legendary' },
};

export function FeedCard({ item, currentUserId }: FeedCardProps) {
    let narrative = "";
    let icon = <User className="w-5 h-5 text-muted-foreground" />;
    let ringColor = "border-white/10";
    const tier = getCardTier(item.event_type);

    // Milestone-specific data
    let milestoneEmoji = "";
    let milestoneLabel = "";
    let milestoneDays = "";
    let currentStreak: number | null = null;
    let bestStreak: number | null = null;

    switch (item.event_type) {
        case 'perfect_day':
            narrative = `crushed a Perfect Habit Day!`;
            icon = <Trophy className="w-5 h-5 text-amber-500" />;
            ringColor = "border-amber-500/50";
            break;
        case 'calorie_target_hit':
            narrative = `hit their Calorie Target perfectly.`;
            icon = <Target className="w-5 h-5 text-emerald-400" />;
            ringColor = "border-emerald-500/30";
            break;
        case 'trifecta':
            narrative = `achieved the Trifecta! All 3 pillars hit.`;
            icon = <Sparkles className="w-5 h-5 text-amber-400" />;
            ringColor = "border-amber-500/50";
            break;
        case 'habit_completed':
            narrative = `checked off a habit.`;
            icon = <CheckCircle2 className="w-5 h-5 text-purple-400" />;
            ringColor = "border-purple-500/30";
            break;
        case 'workout_completed': {
            const act = item.metadata?.activity || "Workout";
            const cals = item.metadata?.calories ? ` · ${item.metadata.calories} kcal` : "";
            narrative = `logged a ${act}${cals}`;
            icon = <Dumbbell className="w-5 h-5 text-blue-400" />;
            ringColor = "border-blue-500/30";
            break;
        }
        case 'streak_3':
        case 'streak_5':
        case 'streak_10':
        case 'streak_21':
        case 'streak_30':
        case 'streak_50':
        case 'streak_100': {
            milestoneDays = item.event_type.split('_')[1];
            const habitN = item.metadata?.habit_name ? ` (${item.metadata.habit_name})` : "";
            const threshold = MILESTONE_THRESHOLDS[milestoneDays];
            milestoneEmoji = threshold?.emoji || '🔥';
            milestoneLabel = threshold?.label || 'Streak';
            narrative = `hit a ${milestoneDays}-day streak${habitN}`;
            icon = <Flame className="w-5 h-5 text-amber-400" />;
            ringColor = "border-amber-500/50";
            currentStreak = item.metadata?.current_streak as number || parseInt(milestoneDays);
            bestStreak = item.metadata?.best_streak as number || parseInt(milestoneDays);
            break;
        }
        case 'joined':
            narrative = `joined the squad.`;
            icon = <User className="w-5 h-5 text-white/50" />;
            break;
        default:
            narrative = `completed an action.`;
    }

    const timeAgo = new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isNewRecord = currentStreak !== null && bestStreak !== null && currentStreak >= bestStreak && bestStreak > 0;

    // Milestone cards get a special full-width treatment
    if (tier === 'milestone') {
        return (
            <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="w-full bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-transparent border border-amber-500/20 rounded-2xl p-5 mb-2 shadow-[0_0_20px_rgba(245,158,11,0.08)]"
            >
                {/* Milestone badge */}
                <div className="flex items-center gap-2 mb-3">
                    <div className="px-2.5 py-1 bg-amber-500/15 border border-amber-500/20 rounded-full flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Milestone</span>
                    </div>
                    {isNewRecord && (
                        <div className="px-2.5 py-1 bg-red-500/15 border border-red-500/20 rounded-full">
                            <span className="text-[10px] font-black uppercase tracking-widest text-red-400">🆕 New Record</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3.5 mb-3">
                    <div className={`w-11 h-11 rounded-full bg-black/50 border flex items-center justify-center shrink-0 ${ringColor}`}>
                        {icon}
                    </div>
                    <div>
                        <p className="font-bold text-white/90 leading-snug">
                            {item.users?.name || 'A squad member'} <span className="text-muted-foreground font-normal">{narrative}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{timeAgo}</p>
                    </div>
                </div>

                {/* Large milestone display */}
                <div className="flex items-center justify-center gap-6 py-3 mb-2 bg-black/20 rounded-xl">
                    <span className="text-4xl">{milestoneEmoji}</span>
                    <div className="text-center">
                        <p className="text-2xl font-black text-white">{milestoneDays} Days</p>
                        <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">{milestoneLabel}</p>
                    </div>
                    {currentStreak !== null && bestStreak !== null && (
                        <div className="text-right text-xs text-muted-foreground space-y-0.5">
                            <p>Current: <span className="text-white font-bold">{currentStreak}</span></p>
                            <p>Best: <span className="text-white font-bold">{bestStreak}</span></p>
                        </div>
                    )}
                </div>

                <EmojiReactionBar
                    feedId={item.id}
                    initialReactions={item.squad_reactions || []}
                    currentUserId={currentUserId}
                />
            </motion.div>
        );
    }

    // Standard and Notable cards
    const glowColor = tier === 'notable' ? 'shadow-sm' : '';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`w-full bg-white/[0.02] border border-white/5 rounded-2xl p-5 mb-2 shadow-sm backdrop-blur-sm ${glowColor}`}
        >
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3.5 mb-2">
                    <div className={`w-11 h-11 rounded-full bg-black/50 border flex items-center justify-center shrink-0 ${ringColor}`}>
                        {icon}
                    </div>
                    <div>
                        <p className="font-semibold text-white/90 leading-snug">
                            {item.users?.name || 'A squad member'} <span className="text-muted-foreground font-normal">{narrative}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{timeAgo}</p>
                    </div>
                </div>
            </div>

            <EmojiReactionBar
                feedId={item.id}
                initialReactions={item.squad_reactions || []}
                currentUserId={currentUserId}
            />
        </motion.div>
    );
}

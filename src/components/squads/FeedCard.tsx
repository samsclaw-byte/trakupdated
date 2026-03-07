"use client";

import { motion } from "framer-motion";
import { User, Target, Flame, Dumbbell, Leaf, CheckCircle2, Trophy } from "lucide-react";
import { EmojiReactionBar } from "./EmojiReactionBar";

export interface FeedItem {
    id: string;
    event_type: 'perfect_day' | 'calorie_target_hit' | 'streak_3' | 'streak_5' | 'streak_10' | 'streak_21' | 'streak_30' | 'streak_50' | 'streak_100' | 'joined' | 'habit_completed' | 'workout_completed';
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

export function FeedCard({ item, currentUserId }: FeedCardProps) {
    let narrative = "";
    let icon = <User className="w-5 h-5 text-muted-foreground" />;
    let ringColor = "border-white/10";
    let glowColor = "";

    switch (item.event_type) {
        case 'perfect_day':
            narrative = `crushed a Perfect Habit Day! 🔥`;
            icon = <Trophy className="w-5 h-5 text-amber-500" />;
            ringColor = "border-amber-500/50";
            glowColor = "shadow-[0_0_15px_rgba(245,158,11,0.2)]";
            break;
        case 'calorie_target_hit':
            narrative = `hit their Calorie Target perfectly.`;
            icon = <Target className="w-5 h-5 text-emerald-400" />;
            ringColor = "border-emerald-500/30";
            break;
        case 'habit_completed':
            narrative = `checked off a habit.`;
            icon = <CheckCircle2 className="w-5 h-5 text-purple-400" />;
            ringColor = "border-purple-500/30";
            break;
        case 'workout_completed': {
            const act = item.metadata?.activity || "Workout";
            const cals = item.metadata?.calories ? ` · ${item.metadata.calories} kcal` : "";
            narrative = `logged a ${act}${cals} 💪`;
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
            const days = item.event_type.split('_')[1];
            const habitN = item.metadata?.habit_name ? ` (${item.metadata.habit_name})` : "";
            const milestoneEmojis: Record<string, string> = { '5': '🔥', '10': '⚡', '21': '💪', '30': '🎯', '50': '💎', '100': '👑' };
            narrative = `hit a ${days}-day streak${habitN} ${milestoneEmojis[days] || '🔥'}`;
            icon = <Flame className="w-5 h-5 text-amber-400" />;
            ringColor = "border-amber-500/50";
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

"use client";

import { motion } from "framer-motion";
import { User, Target, Flame } from "lucide-react";
import { EmojiReactionBar } from "./EmojiReactionBar";

export interface FeedItem {
    id: string;
    event_type: 'perfect_day' | 'calorie_target_hit' | 'streak_5' | 'joined' | 'habit_completed';
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

    switch (item.event_type) {
        case 'perfect_day':
            narrative = `crushed a Perfect Habit Day!`;
            icon = <Flame className="w-5 h-5 text-orange-500" />;
            break;
        case 'calorie_target_hit':
            narrative = `hit their Daily Engine Calorie Target.`;
            icon = <Target className="w-5 h-5 text-brand-emerald" />;
            break;
        case 'streak_5':
            narrative = `hit a 5-day tracking streak!`;
            icon = <Flame className="w-5 h-5 text-brand-emerald" />;
            break;
        case 'joined':
            narrative = `joined the squad.`;
            break;
        case 'habit_completed':
            const habitName = item.metadata?.habit_name || "a habit";
            narrative = `completed: ${habitName}`;
            icon = <Target className="w-5 h-5 text-blue-400" />;
            break;
        default:
            narrative = `completed an action.`;
    }

    const timeAgo = new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 mb-4 shadow-sm"
        >
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-black/50 border border-white/10 flex items-center justify-center">
                        {icon}
                    </div>
                    <div>
                        <p className="font-semibold text-white">
                            {item.users.name} <span className="text-muted-foreground font-normal">{narrative}</span>
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

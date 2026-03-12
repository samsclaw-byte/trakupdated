"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { Flame, X, ChevronRight } from "lucide-react";

// Event type → readable label
const EVENT_LABELS: Record<string, string> = {
    workout_completed: "Workout completed",
    calorie_target_hit: "Hit calorie target",
    habit_completed: "Habit completed",
    perfect_day: "Perfect day",
    streak_3: "3-day streak",
    streak_5: "5-day streak",
    streak_10: "10-day streak",
    streak_21: "21-day streak",
    streak_30: "30-day streak",
    joined: "Joined the squad",
};

interface ReactionItem {
    id: string;
    emoji: string;
    user_id: string;
    created_at: string;
    reactor_name: string;
    event_type: string;
    event_metadata: Record<string, unknown>;
}

const LS_KEY = "trak_squad_pulse_last_seen";

export function SquadPulse() {
    const [reactions, setReactions] = useState<ReactionItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    const fetchReactions = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Find all squad_feed items belonging to this user, then get reactions on those items
            // that were NOT made by the user themselves
            const { data: feedItems } = await supabase
                .from("squad_feed")
                .select(`
                    id,
                    event_type,
                    metadata,
                    created_at,
                    squad_reactions (
                        id,
                        emoji,
                        user_id,
                        created_at,
                        users ( name )
                    )
                `)
                .eq("user_id", user.id)
                .order("created_at", { ascending: false })
                .limit(50);

            if (!feedItems) return;

            // Flatten reactions from all feed items
            const allReactions: ReactionItem[] = [];
            for (const item of feedItems) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const itemReactions = (item.squad_reactions || []) as any[];
                for (const r of itemReactions) {
                    if (r.user_id === user.id) continue; // Skip own reactions
                    allReactions.push({
                        id: r.id,
                        emoji: r.emoji,
                        user_id: r.user_id,
                        created_at: r.created_at,
                        reactor_name: r.users?.name || "Squad member",
                        event_type: item.event_type,
                        event_metadata: item.metadata || {},
                    });
                }
            }

            // Sort by newest first
            allReactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            setReactions(allReactions);

            // Calculate unread count
            const lastSeen = localStorage.getItem(LS_KEY);
            if (lastSeen) {
                const lastSeenTime = new Date(lastSeen).getTime();
                const unread = allReactions.filter(r => new Date(r.created_at).getTime() > lastSeenTime).length;
                setUnreadCount(unread);
            } else {
                setUnreadCount(allReactions.length);
            }
        } catch (err) {
            console.error("SquadPulse fetch error:", err);
        } finally {
            setIsLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        fetchReactions();
    }, [fetchReactions]);

    const handleOpen = () => {
        setIsSheetOpen(true);
        // Mark all as read
        localStorage.setItem(LS_KEY, new Date().toISOString());
        setUnreadCount(0);
    };

    const handleClose = () => {
        setIsSheetOpen(false);
    };

    // Don't render anything if no reactions ever
    if (isLoading || reactions.length === 0) return null;

    // Group unread reactions by emoji for the preview
    const previewEmojis = new Map<string, number>();
    const lastSeen = localStorage.getItem(LS_KEY);
    const lastSeenTime = lastSeen ? new Date(lastSeen).getTime() : 0;
    const displayReactions = unreadCount > 0
        ? reactions.filter(r => new Date(r.created_at).getTime() > lastSeenTime)
        : reactions.slice(0, 3);

    for (const r of displayReactions) {
        previewEmojis.set(r.emoji, (previewEmojis.get(r.emoji) || 0) + 1);
    }

    const isUnread = unreadCount > 0;

    const formatRelativeTime = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    return (
        <>
            {/* Squad Pulse Card */}
            <motion.button
                onClick={handleOpen}
                className={`w-full text-left rounded-2xl p-4 transition-all active:scale-[0.98] ${isUnread
                        ? "bg-brand-emerald/[0.08] border border-brand-emerald/30"
                        : "bg-white/5 border border-white/10"
                    }`}
                animate={isUnread ? {
                    boxShadow: [
                        "0 0 0 0 rgba(34,197,94,0)",
                        "0 0 20px 4px rgba(34,197,94,0.15)",
                        "0 0 0 0 rgba(34,197,94,0)",
                    ],
                } : undefined}
                transition={isUnread ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : undefined}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isUnread ? "bg-brand-emerald/20" : "bg-white/10"
                            }`}>
                            <Flame className={`w-4 h-4 ${isUnread ? "text-brand-emerald" : "text-muted-foreground"}`} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold uppercase tracking-widest ${isUnread ? "text-brand-emerald" : "text-muted-foreground"
                                    }`}>Squad Pulse</span>
                                {isUnread && (
                                    <span className="px-1.5 py-0.5 bg-brand-emerald text-black text-[10px] font-black rounded-full leading-none">
                                        {unreadCount}
                                    </span>
                                )}
                            </div>
                            {isUnread ? (
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    {[...previewEmojis.entries()].map(([emoji, count]) => (
                                        <span key={emoji} className="text-xs text-white/80">
                                            {emoji}×{count}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <span className="text-[10px] text-muted-foreground/60">All caught up</span>
                            )}
                        </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${isUnread ? "text-brand-emerald" : "text-muted-foreground/40"}`} />
                </div>
            </motion.button>

            {/* Reaction Sheet */}
            <AnimatePresence>
                {isSheetOpen && (
                    <div className="fixed inset-0 z-50 flex items-end justify-center">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleClose}
                            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="relative w-full max-w-lg bg-[#111] border border-white/10 rounded-t-3xl p-6 pb-24 shadow-2xl overflow-y-auto max-h-[75vh]"
                        >
                            {/* Sheet Header */}
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-2">
                                    <Flame className="w-5 h-5 text-brand-emerald" />
                                    <h2 className="text-lg font-bold">Squad Reactions</h2>
                                </div>
                                <button onClick={handleClose} className="p-2 bg-white/5 rounded-full text-muted-foreground hover:text-white transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Reaction List */}
                            <div className="space-y-3">
                                {reactions.slice(0, 20).map((r) => (
                                    <div key={r.id} className="flex items-start gap-3 py-3 border-b border-white/5 last:border-0">
                                        <span className="text-xl leading-none mt-0.5">{r.emoji}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-white">
                                                <span className="font-bold">{r.reactor_name}</span>
                                                <span className="text-muted-foreground"> reacted to </span>
                                                <span className="text-white/80">{EVENT_LABELS[r.event_type] || r.event_type}</span>
                                            </p>
                                            <span className="text-[10px] text-muted-foreground/60">{formatRelativeTime(r.created_at)}</span>
                                        </div>
                                    </div>
                                ))}

                                {reactions.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground text-sm">
                                        No reactions yet. Keep pushing!
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}

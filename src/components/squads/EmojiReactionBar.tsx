"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";

interface Reaction {
    id: string;
    emoji: string;
    user_id: string;
}

interface EmojiReactionBarProps {
    feedId: string;
    initialReactions: Reaction[];
    currentUserId: string;
}

const AVAILABLE_EMOJIS = ['🔥', '🙌', '💪', '👀'];

export function EmojiReactionBar({ feedId, initialReactions, currentUserId }: EmojiReactionBarProps) {
    const [reactions, setReactions] = useState<Reaction[]>(initialReactions);
    const [floatingEmojis, setFloatingEmojis] = useState<{ id: number, emoji: string, xOffset: number }[]>([]);

    // Group reactions for display
    const reactionCounts = AVAILABLE_EMOJIS.map(emoji => ({
        emoji,
        count: reactions.filter(r => r.emoji === emoji).length,
        hasReacted: reactions.some(r => r.emoji === emoji && r.user_id === currentUserId)
    }));

    const supabase = createClient();

    const triggerFloatAnimation = (emoji: string) => {
        // eslint-disable-next-line react-hooks/purity
        const id = Date.now() + Math.random();
        // random offset between -20px and +20px
        // eslint-disable-next-line react-hooks/purity
        const xOffset = (Math.random() - 0.5) * 40;
        setFloatingEmojis(prev => [...prev, { id, emoji, xOffset }]);

        // Remove after animation (1.5s is safe for a 1s animation)
        setTimeout(() => {
            setFloatingEmojis(prev => prev.filter(e => e.id !== id));
        }, 1500);
    };

    const handleToggleReaction = async (emoji: string) => {
        // Optimistic UI updates
        const existingReaction = reactions.find(r => r.emoji === emoji && r.user_id === currentUserId);

        if (existingReaction) {
            // Remove it
            setReactions(prev => prev.filter(r => r.id !== existingReaction.id));
            await supabase
                .from('squad_reactions')
                .delete()
                .eq('id', existingReaction.id);
        } else {
            // Add it
            // eslint-disable-next-line react-hooks/purity
            const tempId = `temp-${Date.now()}`;
            setReactions(prev => [...prev, { id: tempId, emoji, user_id: currentUserId }]);
            triggerFloatAnimation(emoji);

            const { data } = await supabase
                .from('squad_reactions')
                .insert({
                    feed_id: feedId,
                    user_id: currentUserId,
                    emoji: emoji
                })
                .select()
                .single();

            // Reconcile ID if needed (for simplicity in MVP, we just trust the insert or fetch fresh data later)
            if (data) {
                setReactions(prev => prev.map(r => r.id === tempId ? data : r));
            }
        }
    };

    return (
        <div className="relative flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
            {reactionCounts.map(({ emoji, count, hasReacted }) => (
                <button
                    key={emoji}
                    onClick={() => handleToggleReaction(emoji)}
                    className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${hasReacted
                        ? 'bg-brand-emerald/20 text-brand-emerald border border-brand-emerald/30'
                        : 'bg-white/5 text-muted-foreground border border-transparent hover:bg-white/10'
                        }`}
                >
                    <span className="text-base leading-none">{emoji}</span>
                    {count > 0 && <span>{count}</span>}
                </button>
            ))}

            {/* Floating Animation Layer */}
            <div className="absolute bottom-full left-0 w-full h-32 pointer-events-none overflow-visible z-50">
                <AnimatePresence>
                    {floatingEmojis.map((anim) => (
                        <motion.div
                            key={anim.id}
                            initial={{ opacity: 1, y: 0, x: anim.xOffset, scale: 0.5 }}
                            animate={{ opacity: 0, y: -60, x: anim.xOffset, scale: 1.5 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="absolute bottom-0 left-8 text-2xl"
                        >
                            {anim.emoji}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}

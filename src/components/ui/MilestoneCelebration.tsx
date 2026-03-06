"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import { BADGE_CONFIG, StreakMilestone } from "@/utils/streaks";
import confetti from "canvas-confetti";

interface MilestoneCelebrationProps {
    milestone: StreakMilestone;
    habitName: string;
    onDismiss: () => void;
}

export function MilestoneCelebration({ milestone, habitName, onDismiss }: MilestoneCelebrationProps) {
    const badge = BADGE_CONFIG[milestone];

    useEffect(() => {
        // Fire confetti
        const duration = 2500;
        const end = Date.now() + duration;
        const frame = () => {
            confetti({ particleCount: 5, angle: 60, spread: 70, origin: { x: 0, y: 0.7 }, colors: ["#10b981", "#f59e0b", "#8b5cf6"] });
            confetti({ particleCount: 5, angle: 120, spread: 70, origin: { x: 1, y: 0.7 }, colors: ["#10b981", "#f59e0b", "#8b5cf6"] });
            if (Date.now() < end) requestAnimationFrame(frame);
        };
        frame();

        // Haptic
        if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate([100, 50, 200, 50, 100]);
        }

        // Auto dismiss after 4s
        const timer = setTimeout(onDismiss, 4000);
        return () => clearTimeout(timer);
    }, [onDismiss]);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onDismiss}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md"
            >
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="flex flex-col items-center text-center px-8 py-10 max-w-sm"
                >
                    {/* Giant emoji */}
                    <motion.span
                        initial={{ scale: 0, rotate: -30 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                        className="text-[80px] leading-none mb-6"
                    >
                        {badge.emoji}
                    </motion.span>

                    {/* Milestone label */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className={`px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-widest mb-4 ${badge.colorClass}`}
                    >
                        {badge.label}
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-3xl font-bold text-white mb-2"
                    >
                        {milestone} Day Streak!
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-muted-foreground text-sm"
                    >
                        You&apos;ve hit {milestone} consecutive days of <span className="text-white font-medium">{habitName}</span>. Keep going!
                    </motion.p>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.5 }}
                        className="text-xs text-white/30 mt-8"
                    >
                        Tap anywhere to dismiss
                    </motion.p>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

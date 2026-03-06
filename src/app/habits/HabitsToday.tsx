"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
    Pill, Zap, Droplets, Apple, Dumbbell,
    Check, Plus, Sparkles, Minus, X
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";
import AddHabitModal from "./AddHabitModal";
import { logSquadEvent } from "@/utils/squads";
import { processHabitStreak, StreakMilestone } from "@/utils/streaks";
import { StreakBadge } from "@/components/ui/StreakBadge";
import { MilestoneCelebration } from "@/components/ui/MilestoneCelebration";
import confetti from "canvas-confetti";

// Icon mapping
const ICON_MAP: Record<string, React.ElementType> = {
    Pill, Zap, Droplets, Apple, Dumbbell,
    Check, Plus, Sparkles,
};

// Color mapping for Tailwind classes
const COLOR_MAP: Record<string, { bg: string; text: string; border: string; glow: string; solid: string; check: string }> = {
    "purple-400": { bg: "bg-purple-400/10", text: "text-purple-400", border: "border-purple-400/30", glow: "shadow-[0_0_20px_rgba(192,132,252,0.3)]", solid: "bg-purple-400", check: "text-white" },
    "yellow-400": { bg: "bg-yellow-400/10", text: "text-yellow-400", border: "border-yellow-400/30", glow: "shadow-[0_0_20px_rgba(250,204,21,0.3)]", solid: "bg-yellow-400", check: "text-brand-black" },
    "blue-400": { bg: "bg-blue-400/10", text: "text-blue-400", border: "border-blue-400/30", glow: "shadow-[0_0_20px_rgba(96,165,250,0.3)]", solid: "bg-blue-400", check: "text-white" },
    "orange-400": { bg: "bg-orange-400/10", text: "text-orange-400", border: "border-orange-400/30", glow: "shadow-[0_0_20px_rgba(251,146,60,0.3)]", solid: "bg-orange-400", check: "text-white" },
    "emerald": { bg: "bg-brand-emerald/10", text: "text-brand-emerald", border: "border-brand-emerald/30", glow: "shadow-[0_0_20px_rgba(34,197,94,0.3)]", solid: "bg-brand-emerald", check: "text-brand-black" },
    "pink-400": { bg: "bg-pink-400/10", text: "text-pink-400", border: "border-pink-400/30", glow: "shadow-[0_0_20px_rgba(244,114,182,0.3)]", solid: "bg-pink-400", check: "text-white" },
    "red-400": { bg: "bg-red-400/10", text: "text-red-400", border: "border-red-400/30", glow: "shadow-[0_0_20px_rgba(248,113,113,0.3)]", solid: "bg-red-400", check: "text-white" },
    "cyan-400": { bg: "bg-cyan-400/10", text: "text-cyan-400", border: "border-cyan-400/30", glow: "shadow-[0_0_20px_rgba(34,211,238,0.3)]", solid: "bg-cyan-400", check: "text-white" },
    "lime-400": { bg: "bg-lime-400/10", text: "text-lime-400", border: "border-lime-400/30", glow: "shadow-[0_0_20px_rgba(163,230,53,0.3)]", solid: "bg-lime-400", check: "text-brand-black" },
    "rose-400": { bg: "bg-rose-400/10", text: "text-rose-400", border: "border-rose-400/30", glow: "shadow-[0_0_20px_rgba(251,113,133,0.3)]", solid: "bg-rose-400", check: "text-white" },
};

interface HabitDefinition {
    id: string;
    name: string;
    icon: string;
    color: string;
    target_value: number;
    unit: string | null;
    increment_by: number;
    track_type: string;
    sort_order: number;
}

interface HabitLog {
    id: string;
    habit_id: string;
    value: number;
    completed: boolean;
    completed_at?: string | null;
    metadata: Record<string, unknown> | null;
}

const DEFAULT_HABITS: Omit<HabitDefinition, 'id'>[] = [
    { name: "Multivitamin", icon: "Pill", color: "purple-400", target_value: 1, unit: null, increment_by: 1, track_type: "boolean", sort_order: 0 },
    { name: "Creatine", icon: "Zap", color: "yellow-400", target_value: 5, unit: "g", increment_by: 5, track_type: "count", sort_order: 1 },
    { name: "Water", icon: "Droplets", color: "blue-400", target_value: 8, unit: "glasses", increment_by: 1, track_type: "count", sort_order: 2 },
    { name: "Fruit", icon: "Apple", color: "orange-400", target_value: 2, unit: "portions", increment_by: 1, track_type: "count", sort_order: 3 },
];

export default function HabitsToday() {
    const [habits, setHabits] = useState<HabitDefinition[]>([]);
    const [logs, setLogs] = useState<Record<string, HabitLog>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [celebratingId, setCelebratingId] = useState<string | null>(null);
    const [allDone, setAllDone] = useState(false);
    const [showAddHabit, setShowAddHabit] = useState(false);
    const [isTrakPlus, setIsTrakPlus] = useState(false);
    const [milestone, setMilestone] = useState<{ milestone: StreakMilestone; habitName: string } | null>(null);
    const [bestStreaks, setBestStreaks] = useState<Record<string, number>>({});

    const supabaseRef = useRef(createClient());

    const loadData = useCallback(async () => {
        setIsLoading(true);
        const supabase = supabaseRef.current;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch user profile for premium flag
        const { data: userProfile } = await supabase
            .from('users')
            .select('is_trak_plus')
            .eq('id', user.id)
            .single();

        if (userProfile) {
            setIsTrakPlus(userProfile.is_trak_plus);
        }

        // Fetch habit definitions
        let { data: habitDefs } = await supabase
            .from('habit_definitions')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .order('sort_order');

        // Seed defaults if no habits exist
        if (!habitDefs || habitDefs.length === 0) {
            const toInsert = DEFAULT_HABITS.map(h => ({
                ...h,
                user_id: user.id,
                is_active: true,
            }));
            const { data: inserted } = await supabase
                .from('habit_definitions')
                .insert(toInsert)
                .select();
            habitDefs = inserted;
        }

        if (habitDefs) setHabits(habitDefs);

        // Fetch today's logs
        const today = new Date().toISOString().split('T')[0];
        const { data: todayLogs } = await supabase
            .from('habit_logs')
            .select('*')
            .eq('user_id', user.id)
            .eq('date', today);

        if (todayLogs) {
            const logMap: Record<string, HabitLog> = {};
            todayLogs.forEach(log => { logMap[log.habit_id] = log; });
            setLogs(logMap);
        }

        // Fetch best streaks for badge display
        const { data: streakData } = await supabase
            .from('habit_streaks')
            .select('habit_id, best_streak')
            .eq('user_id', user.id);

        if (streakData) {
            const streakMap: Record<string, number> = {};
            streakData.forEach(s => { streakMap[s.habit_id] = s.best_streak; });
            setBestStreaks(streakMap);
        }

        setIsLoading(false);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => loadData(), 0);
        return () => clearTimeout(timer);
    }, [loadData]);

    // Check if all habits are done
    useEffect(() => {
        if (habits.length > 0) {
            const allCompleted = habits.every(h => logs[h.id]?.completed);
            if (allCompleted && Object.keys(logs).length > 0) {
                const timer = setTimeout(() => setAllDone(true), 0);
                return () => clearTimeout(timer);
            }
        }
    }, [logs, habits]);

    const handleIncrement = async (habit: HabitDefinition) => {
        const supabase = supabaseRef.current;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const today = new Date().toISOString().split('T')[0];
        const currentLog = logs[habit.id];
        const currentValue = currentLog?.value || 0;
        const newValue = Math.min(currentValue + habit.increment_by, habit.target_value);
        const isCompleted = newValue >= habit.target_value;

        if (currentLog) {
            // Update existing log
            await supabase
                .from('habit_logs')
                .update({
                    value: newValue,
                    completed: isCompleted,
                    completed_at: isCompleted ? new Date().toISOString() : null,
                })
                .eq('id', currentLog.id);
        } else {
            // Create new log
            await supabase
                .from('habit_logs')
                .insert({
                    user_id: user.id,
                    habit_id: habit.id,
                    date: today,
                    value: newValue,
                    completed: isCompleted,
                    completed_at: isCompleted ? new Date().toISOString() : null,
                });
        }

        // Optimistic update
        setLogs(prev => ({
            ...prev,
            [habit.id]: {
                ...(prev[habit.id] || { id: 'temp', habit_id: habit.id, metadata: null }),
                value: newValue,
                completed: isCompleted,
            }
        }));

        // Celebration animation
        if (isCompleted && !currentLog?.completed) {
            // Haptic Feedback for completion
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate(50);
            }

            setCelebratingId(habit.id);
            setTimeout(() => setCelebratingId(null), 1200);

            // Process streak and check for milestone
            const streakResult = await processHabitStreak(user.id, habit.id, habit.name);

            // Update local best streak display
            setBestStreaks(prev => ({ ...prev, [habit.id]: streakResult.bestStreak }));

            // Show milestone celebration if a new one was unlocked
            if (streakResult.newMilestone) {
                setMilestone({ milestone: streakResult.newMilestone, habitName: habit.name });
            }

            // Check if this was the last habit to make a perfect day
            const otherHabits = habits.filter(h => h.id !== habit.id);
            const othersCompleted = otherHabits.every(h => logs[h.id]?.completed);

            if (othersCompleted) {
                logSquadEvent(user.id, 'perfect_day', {});

                // Bigger Haptic Pattern for Perfect Day
                if (typeof navigator !== 'undefined' && navigator.vibrate) {
                    navigator.vibrate([100, 50, 100, 50, 200]);
                }

                // Full screen confetti cannon
                const duration = 3000;
                const end = Date.now() + duration;

                const frame = () => {
                    confetti({
                        particleCount: 5,
                        angle: 60,
                        spread: 55,
                        origin: { x: -0.1, y: 0.8 },
                        colors: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6']
                    });
                    confetti({
                        particleCount: 5,
                        angle: 120,
                        spread: 55,
                        origin: { x: 1.1, y: 0.8 },
                        colors: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6']
                    });

                    if (Date.now() < end) {
                        requestAnimationFrame(frame);
                    }
                };
                frame();
            }
        }
    };

    const handleDecrement = async (habit: HabitDefinition) => {
        const supabase = supabaseRef.current;
        const currentLog = logs[habit.id];

        if (!currentLog || currentLog.value <= 0) return;

        let newValue = 0;
        let isCompleted = false;
        let newMetadata = currentLog.metadata;

        if (habit.track_type === 'exercise') {
            newValue = 0;
            isCompleted = false;
            newMetadata = null;
        } else {
            newValue = Math.max(0, currentLog.value - habit.increment_by);
            isCompleted = newValue >= habit.target_value;
        }

        await supabase
            .from('habit_logs')
            .update({
                value: newValue,
                completed: isCompleted,
                completed_at: isCompleted ? currentLog.completed_at : null,
                metadata: newMetadata,
            })
            .eq('id', currentLog.id);

        setLogs(prev => ({
            ...prev,
            [habit.id]: {
                ...prev[habit.id],
                value: newValue,
                completed: isCompleted,
                metadata: newMetadata,
            }
        }));
    };

    const handleDeleteHabit = async (habitId: string) => {
        const confirmed = window.confirm("Are you sure you want to remove this habit?");
        if (!confirmed) return;

        const supabase = supabaseRef.current;

        // Soft-delete so we don't break historical Trends data
        await supabase
            .from('habit_definitions')
            .update({ is_active: false })
            .eq('id', habitId);

        setHabits(prev => prev.filter(h => h.id !== habitId));
    };

    const completedCount = habits.filter(h => logs[h.id]?.completed).length;
    const completionPct = habits.length > 0 ? (completedCount / habits.length) * 100 : 0;

    return (
        <div className="px-6 py-8 space-y-10 pb-8">
            {/* Milestone Celebration Overlay */}
            {milestone && (
                <MilestoneCelebration
                    milestone={milestone.milestone}
                    habitName={milestone.habitName}
                    onDismiss={() => setMilestone(null)}
                />
            )}
            {/* Completion Ring */}
            <div className="relative flex flex-col items-center justify-center py-4">
                {isLoading ? (
                    <div className="w-44 h-44 rounded-full animate-shimmer" />
                ) : (
                    <div className="relative w-44 h-44">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="42" className="stroke-white/5 fill-none" strokeWidth="6" />
                            <motion.circle
                                cx="50" cy="50" r="42"
                                className="stroke-brand-emerald fill-none"
                                strokeWidth="6" strokeLinecap="round"
                                initial={{ strokeDasharray: "0, 264" }}
                                animate={{ strokeDasharray: `${completionPct * 2.64}, 264` }}
                                transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                            <motion.span
                                key={completedCount}
                                initial={{ scale: 1.3, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="text-4xl font-bold tracking-tighter"
                            >
                                {completedCount}
                            </motion.span>
                            <span className="text-muted-foreground text-[10px] uppercase tracking-[0.2em] font-medium">
                                of {habits.length} done
                            </span>
                        </div>
                        {/* All done celebration glow */}
                        <AnimatePresence>
                            {allDone && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1.05 }}
                                    exit={{ opacity: 0, scale: 1 }}
                                    transition={{ duration: 0.8 }}
                                    className="absolute inset-0 rounded-full bg-brand-emerald/10 blur-xl -z-10"
                                />
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Habit Cards */}
            <div className="space-y-3">
                {isLoading ? (
                    [1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="flex items-center gap-4 p-5 animate-shimmer rounded-3xl">
                            <div className="w-12 h-12 bg-black/20 rounded-2xl flex-shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-black/20 rounded w-1/3" />
                                <div className="h-3 bg-black/20 rounded w-1/4" />
                            </div>
                            <div className="w-12 h-12 bg-black/20 rounded-full" />
                        </div>
                    ))
                ) : (
                    habits.map((habit) => {
                        const log = logs[habit.id];
                        const isCompleted = log?.completed ?? false;
                        const currentValue = log?.value || 0;
                        const colors = COLOR_MAP[habit.color] || COLOR_MAP["emerald"];
                        const IconComponent = ICON_MAP[habit.icon] || Sparkles;
                        const isCelebrating = celebratingId === habit.id;
                        const progress = habit.target_value > 0 ? (currentValue / habit.target_value) * 100 : 0;
                        const habitBestStreak = bestStreaks[habit.id] || 0;

                        return (
                            <motion.div
                                key={habit.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={cn(
                                    "relative flex items-center gap-4 p-5 rounded-3xl border transition-all duration-500 group",
                                    isCompleted
                                        ? `bg-white/[0.03] ${colors.border} ${isCelebrating ? colors.glow : ''}`
                                        : "bg-white/5 border-white/5"
                                )}
                            >
                                {/* Icon */}
                                <div className={cn(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors duration-500",
                                    isCompleted ? colors.bg : "bg-white/5"
                                )}>
                                    <IconComponent className={cn("w-5 h-5 transition-colors duration-500", isCompleted ? colors.text : "text-muted-foreground")} />
                                </div>

                                {/* Name + Progress */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h4 className="font-bold text-sm">{habit.name}</h4>
                                        <StreakBadge bestStreak={habitBestStreak} />
                                    </div>
                                    {habit.unit ? (
                                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                                            {currentValue}/{habit.target_value} {habit.unit}
                                        </p>
                                    ) : null}
                                    {/* Progress bar for count-based habits */}
                                    {habit.track_type === 'count' && !isCompleted && (
                                        <div className="w-full h-1 bg-white/5 rounded-full mt-2 overflow-hidden">
                                            <motion.div
                                                className={cn("h-full rounded-full", colors.solid)}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${progress}%` }}
                                                transition={{ duration: 0.5 }}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Delete Button (Top Right Absolute) */}
                                <button
                                    onClick={() => handleDeleteHabit(habit.id)}
                                    className="absolute -top-2 -right-2 p-1.5 bg-background border border-white/10 hover:border-red-500/30 hover:bg-red-500/10 rounded-full transition-all text-white/40 hover:text-red-400 z-10 shadow-sm"
                                    title="Remove this habit"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>

                                {/* Action Button */}
                                {isCompleted && habit.track_type !== 'count' ? (
                                    <motion.button
                                        whileTap={{ scale: 0.85 }}
                                        onClick={() => handleDecrement(habit)}
                                        initial={isCelebrating ? { scale: 0, rotate: -180 } : { scale: 1, rotate: 0 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                        className={cn("w-12 h-12 rounded-full flex items-center justify-center cursor-pointer relative", colors.solid)}
                                    >
                                        <Check className={cn("w-5 h-5", colors.check)} />
                                        {/* Minimal minus indicator for undo */}
                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-background rounded-full border border-white/10 flex items-center justify-center shadow-lg">
                                            <Minus className="w-3 h-3 text-muted-foreground" />
                                        </div>
                                    </motion.button>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        {habit.track_type === 'count' && currentValue > 0 && (
                                            <motion.button
                                                whileTap={{ scale: 0.85 }}
                                                onClick={() => handleDecrement(habit)}
                                                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center transition-all hover:bg-white/15"
                                            >
                                                <Minus className="w-4 h-4 text-white/70" />
                                            </motion.button>
                                        )}
                                        <motion.button
                                            whileTap={{ scale: 0.85 }}
                                            onClick={() => handleIncrement(habit)}
                                            className={cn(
                                                "w-12 h-12 rounded-full border flex items-center justify-center transition-all",
                                                isCompleted ? `${colors.solid} border-transparent` : "bg-white/10 border-white/10 hover:bg-white/15 active:bg-white/20"
                                            )}
                                        >
                                            {isCompleted ? <Check className={colors.check} /> : <Plus className="w-5 h-5" />}
                                        </motion.button>
                                    </div>
                                )}

                                {/* Celebration particles */}
                                <AnimatePresence>
                                    {isCelebrating && (
                                        <>
                                            {[...Array(6)].map((_, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                                                    animate={{
                                                        opacity: 0,
                                                        scale: 1,
                                                        x: (Math.random() - 0.5) * 120,
                                                        y: (Math.random() - 0.5) * 80,
                                                    }}
                                                    exit={{ opacity: 0 }}
                                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                                    className={cn("absolute right-8 w-2 h-2 rounded-full", colors.solid)}
                                                />
                                            ))}
                                        </>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })
                )}
            </div>

            {/* Add Custom Habit Button */}
            <button
                onClick={() => setShowAddHabit(true)}
                className="w-full py-5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3 transition-all hover:border-brand-emerald/30 active:scale-[0.98]"
            >
                <div className="w-10 h-10 bg-brand-emerald text-brand-black rounded-xl flex items-center justify-center">
                    <Plus className="w-6 h-6" />
                </div>
                <div className="text-left">
                    <h4 className="font-bold text-sm">Add Custom Habit</h4>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Track anything</p>
                </div>
            </button>

            {/* Add Habit Modal */}
            <AddHabitModal
                isOpen={showAddHabit}
                onClose={() => setShowAddHabit(false)}
                onCreated={loadData}
                isTrakPlus={isTrakPlus}
            />
        </div>
    );
}

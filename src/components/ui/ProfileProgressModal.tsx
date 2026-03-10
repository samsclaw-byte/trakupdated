"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface DayEntry {
    dateStr: string;         // YYYY-MM-DD
    label: string;           // "Mar 10"
    dayLabel: string;        // "Mon"
    perfectDay: boolean;
    nutritionLogged: boolean; // at least 1 meal
    workoutLogged: boolean;
}

interface ProfileProgressModalProps {
    userId: string;
    onClose: () => void;
}

function DayColumn({ entry }: { entry: DayEntry }) {
    const isToday = entry.dateStr === new Date().toISOString().split("T")[0];
    return (
        <div className="flex flex-col items-center gap-2 w-10 shrink-0">
            {/* Date label */}
            <p className={`text-[9px] font-bold uppercase tracking-widest ${isToday ? "text-brand-emerald" : "text-muted-foreground/60"}`}>
                {entry.dayLabel}
            </p>
            <p className={`text-[8px] font-medium ${isToday ? "text-brand-emerald/80" : "text-muted-foreground/40"}`}>
                {entry.label.split(" ")[1]}
            </p>

            {/* Perfect Day */}
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${entry.perfectDay ? "bg-amber-500/20 border border-amber-500/40" : "bg-white/5 border border-white/5"}`}>
                {entry.perfectDay ? "⭐" : <span className="w-2 h-2 rounded-sm bg-white/10 block" />}
            </div>

            {/* Nutrition */}
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${entry.nutritionLogged ? "bg-brand-emerald/20 border border-brand-emerald/40" : "bg-white/5 border border-white/5"}`}>
                {entry.nutritionLogged ? (
                    <span className="text-brand-emerald text-[10px] font-black">✓</span>
                ) : (
                    <span className="w-2 h-2 rounded-sm bg-white/10 block" />
                )}
            </div>

            {/* Fitness */}
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${entry.workoutLogged ? "bg-blue-500/20 border border-blue-500/40" : "bg-white/5 border border-white/5"}`}>
                {entry.workoutLogged ? (
                    <span className="text-blue-400 text-[10px] font-black">✓</span>
                ) : (
                    <span className="w-2 h-2 rounded-sm bg-white/10 block" />
                )}
            </div>
        </div>
    );
}

export function ProfileProgressModal({ userId, onClose }: ProfileProgressModalProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [days, setDays] = useState<DayEntry[]>([]);
    const [activeHabitCount, setActiveHabitCount] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const supabase = createClient();

            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - 27); // 28 days total

            const toLocalDateStr = (d: Date) =>
                new Date(d.getTime() - d.getTimezoneOffset() * 60000)
                    .toISOString()
                    .split("T")[0];

            const startStr = toLocalDateStr(startDate);
            const endStr = toLocalDateStr(endDate);

            // Fetch active habits count
            const { data: habitDefs } = await supabase
                .from("habit_definitions")
                .select("id")
                .eq("user_id", userId)
                .eq("is_active", true);
            const habitIds = (habitDefs || []).map((h: { id: string }) => h.id);
            setActiveHabitCount(habitIds.length);

            // Fetch habit logs
            const { data: habitLogs } = await supabase
                .from("habit_logs")
                .select("habit_id, date, completed")
                .eq("user_id", userId)
                .gte("date", startStr)
                .lte("date", endStr)
                .eq("completed", true);

            // Fetch meals
            const { data: meals } = await supabase
                .from("meals")
                .select("created_at")
                .eq("user_id", userId)
                .gte("created_at", startDate.toISOString())
                .lte("created_at", new Date(endDate.getTime() + 86400000).toISOString());

            // Fetch workouts
            const { data: workouts } = await supabase
                .from("workouts")
                .select("date")
                .eq("user_id", userId)
                .gte("date", startStr)
                .lte("date", endStr);

            // Build a map per date
            const habitLogsByDate: Record<string, Set<string>> = {};
            (habitLogs || []).forEach((l: { habit_id: string; date: string }) => {
                if (!habitLogsByDate[l.date]) habitLogsByDate[l.date] = new Set();
                habitLogsByDate[l.date].add(l.habit_id);
            });

            const mealDates = new Set<string>(
                (meals || []).map((m: { created_at: string }) =>
                    toLocalDateStr(new Date(m.created_at))
                )
            );

            const workoutDates = new Set<string>(
                (workouts || []).map((w: { date: string }) => w.date)
            );

            // Build 28-day array oldest → newest
            const result: DayEntry[] = [];
            for (let i = 27; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateStr = toLocalDateStr(d);
                const dayLabel = d.toLocaleDateString("en-US", { weekday: "short" });
                const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                const completedForDay = habitLogsByDate[dateStr] || new Set();
                const perfectDay =
                    habitIds.length > 0 &&
                    habitIds.every((id: string) => completedForDay.has(id));
                result.push({
                    dateStr,
                    label,
                    dayLabel,
                    perfectDay,
                    nutritionLogged: mealDates.has(dateStr),
                    workoutLogged: workoutDates.has(dateStr),
                });
            }

            setDays(result);
            setIsLoading(false);
        };
        fetchData();
    }, [userId]);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[90] flex items-end justify-center"
            >
                <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 30, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-card w-full max-w-lg rounded-t-3xl border border-white/10 shadow-2xl pb-10"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/5">
                        <div>
                            <h3 className="text-base font-bold">28-Day Progress</h3>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-0.5">Last 4 weeks</p>
                        </div>
                        <button onClick={onClose} className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-4 px-6 py-3 border-b border-white/5">
                        <div className="flex items-center gap-1.5">
                            <div className="w-4 h-4 rounded bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-[8px]">⭐</div>
                            <span className="text-[10px] text-muted-foreground font-medium">Perfect Day</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-4 h-4 rounded bg-brand-emerald/20 border border-brand-emerald/40" />
                            <span className="text-[10px] text-muted-foreground font-medium">Nutrition</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-4 h-4 rounded bg-blue-500/20 border border-blue-500/40" />
                            <span className="text-[10px] text-muted-foreground font-medium">Fitness</span>
                        </div>
                    </div>

                    {/* Row Labels */}
                    <div className="flex px-6 pt-4">
                        <div className="w-16 shrink-0 flex flex-col gap-2 pr-2">
                            <div className="h-[30px]" /> {/* spacer for date labels */}
                            <div className="h-[30px]" />
                            <div className="h-8 flex items-center">
                                <span className="text-[10px] font-bold text-amber-500/80 uppercase tracking-widest">Perfect</span>
                            </div>
                            <div className="h-8 flex items-center">
                                <span className="text-[10px] font-bold text-brand-emerald uppercase tracking-widest">Nutrition</span>
                            </div>
                            <div className="h-8 flex items-center">
                                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Fitness</span>
                            </div>
                        </div>

                        {/* Scrollable columns */}
                        {isLoading ? (
                            <div className="flex-1 flex items-center justify-center py-10">
                                <Loader2 className="w-6 h-6 animate-spin text-brand-emerald" />
                            </div>
                        ) : (
                            <div className="flex-1 overflow-x-auto">
                                <div className="flex gap-1 pb-2" style={{ minWidth: `${days.length * 44}px` }}>
                                    {days.map((entry) => (
                                        <DayColumn key={entry.dateStr} entry={entry} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Stats summary */}
                    {!isLoading && (
                        <div className="flex gap-3 px-6 mt-4">
                            <div className="flex-1 bg-amber-500/5 rounded-xl p-3 text-center border border-amber-500/10">
                                <p className="text-lg font-bold text-amber-400">{days.filter(d => d.perfectDay).length}</p>
                                <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Perfect Days</p>
                            </div>
                            <div className="flex-1 bg-brand-emerald/5 rounded-xl p-3 text-center border border-brand-emerald/10">
                                <p className="text-lg font-bold text-brand-emerald">{days.filter(d => d.nutritionLogged).length}</p>
                                <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Nutrition Days</p>
                            </div>
                            <div className="flex-1 bg-blue-500/5 rounded-xl p-3 text-center border border-blue-500/10">
                                <p className="text-lg font-bold text-blue-400">{days.filter(d => d.workoutLogged).length}</p>
                                <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Workout Days</p>
                            </div>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

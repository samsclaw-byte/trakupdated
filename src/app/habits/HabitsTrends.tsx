"use client";

import { motion } from "framer-motion";
import { Trophy, Calendar, Zap } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";

const COLOR_DOT_MAP: Record<string, string> = {
    "purple-400": "bg-purple-400",
    "yellow-400": "bg-yellow-400",
    "blue-400": "bg-blue-400",
    "orange-400": "bg-orange-400",
    "emerald": "bg-emerald-400",
    "pink-400": "bg-pink-400",
    "red-400": "bg-red-400",
    "cyan-400": "bg-cyan-400",
    "lime-400": "bg-lime-400",
    "rose-400": "bg-rose-400",
};

interface HabitDef {
    id: string;
    name: string;
    color: string;
}

interface LogEntry {
    habit_id: string;
    date: string;
    completed: boolean;
}

export default function HabitsTrends() {
    const [view, setView] = useState<"7d" | "28d">("7d");
    const [habits, setHabits] = useState<HabitDef[]>([]);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const supabase = useMemo(() => createClient(), []);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: habitDefs } = await supabase
                .from('habit_definitions')
                .select('id, name, color')
                .eq('user_id', user.id)
                .eq('is_active', true)
                .order('sort_order');

            if (habitDefs) setHabits(habitDefs);

            // Get earliest habit log to determine true start date
            const { data: firstLog } = await supabase
                .from('habit_logs')
                .select('date')
                .eq('user_id', user.id)
                .order('date', { ascending: true })
                .limit(1)
                .single();

            const days = view === "7d" ? 7 : 28;
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const chartStartDateStr = new Date();
            chartStartDateStr.setDate(today.getDate() - (days - 1));
            let startStr = chartStartDateStr.toISOString().split('T')[0];

            if (firstLog && firstLog.date) {
                if (firstLog.date > startStr) {
                    startStr = firstLog.date;
                }
            }

            const { data: habitLogs } = await supabase
                .from('habit_logs')
                .select('habit_id, date, completed')
                .eq('user_id', user.id)
                .gte('date', startStr);

            if (habitLogs) setLogs(habitLogs);
            setIsLoading(false);
        };

        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [view]);

    // Build date range
    const days = view === "7d" ? 7 : 28;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startStr = new Date();
    startStr.setDate(today.getDate() - (days - 1));
    let actualStartStr = startStr.toISOString().split('T')[0];

    // We need to recreate the crop logic here synchronously since we can't await in render, 
    // but we can just use the earliest date from our `logs` state (which is already cropped by the DB query)
    if (logs.length > 0) {
        const earliestLog = logs.reduce((min, p) => p.date < min ? p.date : min, logs[0].date);
        if (earliestLog > actualStartStr) {
            actualStartStr = earliestLog;
        }
    }

    const chartStartDate = new Date(actualStartStr);
    const actualDays = Math.max(1, Math.floor((today.getTime() - chartStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    const dateRange: string[] = [];
    for (let i = actualDays - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        dateRange.push(d.toISOString().split('T')[0]);
    }

    // Stats
    const totalPossible = habits.length * dateRange.length;
    const totalCompleted = logs.filter(l => l.completed).length;
    const completionRate = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;

    // Best streak: consecutive days where ALL habits were completed
    let bestStreak = 0;
    let currentStreak = 0;
    for (const date of dateRange) {
        const allDone = habits.every(h =>
            logs.some(l => l.habit_id === h.id && l.date === date && l.completed)
        );
        if (allDone && habits.length > 0) {
            currentStreak++;
            bestStreak = Math.max(bestStreak, currentStreak);
        } else {
            currentStreak = 0;
        }
    }

    // Most consistent habit
    const habitCompletionRates = habits.map(h => {
        const completed = logs.filter(l => l.habit_id === h.id && l.completed).length;
        return { name: h.name, rate: dateRange.length > 0 ? completed / dateRange.length : 0 };
    });
    const mostConsistent = habitCompletionRates.sort((a, b) => b.rate - a.rate)[0];

    return (
        <div className="px-6 py-8 space-y-10 pb-8">
            {/* Period Toggle */}
            <div className="flex p-1 bg-white/5 border border-white/5 rounded-2xl">
                {(["7d", "28d"] as const).map((v) => (
                    <button
                        key={v}
                        onClick={() => setView(v)}
                        className={cn(
                            "flex-1 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all",
                            view === v ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white"
                        )}
                    >
                        {v === "7d" ? "7 Days" : "28 Days"}
                    </button>
                ))}
            </div>

            {/* Consistency Grid */}
            <div className="space-y-6">
                {isLoading ? (
                    [1, 2, 3].map(i => (
                        <div key={i} className="space-y-2">
                            <div className="h-3 w-20 bg-white/5 rounded animate-pulse" />
                            <div className="flex gap-1">
                                {Array.from({ length: 7 }).map((_, j) => (
                                    <div key={j} className="w-6 h-6 bg-white/5 rounded-md animate-pulse" />
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    habits.map((habit) => {
                        const dotColor = COLOR_DOT_MAP[habit.color] || "bg-emerald-400";
                        return (
                            <div key={habit.id} className="space-y-2">
                                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{habit.name}</span>
                                <div className="flex gap-1 flex-wrap">
                                    {dateRange.map((date, i) => {
                                        const isCompleted = logs.some(l => l.habit_id === habit.id && l.date === date && l.completed);
                                        return (
                                            <motion.div
                                                key={date}
                                                initial={{ opacity: 0, scale: 0 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ duration: 0.3, delay: i * 0.02 }}
                                                className={cn(
                                                    "w-6 h-6 rounded-md transition-colors",
                                                    isCompleted ? dotColor : "bg-white/5"
                                                )}
                                                title={`${date}: ${isCompleted ? 'Done' : 'Missed'}`}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                <div className="p-6 bg-white/5 border border-white/5 rounded-3xl space-y-4">
                    <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div>
                        <h4 className="text-xl font-bold">{bestStreak > 0 ? `${bestStreak} Day${bestStreak !== 1 ? 's' : ''}` : "—"}</h4>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Best Streak</p>
                    </div>
                </div>
                <div className="p-6 bg-white/5 border border-white/5 rounded-3xl space-y-4">
                    <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-brand-emerald" />
                    </div>
                    <div>
                        <h4 className="text-xl font-bold">{completionRate}%</h4>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Completion Rate</p>
                    </div>
                </div>
            </div>

            {/* Summary Card */}
            <div className="p-6 bg-emerald-gradient rounded-[2rem] text-brand-black">
                <div className="flex items-start justify-between mb-6">
                    <Zap className="w-6 h-6 fill-current" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Summary</span>
                </div>
                <h3 className="text-2xl font-bold tracking-tight mb-2">
                    {totalCompleted > 0
                        ? `${completionRate}% completion rate`
                        : "Start tracking habits!"}
                </h3>
                <p className="text-sm font-medium opacity-70 leading-relaxed">
                    {totalCompleted > 0 && mostConsistent
                        ? `You completed ${totalCompleted} of ${totalPossible} habit check-ins. "${mostConsistent.name}" is your most consistent habit at ${Math.round(mostConsistent.rate * 100)}%.`
                        : "Complete your daily habits to see insights and streaks appear here."}
                </p>
            </div>
        </div>
    );
}

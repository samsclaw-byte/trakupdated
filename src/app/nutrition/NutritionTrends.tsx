"use client";

import { motion } from "framer-motion";
import { TrendingUp, Trophy, Zap, Calendar } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface DailyCalories {
    date: string;
    day: string;
    calories: number;
}

export default function NutritionTrends() {
    const [view, setView] = useState<"7d" | "28d">("7d");
    const [chartData, setChartData] = useState<DailyCalories[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [goal, setGoal] = useState(2400);
    const [streak, setStreak] = useState(0);

    const supabase = useMemo(() => createClient(), []);

    useEffect(() => {
        const fetchTrends = async () => {
            setIsLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase
                .from('users')
                .select('daily_calories')
                .eq('id', user.id)
                .single();
            if (profile?.daily_calories) setGoal(profile.daily_calories);

            // Get earliest meal to determine true start date
            const { data: firstMeal } = await supabase
                .from('meals')
                .select('created_at')
                .eq('user_id', user.id)
                .order('created_at', { ascending: true })
                .limit(1)
                .single();

            const days = view === "7d" ? 7 : 28;
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            let chartStartDate = new Date(today);
            chartStartDate.setDate(today.getDate() - (days - 1));

            // If user's first entry is more recent than the window, crop the window
            if (firstMeal) {
                const firstMealDate = new Date(firstMeal.created_at);
                firstMealDate.setHours(0, 0, 0, 0);
                if (firstMealDate > chartStartDate) {
                    chartStartDate = firstMealDate;
                }
            }

            // Calculate actual days to show based on cropped start date
            const actualDays = Math.max(1, Math.floor((today.getTime() - chartStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);

            const { data: meals } = await supabase
                .from('meals')
                .select('calories, created_at')
                .eq('user_id', user.id)
                .gte('created_at', chartStartDate.toISOString())
                .order('created_at', { ascending: true });

            const calorieMap: Record<string, number> = {};
            for (const meal of (meals ?? [])) {
                const dateKey = new Date(meal.created_at).toLocaleDateString('en-CA');
                calorieMap[dateKey] = (calorieMap[dateKey] || 0) + (Number(meal.calories) || 0);
            }

            const result: DailyCalories[] = [];
            let streakCount = 0;

            for (let i = actualDays - 1; i >= 0; i--) {
                const d = new Date(today);
                d.setDate(today.getDate() - i);
                const dateKey = d.toLocaleDateString('en-CA');
                const dayLabel = actualDays <= 7
                    ? DAY_LABELS[d.getDay() === 0 ? 6 : d.getDay() - 1]
                    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                result.push({ date: dateKey, day: dayLabel, calories: calorieMap[dateKey] ?? 0 });
            }

            for (let i = result.length - 1; i >= 0; i--) {
                if (result[i].calories > 0) {
                    streakCount++;
                } else {
                    break;
                }
            }
            setStreak(streakCount);
            setChartData(result);
            setIsLoading(false);
        };

        fetchTrends();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [view]);

    const maxCalories = Math.max(...chartData.map(d => d.calories), goal);
    const avgCalories = chartData.length > 0
        ? Math.round(chartData.filter(d => d.calories > 0).reduce((s, d) => s + d.calories, 0) / Math.max(chartData.filter(d => d.calories > 0).length, 1))
        : 0;

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

            {/* Main Chart Card */}
            <div className="p-8 bg-white/5 border border-white/5 rounded-[2.5rem] space-y-8">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        {isLoading ? (
                            <div className="h-8 w-24 bg-white/5 rounded animate-pulse" />
                        ) : (
                            <h3 className="text-2xl font-bold tracking-tight">
                                {avgCalories > 0 ? avgCalories.toLocaleString() : "—"}
                            </h3>
                        )}
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Avg Daily Calories</p>
                    </div>
                    {avgCalories > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-emerald/10 rounded-full">
                            <TrendingUp className="w-3 h-3 text-brand-emerald" />
                            <span className="text-[10px] font-bold text-brand-emerald">
                                {Math.round((avgCalories / goal) * 100)}% of goal
                            </span>
                        </div>
                    )}
                </div>

                {/* Chart */}
                <div className={cn("relative flex items-end justify-between gap-1 pt-4", view === "7d" ? "h-48" : "h-40")}>
                    {/* Goal Baseline */}
                    <div
                        className="absolute left-0 right-0 border-t border-dashed border-white/20 z-0 flex items-center"
                        style={{ bottom: `${Math.min((goal / maxCalories) * 100, 100)}%` }}
                    >
                        <span className="text-[8px] bg-background/80 px-1 text-muted-foreground/50 tracking-widest uppercase font-bold absolute -top-1.5 right-0 rounded">
                            Target ({goal})
                        </span>
                    </div>

                    {isLoading ? (
                        Array.from({ length: view === "7d" ? 7 : 14 }).map((_, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-3 h-full justify-end z-10">
                                <div
                                    className="w-full bg-white/5 rounded-lg animate-pulse"
                                    style={{ height: `${Math.random() * 60 + 20}%` }}
                                />
                                <div className="h-2 w-6 bg-white/5 rounded animate-pulse" />
                            </div>
                        ))
                    ) : (
                        chartData.map((d, i) => (
                            <div key={i} className="relative flex-1 flex flex-col items-center group h-full justify-end z-10">
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: d.calories > 0 ? `${(d.calories / maxCalories) * 100}%` : "4px" }}
                                    transition={{ duration: 0.8, delay: i * 0.04 }}
                                    className={cn(
                                        "w-full rounded-t-lg transition-colors relative",
                                        d.calories > goal
                                            ? "bg-red-400/40 group-hover:bg-red-400/60"
                                            : d.calories > 0
                                                ? "bg-brand-emerald/40 group-hover:bg-brand-emerald/60"
                                                : "bg-white/5"
                                    )}
                                >
                                </motion.div>
                                {view === "7d" && (
                                    <span className="text-[10px] uppercase tracking-tighter text-muted-foreground mt-3 font-bold shrink-0">{d.day}</span>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                <div className="p-6 bg-white/5 border border-white/5 rounded-3xl space-y-4">
                    <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-yellow-400" />
                    </div>
                    <div>
                        {isLoading ? (
                            <div className="h-7 w-16 bg-white/5 rounded animate-pulse mb-1" />
                        ) : (
                            <h4 className="text-xl font-bold">{streak > 0 ? `${streak} Day${streak !== 1 ? 's' : ''}` : "—"}</h4>
                        )}
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Log Streak</p>
                    </div>
                </div>
                <div className="p-6 bg-white/5 border border-white/5 rounded-3xl space-y-4">
                    <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-brand-emerald" />
                    </div>
                    <div>
                        {isLoading ? (
                            <div className="h-7 w-16 bg-white/5 rounded animate-pulse mb-1" />
                        ) : (
                            <h4 className="text-xl font-bold">
                                {chartData.filter(d => d.calories > 0).length} / {chartData.length}
                            </h4>
                        )}
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Days Logged</p>
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
                    {avgCalories > 0 ? `You averaged ${avgCalories.toLocaleString()} kcal` : "Start logging meals!"}
                </h3>
                <p className="text-sm font-medium opacity-70 leading-relaxed">
                    {avgCalories > 0
                        ? `That's ${avgCalories > goal ? `${avgCalories - goal} kcal above` : `${goal - avgCalories} kcal below`} your ${goal.toLocaleString()} kcal daily target over the last ${view === "7d" ? "7" : "28"} days.`
                        : `Log your meals daily to see your personal performance insights appear here.`}
                </p>
            </div>
        </div>
    );
}

"use client";

import { motion } from "framer-motion";
import { TrendingUp, Trophy, Zap, Calendar, Crown } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface DailyData {
    date: string;
    day: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fibre: number;
    sodium: number;
    potassium: number;
    calcium: number;
    iron: number;
    vitamin_c: number;
    [key: string]: number | string;
}

export default function NutritionTrends() {
    const [view, setView] = useState<"7d" | "28d">("7d");
    const [metric, setMetric] = useState<string>("calories");
    const [chartData, setChartData] = useState<DailyData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [profile, setProfile] = useState<{ daily_calories: number, weight: number, is_trak_plus: boolean }>({ daily_calories: 2400, weight: 80, is_trak_plus: false });
    const [streak, setStreak] = useState(0);

    const supabase = useMemo(() => createClient(), []);

    const goal = profile.daily_calories || 2400;
    const proteinTarget = profile.weight ? Math.round(profile.weight * 1.8) : 180;
    const carbsTarget = goal ? Math.round((goal * 0.45) / 4) : 270;
    const fatTarget = goal ? Math.round((goal * 0.25) / 9) : 80;

    // MICRO_TARGETS from NutritionToday
    const MICRO_TARGETS = { sodium: 2300, potassium: 3500, calcium: 1000, magnesium: 375, iron: 14, zinc: 10, vitamin_c: 80, vitamin_d: 5, vitamin_b12: 2.5, folate: 200 };

    const METRICS = [
        { id: 'calories', label: 'Calories', goal: goal, unit: 'kcal', color: 'bg-brand-emerald', text: 'text-brand-emerald', micro: false, goodToExceed: false },
        { id: 'protein', label: 'Protein', goal: proteinTarget, unit: 'g', color: 'bg-blue-400', text: 'text-blue-400', micro: false, goodToExceed: true },
        { id: 'carbs', label: 'Carbs', goal: carbsTarget, unit: 'g', color: 'bg-orange-400', text: 'text-orange-400', micro: false, goodToExceed: false },
        { id: 'fat', label: 'Fat', goal: fatTarget, unit: 'g', color: 'bg-purple-400', text: 'text-purple-400', micro: false, goodToExceed: false },
        { id: 'fibre', label: 'Fibre', goal: 30, unit: 'g', color: 'bg-yellow-400', text: 'text-yellow-400', micro: false, goodToExceed: true },
        { id: 'sodium', label: 'Sodium', goal: MICRO_TARGETS.sodium, unit: 'mg', color: 'bg-sky-400', text: 'text-sky-400', micro: true, goodToExceed: false },
        { id: 'potassium', label: 'Potassium', goal: MICRO_TARGETS.potassium, unit: 'mg', color: 'bg-yellow-400', text: 'text-yellow-400', micro: true, goodToExceed: true },
        { id: 'calcium', label: 'Calcium', goal: MICRO_TARGETS.calcium, unit: 'mg', color: 'bg-slate-200', text: 'text-slate-200', micro: true, goodToExceed: true },
        { id: 'iron', label: 'Iron', goal: MICRO_TARGETS.iron, unit: 'mg', color: 'bg-red-400', text: 'text-red-400', micro: true, goodToExceed: true },
        { id: 'vitamin_c', label: 'Vit C', goal: MICRO_TARGETS.vitamin_c, unit: 'mg', color: 'bg-orange-500', text: 'text-orange-500', micro: true, goodToExceed: true },
    ];

    useEffect(() => {
        const fetchTrends = async () => {
            setIsLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: userProfile } = await supabase
                .from('users')
                .select('daily_calories, weight, is_trak_plus')
                .eq('id', user.id)
                .single();
            if (userProfile) setProfile(userProfile);

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

            if (firstMeal) {
                const firstMealDate = new Date(firstMeal.created_at);
                firstMealDate.setHours(0, 0, 0, 0);
                if (firstMealDate > chartStartDate) {
                    chartStartDate = firstMealDate;
                }
            }

            const actualDays = Math.max(1, Math.floor((today.getTime() - chartStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);

            const { data: meals } = await supabase
                .from('meals')
                .select('calories, protein, carbs, fat, fibre, micronutrients, created_at')
                .eq('user_id', user.id)
                .gte('created_at', chartStartDate.toISOString())
                .order('created_at', { ascending: true });

            const dataMap: Record<string, Record<string, number>> = {};
            for (const meal of (meals ?? [])) {
                const dateKey = new Date(meal.created_at).toLocaleDateString('en-CA');
                if (!dataMap[dateKey]) {
                    dataMap[dateKey] = { calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0, sodium: 0, potassium: 0, calcium: 0, iron: 0, vitamin_c: 0 };
                }
                dataMap[dateKey].calories += (Number(meal.calories) || 0);
                dataMap[dateKey].protein += (Number(meal.protein) || 0);
                dataMap[dateKey].carbs += (Number(meal.carbs) || 0);
                dataMap[dateKey].fat += (Number(meal.fat) || 0);
                dataMap[dateKey].fibre += (Number(meal.fibre) || 0);
                if (meal.micronutrients) {
                    dataMap[dateKey].sodium += (meal.micronutrients.sodium || 0);
                    dataMap[dateKey].potassium += (meal.micronutrients.potassium || 0);
                    dataMap[dateKey].calcium += (meal.micronutrients.calcium || 0);
                    dataMap[dateKey].iron += (meal.micronutrients.iron || 0);
                    dataMap[dateKey].vitamin_c += (meal.micronutrients.vitamin_c || 0);
                }
            }

            const result: DailyData[] = [];
            let streakCount = 0;

            for (let i = 0; i < actualDays; i++) {
                const d = new Date(today);
                d.setDate(today.getDate() - i);
                const dateKey = d.toLocaleDateString('en-CA');
                const dayLabel = actualDays <= 7
                    ? DAY_LABELS[d.getDay() === 0 ? 6 : d.getDay() - 1]
                    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                const entryData = dataMap[dateKey] || {};
                result.push({
                    date: dateKey,
                    day: dayLabel,
                    calories: entryData.calories || 0,
                    protein: Math.round(entryData.protein || 0),
                    carbs: Math.round(entryData.carbs || 0),
                    fat: Math.round(entryData.fat || 0),
                    fibre: Math.round(entryData.fibre || 0),
                    sodium: Math.round(entryData.sodium || 0),
                    potassium: Math.round(entryData.potassium || 0),
                    calcium: Math.round(entryData.calcium || 0),
                    iron: Math.round((entryData.iron || 0) * 10) / 10,
                    vitamin_c: Math.round(entryData.vitamin_c || 0),
                });
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

    const activeMetric = METRICS.find(m => m.id === metric) || METRICS[0];
    const metricMax = Math.max(...chartData.map(d => Number(d[activeMetric.id] || 0)), activeMetric.goal * 1.2);
    const avgValue = chartData.length > 0
        ? Math.round(chartData.filter(d => d.calories > 0).reduce((s, d) => s + Number(d[activeMetric.id] || 0), 0) / Math.max(chartData.filter(d => d.calories > 0).length, 1))
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
            <div className="p-8 bg-[rgba(255,255,255,0.02)] border border-white/5 rounded-[2.5rem] space-y-8 shadow-[0_4px_40px_rgba(0,0,0,0.1)] backdrop-blur-3xl">

                {/* Metric Selector Scroll Area */}
                <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none snap-x mask-fade-edges -mx-4 px-4">
                    {METRICS.map((m) => {
                        const isLocked = m.micro && !profile.is_trak_plus;
                        return (
                            <button
                                key={m.id}
                                disabled={isLocked}
                                onClick={() => setMetric(m.id)}
                                className={cn(
                                    "flex-shrink-0 px-4 py-2 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all snap-start flex items-center gap-1.5 border",
                                    metric === m.id
                                        ? `${m.color.replace('bg-', 'bg-')}/20 ${m.text} border-${m.color.replace('bg-', '')}/50`
                                        : "bg-white/5 text-muted-foreground border-transparent hover:bg-white/10",
                                    isLocked && "opacity-40 grayscale"
                                )}
                            >
                                {isLocked && <Crown className="w-3 h-3 text-amber-500" />}
                                {m.label}
                            </button>
                        );
                    })}
                </div>

                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        {isLoading ? (
                            <div className="h-8 w-24 bg-white/5 rounded animate-pulse" />
                        ) : (
                            <h3 className="text-3xl font-black tracking-tight flex items-baseline gap-1">
                                {avgValue > 0 ? avgValue.toLocaleString() : "—"}<span className="text-sm text-muted-foreground font-medium">{activeMetric.unit}</span>
                            </h3>
                        )}
                        <p className={cn("text-[10px] uppercase tracking-widest font-bold", activeMetric.text)}>Avg Daily {activeMetric.label}</p>
                    </div>
                    {avgValue > 0 && (
                        <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full",
                            avgValue > activeMetric.goal ? (activeMetric.goodToExceed ? "bg-brand-emerald/10" : "bg-red-500/10") : (activeMetric.goodToExceed ? "bg-red-500/10" : "bg-brand-emerald/10")
                        )}>
                            <TrendingUp className={cn("w-3 h-3", avgValue > activeMetric.goal ? (activeMetric.goodToExceed ? "text-brand-emerald" : "text-red-500") : (activeMetric.goodToExceed ? "text-red-500" : "text-brand-emerald"))} />
                            <span className={cn("text-[10px] font-bold", avgValue > activeMetric.goal ? (activeMetric.goodToExceed ? "text-brand-emerald" : "text-red-500") : (activeMetric.goodToExceed ? "text-red-500" : "text-brand-emerald"))}>
                                {avgValue > activeMetric.goal
                                    ? `${Math.round(((avgValue - activeMetric.goal) / activeMetric.goal) * 100)}% over`
                                    : `${Math.round(((activeMetric.goal - avgValue) / activeMetric.goal) * 100)}% under`}
                            </span>
                        </div>
                    )}
                </div>

                {/* Chart */}
                <div className={cn("relative flex items-end justify-between gap-1 pt-6", view === "7d" ? "h-52" : "h-40")}>
                    {/* Goal Baseline */}
                    <div
                        className="absolute left-0 right-0 border-t border-dashed border-white/20 z-0 flex items-center transition-all duration-500"
                        style={{ bottom: `${Math.min((activeMetric.goal / metricMax) * 100, 100)}%` }}
                    >
                        <span className="text-[8px] bg-background/80 px-1 text-muted-foreground/50 tracking-widest uppercase font-bold absolute -top-1.5 right-0 rounded">
                            Target ({activeMetric.goal}{activeMetric.unit})
                        </span>
                    </div>

                    {isLoading ? (
                        Array.from({ length: view === "7d" ? 7 : 14 }).map((_, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-3 h-full justify-end z-10">
                                <div
                                    className="w-full bg-white/5 rounded-lg animate-pulse"
                                    style={{ height: `${(i * 15) % 60 + 20}%` }}
                                />
                                <div className="h-2 w-6 bg-white/5 rounded animate-pulse" />
                            </div>
                        ))
                    ) : (
                        chartData.map((d, i) => {
                            const val = Number(d[activeMetric.id] || 0);
                            const activePct = (val / metricMax) * 100;
                            return (
                                <div key={i} className="relative flex-1 flex flex-col items-center group h-full justify-end z-10 w-full min-w-[3px]">
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: val > 0 ? `${activePct}%` : "4px" }}
                                        transition={{ duration: 0.5, delay: i * 0.02 }}
                                        className={cn(
                                            "w-[90%] rounded-t-lg transition-all relative overflow-hidden",
                                            val > activeMetric.goal
                                                ? (activeMetric.goodToExceed ? `${activeMetric.color.replace('bg-', 'bg-')}/50 group-hover:${activeMetric.color.replace('bg-', 'bg-')}/80` : "bg-red-400/50 group-hover:bg-red-400/80")
                                                : val > 0
                                                    ? `${activeMetric.color.replace('bg-', 'bg-')}/50 group-hover:${activeMetric.color.replace('bg-', 'bg-')}/80`
                                                    : "bg-white/5"
                                        )}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </motion.div>
                                    {view === "7d" && (
                                        <span className="text-[10px] uppercase tracking-tighter text-muted-foreground mt-3 font-bold shrink-0">{d.day}</span>
                                    )}
                                </div>
                            );
                        })
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
            <div className={`p-6 bg-gradient-to-br from-white/10 to-transparent border border-white/5 rounded-[2rem] text-white shadow-xl`}>
                <div className="flex items-start justify-between mb-4">
                    <Zap className={cn("w-6 h-6", activeMetric.text)} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Summary</span>
                </div>
                <h3 className="text-xl font-bold tracking-tight mb-2 leading-snug">
                    {avgValue > 0 ? `You averaged ${avgValue.toLocaleString()}${activeMetric.unit} of ${activeMetric.label}` : "Start logging meals!"}
                </h3>
                <p className="text-sm font-medium opacity-70 leading-relaxed">
                    {avgValue > 0
                        ? `That's ${avgValue > activeMetric.goal ? `${Math.round(avgValue - activeMetric.goal)}${activeMetric.unit} above` : `${Math.round(activeMetric.goal - avgValue)}${activeMetric.unit} below`} your target over the last ${view === "7d" ? "7" : "28"} days.`
                        : `Log your meals daily to see your personal performance insights appear here.`}
                </p>
            </div>
        </div>
    );
}

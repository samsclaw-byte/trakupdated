"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, TrendingUp, Trophy, Zap, Calendar, Crown } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface DailyNutrition {
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
    magnesium: number;
    iron: number;
    zinc: number;
    vitamin_c: number;
    vitamin_d: number;
    vitamin_b12: number;
    folate: number;
}

const MACRO_METRICS = [
    { key: "protein", label: "Protein", unit: "g", color: "bg-blue-400", textColor: "text-blue-400" },
    { key: "carbs", label: "Carbs", unit: "g", color: "bg-amber-400", textColor: "text-amber-400" },
    { key: "fat", label: "Fat", unit: "g", color: "bg-orange-400", textColor: "text-orange-400" },
    { key: "fibre", label: "Fibre", unit: "g", color: "bg-emerald-400", textColor: "text-emerald-400" },
];

const MICRO_METRICS = [
    { key: "sodium", label: "Sodium", unit: "mg", color: "bg-red-400", textColor: "text-red-400", target: 2300 },
    { key: "potassium", label: "Potassium", unit: "mg", color: "bg-purple-400", textColor: "text-purple-400", target: 3500 },
    { key: "calcium", label: "Calcium", unit: "mg", color: "bg-cyan-400", textColor: "text-cyan-400", target: 1000 },
    { key: "magnesium", label: "Magnesium", unit: "mg", color: "bg-teal-400", textColor: "text-teal-400", target: 375 },
    { key: "iron", label: "Iron", unit: "mg", color: "bg-rose-400", textColor: "text-rose-400", target: 14 },
    { key: "zinc", label: "Zinc", unit: "mg", color: "bg-indigo-400", textColor: "text-indigo-400", target: 10 },
    { key: "vitamin_c", label: "Vit C", unit: "mg", color: "bg-yellow-400", textColor: "text-yellow-400", target: 80 },
    { key: "vitamin_d", label: "Vit D", unit: "mcg", color: "bg-amber-500", textColor: "text-amber-500", target: 5 },
    { key: "vitamin_b12", label: "Vit B12", unit: "mcg", color: "bg-pink-400", textColor: "text-pink-400", target: 2.5 },
    { key: "folate", label: "Folate", unit: "mcg", color: "bg-lime-400", textColor: "text-lime-400", target: 200 },
];

export default function TrendsPage() {
    const [view, setView] = useState<"7d" | "28d">("7d");
    const [tab, setTab] = useState<"calories" | "macros" | "micros">("calories");
    const [chartData, setChartData] = useState<DailyNutrition[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [goal, setGoal] = useState(2400);
    const [streak, setStreak] = useState(0);
    const [isTrakPlus, setIsTrakPlus] = useState(false);
    const [activeDay, setActiveDay] = useState<number | null>(null);

    const supabase = useMemo(() => createClient(), []);

    useEffect(() => {
        const fetchTrends = async () => {
            setIsLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase
                .from('users')
                .select('daily_calories, weight, is_trak_plus')
                .eq('id', user.id)
                .single();

            if (profile?.daily_calories) setGoal(profile.daily_calories);
            if (profile?.is_trak_plus) setIsTrakPlus(profile.is_trak_plus);

            const days = view === "7d" ? 7 : 28;
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - (days - 1));
            startDate.setHours(0, 0, 0, 0);

            const { data: meals } = await supabase
                .from('meals')
                .select('calories, protein, carbs, fat, fibre, micronutrients, created_at')
                .eq('user_id', user.id)
                .gte('created_at', startDate.toISOString())
                .order('created_at', { ascending: true });

            type MealRow = { calories: number; protein: number; carbs: number; fat: number; fibre: number; micronutrients?: Record<string, number> | null; created_at: string };
            const dayMap: Record<string, Omit<DailyNutrition, 'date' | 'day'>> = {};

            for (const meal of ((meals ?? []) as MealRow[])) {
                const dateKey = new Date(meal.created_at).toLocaleDateString('en-CA');
                if (!dayMap[dateKey]) {
                    dayMap[dateKey] = { calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0, sodium: 0, potassium: 0, calcium: 0, magnesium: 0, iron: 0, zinc: 0, vitamin_c: 0, vitamin_d: 0, vitamin_b12: 0, folate: 0 };
                }
                dayMap[dateKey].calories += Number(meal.calories) || 0;
                dayMap[dateKey].protein += Number(meal.protein) || 0;
                dayMap[dateKey].carbs += Number(meal.carbs) || 0;
                dayMap[dateKey].fat += Number(meal.fat) || 0;
                dayMap[dateKey].fibre += Number(meal.fibre) || 0;
                if (meal.micronutrients) {
                    const m = meal.micronutrients;
                    dayMap[dateKey].sodium += Number(m.sodium) || 0;
                    dayMap[dateKey].potassium += Number(m.potassium) || 0;
                    dayMap[dateKey].calcium += Number(m.calcium) || 0;
                    dayMap[dateKey].magnesium += Number(m.magnesium) || 0;
                    dayMap[dateKey].iron += Number(m.iron) || 0;
                    dayMap[dateKey].zinc += Number(m.zinc) || 0;
                    dayMap[dateKey].vitamin_c += Number(m.vitamin_c) || 0;
                    dayMap[dateKey].vitamin_d += Number(m.vitamin_d) || 0;
                    dayMap[dateKey].vitamin_b12 += Number(m.vitamin_b12) || 0;
                    dayMap[dateKey].folate += Number(m.folate) || 0;
                }
            }

            const result: DailyNutrition[] = [];
            const today = new Date();
            let streakCount = 0;

            for (let i = days - 1; i >= 0; i--) {
                const d = new Date();
                d.setDate(today.getDate() - i);
                const dateKey = d.toLocaleDateString('en-CA');
                const dayLabel = view === "7d"
                    ? DAY_LABELS[d.getDay() === 0 ? 6 : d.getDay() - 1]
                    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                result.push({ date: dateKey, day: dayLabel, ...(dayMap[dateKey] ?? { calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0, sodium: 0, potassium: 0, calcium: 0, magnesium: 0, iron: 0, zinc: 0, vitamin_c: 0, vitamin_d: 0, vitamin_b12: 0, folate: 0 }) });
            }

            for (let i = result.length - 1; i >= 0; i--) {
                if (result[i].calories > 0) streakCount++;
                else break;
            }

            setStreak(streakCount);
            setChartData(result);
            setIsLoading(false);
        };

        fetchTrends();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [view]);

    const avgCalories = chartData.length > 0
        ? Math.round(chartData.filter(d => d.calories > 0).reduce((s, d) => s + d.calories, 0) / Math.max(chartData.filter(d => d.calories > 0).length, 1))
        : 0;

    const daysLogged = chartData.filter(d => d.calories > 0).length;

    return (
        <div className="flex flex-col min-h-screen bg-background pb-24">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-6 border-b border-white/5">
                <Link href="/dashboard">
                    <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/5 active:scale-90 transition-transform">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                </Link>
                <span className="text-sm font-bold uppercase tracking-[0.2em]">Nutrition Insights</span>
                <div className="w-10" />
            </div>

            <div className="px-6 py-6 space-y-6">
                {/* Time range toggle */}
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

                {/* Metric tab selector */}
                <div className="flex p-1 bg-white/5 border border-white/5 rounded-2xl">
                    {(["calories", "macros", "micros"] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => { if (t === "micros" && !isTrakPlus) return; setTab(t); }}
                            className={cn(
                                "flex-1 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1",
                                tab === t ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white",
                                t === "micros" && !isTrakPlus && "opacity-50"
                            )}
                        >
                            {t === "micros" && !isTrakPlus && <Crown className="w-3 h-3 text-amber-400" />}
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Stats summary bar */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="p-4 bg-white/5 border border-white/5 rounded-2xl text-center">
                        <p className="text-lg font-bold">{avgCalories > 0 ? avgCalories.toLocaleString() : "—"}</p>
                        <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mt-0.5">Avg kcal</p>
                    </div>
                    <div className="p-4 bg-white/5 border border-white/5 rounded-2xl text-center">
                        <p className="text-lg font-bold">{streak > 0 ? `${streak}d` : "—"}</p>
                        <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mt-0.5">Streak</p>
                    </div>
                    <div className="p-4 bg-white/5 border border-white/5 rounded-2xl text-center">
                        <p className="text-lg font-bold">{daysLogged}/{chartData.length}</p>
                        <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold mt-0.5">Days</p>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {tab === "calories" && (
                        <motion.div key="calories" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                            <CalorieChart data={chartData} goal={goal} view={view} isLoading={isLoading} activeDay={activeDay} setActiveDay={setActiveDay} avgCalories={avgCalories} />
                        </motion.div>
                    )}
                    {tab === "macros" && (
                        <motion.div key="macros" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
                            {MACRO_METRICS.map(m => (
                                <MacroMiniChart key={m.key} metric={m} data={chartData} view={view} isLoading={isLoading} />
                            ))}
                        </motion.div>
                    )}
                    {tab === "micros" && (
                        <motion.div key="micros" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
                            {MICRO_METRICS.map(m => (
                                <MacroMiniChart key={m.key} metric={m} data={chartData} view={view} isLoading={isLoading} target={m.target} />
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Summary card */}
                <div className="p-6 bg-emerald-gradient rounded-[2rem] text-brand-black">
                    <div className="flex items-start justify-between mb-4">
                        <Zap className="w-6 h-6 fill-current" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Summary</span>
                    </div>
                    <h3 className="text-xl font-bold tracking-tight mb-2">
                        {avgCalories > 0 ? `You averaged ${avgCalories.toLocaleString()} kcal` : "Start logging meals!"}
                    </h3>
                    <p className="text-sm font-medium opacity-70 leading-relaxed">
                        {avgCalories > 0
                            ? `${avgCalories > goal ? `${avgCalories - goal} kcal above` : `${goal - avgCalories} kcal below`} your ${goal.toLocaleString()} kcal target over ${view === "7d" ? "7" : "28"} days.`
                            : `Log your meals daily to see your personal performance insights appear here.`}
                    </p>
                </div>
            </div>
        </div>
    );
}

/* ── Calorie bar chart ─────────────────────────────────────────────────────── */
function CalorieChart({ data, goal, view, isLoading, activeDay, setActiveDay, avgCalories }: {
    data: DailyNutrition[];
    goal: number;
    view: "7d" | "28d";
    isLoading: boolean;
    activeDay: number | null;
    setActiveDay: (i: number | null) => void;
    avgCalories: number;
}) {
    const maxVal = Math.max(...data.map(d => d.calories), goal);
    return (
        <div className="p-6 bg-white/5 border border-white/5 rounded-[2rem] space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-2xl font-bold tracking-tight">{avgCalories > 0 ? avgCalories.toLocaleString() : "—"}</h3>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Avg Daily Calories</p>
                </div>
                {avgCalories > 0 && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-emerald/10 rounded-full">
                        <TrendingUp className="w-3 h-3 text-brand-emerald" />
                        <span className="text-[10px] font-bold text-brand-emerald">{Math.round((avgCalories / goal) * 100)}% of goal</span>
                    </div>
                )}
            </div>
            <div className={cn("flex items-end justify-between gap-1", view === "7d" ? "h-44" : "h-32")}>
                {isLoading ? (
                    Array.from({ length: view === "7d" ? 7 : 14 }).map((_, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-3">
                            <div className="w-full bg-white/5 rounded-lg animate-pulse" style={{ height: `${(i * 15) % 60 + 20}%` }} />
                        </div>
                    ))
                ) : (
                    data.map((d, i) => (
                        <button
                            key={i}
                            className="relative flex-1 flex flex-col items-center group"
                            onClick={() => setActiveDay(activeDay === i ? null : i)}
                        >
                            {activeDay === i && d.calories > 0 && (
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-brand-black border border-white/10 rounded-lg px-2 py-1 text-[9px] font-bold whitespace-nowrap z-10">
                                    {Math.round(d.calories).toLocaleString()} kcal
                                </div>
                            )}
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: d.calories > 0 ? `${(d.calories / maxVal) * 100}%` : "4px" }}
                                transition={{ duration: 0.8, delay: i * 0.04 }}
                                className={cn(
                                    "w-full rounded-lg transition-colors relative",
                                    d.calories > 0 ? "bg-brand-emerald/40 group-hover:bg-brand-emerald/70" : "bg-white/5"
                                )}
                            >
                                {d.calories >= goal && <div className="absolute top-0 left-0 right-0 h-[2px] bg-brand-emerald rounded-full" />}
                            </motion.div>
                            {view === "7d" && <span className="text-[9px] uppercase tracking-tighter text-muted-foreground mt-2 font-bold">{d.day}</span>}
                        </button>
                    ))
                )}
            </div>
            {/* Goal reference */}
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <div className="w-6 h-0.5 bg-brand-emerald rounded" />
                <span>At or above {goal.toLocaleString()} kcal goal</span>
            </div>
        </div>
    );
}

/* ── Macro / Micro mini chart ─────────────────────────────────────────────── */
function MacroMiniChart({ metric, data, view, isLoading, target }: {
    metric: { key: string; label: string; unit: string; color: string; textColor: string };
    data: DailyNutrition[];
    view: "7d" | "28d";
    isLoading: boolean;
    target?: number;
}) {
    const vals = data.map(d => (d as unknown as Record<string, number>)[metric.key] || 0);
    const maxVal = Math.max(...vals, target || 1);
    const avgVal = vals.filter(v => v > 0).length > 0
        ? vals.filter(v => v > 0).reduce((s, v) => s + v, 0) / vals.filter(v => v > 0).length
        : 0;

    return (
        <div className="p-5 bg-white/5 border border-white/5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${metric.color}`} />
                    <span className="text-sm font-bold">{metric.label}</span>
                </div>
                <div className="text-right">
                    <span className={`text-base font-bold ${metric.textColor}`}>
                        {avgVal > 0 ? `${Math.round(avgVal * 10) / 10}${metric.unit}` : "—"}
                    </span>
                    {target && <span className="text-[9px] text-muted-foreground ml-1">/ {target}{metric.unit}</span>}
                </div>
            </div>
            <div className={cn("flex items-end gap-1", view === "7d" ? "h-16" : "h-10")}>
                {isLoading ? (
                    Array.from({ length: view === "7d" ? 7 : 28 }).map((_, i) => (
                        <div key={i} className="flex-1 bg-white/5 rounded animate-pulse" style={{ height: `${(i * 15) % 60 + 20}%` }} />
                    ))
                ) : (
                    data.map((d, i) => {
                        const val = (d as unknown as Record<string, number>)[metric.key] || 0;
                        const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;
                        return (
                            <motion.div
                                key={i}
                                initial={{ height: 0 }}
                                animate={{ height: val > 0 ? `${pct}%` : "2px" }}
                                transition={{ duration: 0.6, delay: i * 0.03 }}
                                className={`flex-1 rounded ${val > 0 ? metric.color + " opacity-70 hover:opacity-100" : "bg-white/5"} transition-opacity`}
                                title={`${d.day}: ${Math.round(val * 10) / 10}${metric.unit}`}
                            />
                        );
                    })
                )}
            </div>
            {view === "7d" && (
                <div className="flex justify-between">
                    {data.map((d, i) => (
                        <span key={i} className="flex-1 text-center text-[8px] text-muted-foreground/50">{d.day}</span>
                    ))}
                </div>
            )}
        </div>
    );
}

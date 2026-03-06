"use client";

import { motion } from "framer-motion";
import { Trophy, Calendar, Crown } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import { PieChart, Pie, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts";

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
    magnesium: number;
    zinc: number;
    vitamin_d: number;
    vitamin_b12: number;
    folate: number;
}

export default function NutritionTrends() {
    const [view, setView] = useState<"7d" | "28d">("7d");
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
                    dataMap[dateKey] = { calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0, sodium: 0, potassium: 0, calcium: 0, magnesium: 0, iron: 0, zinc: 0, vitamin_c: 0, vitamin_d: 0, vitamin_b12: 0, folate: 0 };
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
                    dataMap[dateKey].magnesium += (meal.micronutrients.magnesium || 0);
                    dataMap[dateKey].iron += (meal.micronutrients.iron || 0);
                    dataMap[dateKey].zinc += (meal.micronutrients.zinc || 0);
                    dataMap[dateKey].vitamin_c += (meal.micronutrients.vitamin_c || 0);
                    dataMap[dateKey].vitamin_d += (meal.micronutrients.vitamin_d || 0);
                    dataMap[dateKey].vitamin_b12 += (meal.micronutrients.vitamin_b12 || 0);
                    dataMap[dateKey].folate += (meal.micronutrients.folate || 0);
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
                    magnesium: Math.round(entryData.magnesium || 0),
                    iron: Math.round((entryData.iron || 0) * 10) / 10,
                    zinc: Math.round((entryData.zinc || 0) * 10) / 10,
                    vitamin_c: Math.round(entryData.vitamin_c || 0),
                    vitamin_d: Math.round((entryData.vitamin_d || 0) * 10) / 10,
                    vitamin_b12: Math.round((entryData.vitamin_b12 || 0) * 10) / 10,
                    folate: Math.round(entryData.folate || 0),
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

    const activeDaysCount = Math.max(chartData.filter(d => d.calories > 0).length, 1);

    // Calorie averages for bar chart
    const maxCalories = Math.max(...chartData.map(d => Number(d.calories || 0)), goal * 1.2);
    const avgCalories = chartData.length > 0
        ? Math.round(chartData.filter(d => d.calories > 0).reduce((s, d) => s + Number(d.calories || 0), 0) / activeDaysCount)
        : 0;

    // Macro Averages for pie chart
    const avgProtein = Math.round(chartData.filter(d => d.calories > 0).reduce((s, d) => s + (d.protein || 0), 0) / activeDaysCount);
    const avgCarbs = Math.round(chartData.filter(d => d.calories > 0).reduce((s, d) => s + (d.carbs || 0), 0) / activeDaysCount);
    const avgFat = Math.round(chartData.filter(d => d.calories > 0).reduce((s, d) => s + (d.fat || 0), 0) / activeDaysCount);

    const macroData = [
        { name: 'Carbs', value: avgCarbs, color: '#fb923c', target: carbsTarget },
        { name: 'Protein', value: avgProtein, color: '#60a5fa', target: proteinTarget },
        { name: 'Fat', value: avgFat, color: '#c084fc', target: fatTarget },
    ].filter(d => d.value > 0);

    // Micro Averages for radar chart
    const avgSodium = chartData.filter(d => d.calories > 0).reduce((s, d) => s + (d.sodium || 0), 0) / activeDaysCount;
    const avgPotassium = chartData.filter(d => d.calories > 0).reduce((s, d) => s + (d.potassium || 0), 0) / activeDaysCount;
    const avgCalcium = chartData.filter(d => d.calories > 0).reduce((s, d) => s + (d.calcium || 0), 0) / activeDaysCount;
    const avgMagnesium = chartData.filter(d => d.calories > 0).reduce((s, d) => s + (d.magnesium || 0), 0) / activeDaysCount;
    const avgIron = chartData.filter(d => d.calories > 0).reduce((s, d) => s + (d.iron || 0), 0) / activeDaysCount;
    const avgZinc = chartData.filter(d => d.calories > 0).reduce((s, d) => s + (d.zinc || 0), 0) / activeDaysCount;
    const avgVitC = chartData.filter(d => d.calories > 0).reduce((s, d) => s + (d.vitamin_c || 0), 0) / activeDaysCount;
    const avgVitD = chartData.filter(d => d.calories > 0).reduce((s, d) => s + (d.vitamin_d || 0), 0) / activeDaysCount;
    const avgVitB12 = chartData.filter(d => d.calories > 0).reduce((s, d) => s + (d.vitamin_b12 || 0), 0) / activeDaysCount;
    const avgFolate = chartData.filter(d => d.calories > 0).reduce((s, d) => s + (d.folate || 0), 0) / activeDaysCount;

    const microData = [
        { subject: `Sodium (${MICRO_TARGETS.sodium}mg)`, value: Math.min((avgSodium / MICRO_TARGETS.sodium) * 100, 100) || 0, fullMark: 100 },
        { subject: `Potassium (${MICRO_TARGETS.potassium}mg)`, value: Math.min((avgPotassium / MICRO_TARGETS.potassium) * 100, 100) || 0, fullMark: 100 },
        { subject: `Calcium (${MICRO_TARGETS.calcium}mg)`, value: Math.min((avgCalcium / MICRO_TARGETS.calcium) * 100, 100) || 0, fullMark: 100 },
        { subject: `Magnesium (${MICRO_TARGETS.magnesium}mg)`, value: Math.min((avgMagnesium / MICRO_TARGETS.magnesium) * 100, 100) || 0, fullMark: 100 },
        { subject: `Iron (${MICRO_TARGETS.iron}mg)`, value: Math.min((avgIron / MICRO_TARGETS.iron) * 100, 100) || 0, fullMark: 100 },
        { subject: `Zinc (${MICRO_TARGETS.zinc}mg)`, value: Math.min((avgZinc / MICRO_TARGETS.zinc) * 100, 100) || 0, fullMark: 100 },
        { subject: `Vit C (${MICRO_TARGETS.vitamin_c}mg)`, value: Math.min((avgVitC / MICRO_TARGETS.vitamin_c) * 100, 100) || 0, fullMark: 100 },
        { subject: `Vit D (${MICRO_TARGETS.vitamin_d}mcg)`, value: Math.min((avgVitD / MICRO_TARGETS.vitamin_d) * 100, 100) || 0, fullMark: 100 },
        { subject: `Vit B12 (${MICRO_TARGETS.vitamin_b12}mcg)`, value: Math.min((avgVitB12 / MICRO_TARGETS.vitamin_b12) * 100, 100) || 0, fullMark: 100 },
        { subject: `Folate (${MICRO_TARGETS.folate}mcg)`, value: Math.min((avgFolate / MICRO_TARGETS.folate) * 100, 100) || 0, fullMark: 100 },
    ];

    const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#1a1a24] p-3 border border-white/10 rounded-xl shadow-2xl">
                    <p className="text-white text-xs font-bold font-mono">{`${payload[0].name} : ${payload[0].value}g`}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="px-6 py-8 space-y-8 pb-8">
            {/* Period Toggle */}
            <div className="flex p-1 bg-white/5 border border-white/5 rounded-2xl">
                {(["7d", "28d"] as const).map((v) => (
                    <button
                        key={v}
                        onClick={() => setView(v)}
                        className={cn(
                            "flex-1 py-3 text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all",
                            view === v ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white"
                        )}
                    >
                        {v === "7d" ? "7 Days" : "28 Days"}
                    </button>
                ))}
            </div>

            {/* Calories Vertical Bar Chart */}
            <div className="p-8 bg-[rgba(255,255,255,0.02)] border border-white/5 rounded-[2.5rem] shadow-[0_4px_40px_rgba(0,0,0,0.1)] backdrop-blur-3xl">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        {isLoading ? (
                            <div className="h-8 w-24 bg-white/5 rounded animate-pulse" />
                        ) : (
                            <h3 className="text-3xl font-black tracking-tight flex items-baseline gap-1">
                                {avgCalories > 0 ? avgCalories.toLocaleString() : "—"}<span className="text-sm text-muted-foreground font-medium">kcal</span>
                            </h3>
                        )}
                        <p className="text-[10px] uppercase tracking-widest font-bold text-brand-emerald">Avg Daily Calories</p>
                    </div>
                </div>

                <div className={cn("relative flex items-end justify-between gap-1 mt-6", view === "7d" ? "h-44" : "h-36")}>
                    <div className="absolute left-0 right-0 border-t border-dashed border-white/20 z-0 flex items-center transition-all duration-500" style={{ bottom: `${Math.min((goal / maxCalories) * 100, 100)}%` }}>
                        <span className="text-[8px] bg-background/80 px-1 text-muted-foreground/50 tracking-widest uppercase font-bold absolute -top-1.5 right-0 rounded">Target ({goal}kcal)</span>
                    </div>

                    {isLoading ? (
                        Array.from({ length: view === "7d" ? 7 : 14 }).map((_, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-3 h-full justify-end z-10"><div className="w-full bg-white/5 rounded-lg animate-pulse" style={{ height: `${(i * 15) % 60 + 20}%` }} /></div>
                        ))
                    ) : (
                        chartData.map((d, i) => {
                            const val = Number(d.calories || 0);
                            const activePct = (val / maxCalories) * 100;
                            return (
                                <div key={i} className="relative flex-1 flex flex-col items-center group h-full justify-end z-10 w-full min-w-[3px]">
                                    <motion.div
                                        initial={{ height: 0 }} animate={{ height: val > 0 ? `${activePct}%` : "4px" }} transition={{ duration: 0.5, delay: i * 0.02 }}
                                        className={cn("w-[90%] rounded-t-lg transition-all relative overflow-hidden", val > goal ? "bg-red-400/50 group-hover:bg-red-400/80" : val > 0 ? `bg-brand-emerald/50 group-hover:bg-brand-emerald/80` : "bg-white/5")}
                                    />
                                    {view === "7d" && <span className="text-[10px] uppercase tracking-tighter text-muted-foreground mt-3 font-bold shrink-0">{d.day}</span>}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Macros Donut Pie Chart */}
            <div className="p-8 bg-[rgba(255,255,255,0.02)] border border-white/5 rounded-[2.5rem] shadow-[0_4px_40px_rgba(0,0,0,0.1)] backdrop-blur-3xl flex flex-col items-center">
                <div className="w-full text-center space-y-1 mb-4">
                    <h3 className="text-xl font-black tracking-tight text-white">Macro Balance</h3>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Average Distribution</p>
                </div>

                {isLoading ? (
                    <div className="h-48 w-48 rounded-full bg-white/5 animate-pulse my-4" />
                ) : macroData.length > 0 ? (
                    <div className="w-full h-56 relative -my-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={macroData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value" stroke="none">
                                    {macroData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-xl font-bold tracking-tighter">{Math.round(avgProtein + avgCarbs + avgFat)}g</span>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-white/30 py-8 font-medium">No macro data available yet.</p>
                )}

                <div className="flex items-start justify-center gap-6 mt-4">
                    {macroData.map(m => (
                        <div key={m.name} className="flex flex-col items-center">
                            <div className="flex items-center gap-1.5 mb-1">
                                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: m.color }} />
                                <span className="text-xs font-bold text-white/80">{m.name}</span>
                            </div>
                            <span className="text-xs font-medium text-white/80">{m.value}g</span>
                            {m.name === 'Protein' && m.target && (
                                <span className="text-[9px] uppercase tracking-widest text-[#60a5fa] font-bold mt-1">
                                    {Math.round((m.value / m.target) * 100)}% of goal
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Micro Radar Web Chart */}
            <div className="p-8 bg-[rgba(255,255,255,0.02)] border border-white/5 rounded-[2.5rem] shadow-[0_4px_40px_rgba(0,0,0,0.1)] backdrop-blur-3xl relative overflow-hidden">
                {!profile.is_trak_plus && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-md z-20 flex flex-col items-center justify-center p-6 text-center border border-amber-500/20 rounded-[2.5rem]">
                        <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4 border border-amber-500/20">
                            <Crown className="w-8 h-8 text-amber-500" />
                        </div>
                        <h4 className="text-2xl font-black mb-2 text-white">Micronutrient Radar</h4>
                        <p className="text-sm text-white/60 mb-6 max-w-[250px]">See if your diet is structurally sound and instantly detect deficiencies with Trak+.</p>
                        <button className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold rounded-2xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                            Upgrade to Pro
                        </button>
                    </div>
                )}

                <div className="w-full text-center space-y-1 mb-4">
                    <h3 className="text-xl font-black tracking-tight flex items-center justify-center gap-2 text-white">
                        {!profile.is_trak_plus && <Crown className="w-4 h-4 text-amber-500" />}
                        Micronutrient Web
                    </h3>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">% of Target Hit</p>
                </div>

                <div className="w-full h-64 -ml-4">
                    {isLoading ? (
                        <div className="w-48 h-48 mx-auto rounded-full bg-white/5 animate-pulse my-4" />
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={microData}>
                                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 700, fontFamily: 'monospace' }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar
                                    name="Actual Hit"
                                    dataKey="value"
                                    stroke="#34d399"
                                    strokeWidth={2}
                                    fill="#34d399"
                                    fillOpacity={0.2}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Extra Stats Grid underneath */}
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
                                {chartData.filter(d => d.calories > 0).length} / {view === "7d" ? 7 : 28}
                            </h4>
                        )}
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Days Logged</p>
                    </div>
                </div>
            </div>

        </div>
    );
}

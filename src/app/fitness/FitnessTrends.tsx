"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Activity, Flame, Trophy, Dumbbell, Bike, Waves, MapPin as PersonStanding } from "lucide-react";
import { motion } from "framer-motion";

const getIconForWorkout = (type?: string | null) => {
    switch (type?.toLowerCase()) {
        case 'running': return <PersonStanding className="w-4 h-4 text-black" />;
        case 'swimming': return <Waves className="w-4 h-4 text-black" />;
        case 'cycling': return <Bike className="w-4 h-4 text-black" />;
        case 'weights': return <Dumbbell className="w-4 h-4 text-black" />;
        default: return <Activity className="w-4 h-4 text-black" />;
    }
};

export default function FitnessTrends() {
    const [timeframe, setTimeframe] = useState<7 | 28>(7);
    const [stats, setStats] = useState({
        totalWorkouts: 0,
        totalCalories: 0,
        activeDays: 0,
    });
    const [dailyData, setDailyData] = useState<{ date: Date; calories: number; didWorkout: boolean; type: string | null }[]>([]);

    // We import date-fns dynamically or just use simple math. 
    // For simplicity, we'll write a small helper since we can't guarantee date-fns is installed.
    const getDaysArray = (numDays: number) => {
        const arr = [];
        for (let i = 0; i < numDays; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            arr.push(d);
        }
        return arr;
    };

    useEffect(() => {
        const fetchTrends = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - timeframe + 1);

            const { data: workouts, error } = await supabase
                .from("workouts")
                .select("date, calories_burned, type")
                .eq("user_id", user.id)
                .gte("date", startDate.toISOString().split("T")[0])
                .lte("date", endDate.toISOString().split("T")[0]);

            if (error) {
                console.error("Error fetching fitness trends:", error);
                return;
            }

            // Aggregate stats
            let totalCals = 0;
            const uniqueDays = new Set<string>();

            workouts?.forEach(w => {
                totalCals += w.calories_burned;
                uniqueDays.add(w.date);
            });

            setStats({
                totalWorkouts: workouts?.length || 0,
                totalCalories: totalCals,
                activeDays: uniqueDays.size,
            });

            // Build grid data
            const days = getDaysArray(timeframe);
            const mappedData = days.map(day => {
                const dateStr = day.toISOString().split("T")[0];
                const daysWorkouts = workouts?.filter(w => w.date === dateStr) || [];
                return {
                    date: day,
                    calories: daysWorkouts.reduce((sum, w) => sum + w.calories_burned, 0),
                    didWorkout: daysWorkouts.length > 0,
                    type: daysWorkouts.length > 0 ? daysWorkouts[0].type : null
                };
            });

            setDailyData(mappedData);
        };

        fetchTrends();
    }, [timeframe]);

    const getWeekday = (date: Date) => {
        return date.toLocaleDateString("en-US", { weekday: "short" }).charAt(0);
    };

    return (
        <div className="space-y-6">
            {/* Timeframe Toggle */}
            <div className="flex bg-white/5 p-1 rounded-xl w-48 mx-auto -mt-2 mb-6 border border-white/10">
                <button
                    onClick={() => setTimeframe(7)}
                    className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${timeframe === 7
                        ? "bg-brand-emerald text-black shadow-sm"
                        : "text-muted-foreground hover:text-white"
                        }`}
                >
                    7 Days
                </button>
                <button
                    onClick={() => setTimeframe(28)}
                    className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${timeframe === 28
                        ? "bg-brand-emerald text-black shadow-sm"
                        : "text-muted-foreground hover:text-white"
                        }`}
                >
                    28 Days
                </button>
            </div>

            {/* Top Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                    <Activity className="w-5 h-5 text-brand-emerald mb-2" />
                    <div className="text-2xl font-bold text-white">{stats.totalWorkouts}</div>
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-1">Workouts</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                    <Flame className="w-5 h-5 text-amber-500 mb-2" />
                    <div className="text-2xl font-bold text-white flex items-baseline gap-1">
                        {stats.totalCalories}
                    </div>
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-1">Burned</div>
                </div>
            </div>

            {/* Consistency Heatmap */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-white flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-brand-emerald" />
                        Consistency
                    </h3>
                    <span className="text-xs font-medium text-brand-emerald bg-brand-emerald/10 px-2 py-1 rounded-full">
                        {stats.activeDays}/{timeframe} Days
                    </span>
                </div>

                <div className={`grid gap-2 ${timeframe === 7 ? "grid-cols-7" : "grid-cols-7"}`}>
                    {timeframe === 7 && dailyData.map((day, i) => (
                        <div key={i} className="flex flex-col items-center gap-2">
                            <span className="text-[10px] font-medium text-muted-foreground uppercase">
                                {getWeekday(day.date)}
                            </span>
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: i * 0.05 }}
                                className={`w-full aspect-square rounded-full flex items-center justify-center ${day.didWorkout
                                    ? "bg-brand-emerald shadow-[0_0_12px_rgba(34,197,94,0.4)]"
                                    : "bg-white/5 border border-white/10"
                                    }`}
                            >
                                {day.didWorkout && getIconForWorkout(day.type)}
                            </motion.div>
                        </div>
                    ))}

                    {timeframe === 28 && dailyData.map((day, i) => (
                        <motion.div
                            key={i}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: i * 0.01 }}
                            className={`w-full aspect-square rounded-md ${day.didWorkout
                                ? "bg-brand-emerald"
                                : "bg-white/5 border border-white/10"
                                }`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

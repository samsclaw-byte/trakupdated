"use client";

import { useState, useEffect } from "react";
import { Plus, Flame, Activity, Clock, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { ACTIVITIES } from "@/utils/METs";
import LogWorkoutModal from "./LogWorkoutModal";
import { WhoopRecoveryCard } from "@/components/ui/WhoopRecoveryCard";

export interface Workout {
    id: string;
    activity_type: string;
    intensity: string;
    duration_minutes: number;
    calories_burned: number;
    created_at: string;
    source?: string;
}

interface WhoopRecovery {
    recovery_score: number | null;
    hrv: number | null;
    resting_heart_rate: number | null;
    sleep_performance: number | null;
    strain: number | null;
}

export default function FitnessToday() {
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [whoopRecovery, setWhoopRecovery] = useState<WhoopRecovery | null>(null);
    const [viewDay, setViewDay] = useState<"today" | "yesterday">("today");
    const getDateStr = (offset: number) => {
        const d = new Date();
        d.setDate(d.getDate() + offset);
        return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
    };

    useEffect(() => {
        const fetchWorkouts = async () => {
            setIsLoading(true);
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const dateStr = viewDay === "today" ? getDateStr(0) : getDateStr(-1);

                const { data, error } = await supabase
                    .from("workouts")
                    .select("*")
                    .eq("user_id", user.id)
                    .eq("date", dateStr)
                    .order("created_at", { ascending: false });

                if (error) throw error;
                setWorkouts(data || []);
            } catch (error) {
                console.error("Error fetching workouts:", error);
            } finally {
                setIsLoading(false);
            }
        };

        const fetchWhoopRecovery = async () => {
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const dateStr = viewDay === "today" ? getDateStr(0) : getDateStr(-1);

                const { data } = await supabase
                    .from("whoop_daily")
                    .select("recovery_score, hrv, resting_heart_rate, sleep_performance, strain")
                    .eq("user_id", user.id)
                    .eq("date", dateStr)
                    .single();

                if (data) {
                    setWhoopRecovery(data);
                } else {
                    setWhoopRecovery(null);
                }
            } catch {
                setWhoopRecovery(null);
            }
        };

        fetchWorkouts();
        fetchWhoopRecovery();
    }, [viewDay]);

    const handleDeleteWorkout = async (id: string) => {
        try {
            const supabase = createClient();
            const { error } = await supabase.from("workouts").delete().eq("id", id);
            if (error) throw error;
            setWorkouts(workouts.filter((w) => w.id !== id));
        } catch (error) {
            console.error("Failed to delete workout:", error);
        }
    };

    const totalCaloriesBurned = workouts.reduce((sum, w) => sum + w.calories_burned, 0);

    return (
        <div className="space-y-6 pb-32">
            {/* Today / Yesterday Toggle */}
            <div className="flex items-center justify-center">
                <div className="flex bg-white/5 border border-white/10 rounded-2xl p-1 gap-1">
                    {(["today", "yesterday"] as const).map(day => (
                        <button
                            key={day}
                            onClick={() => setViewDay(day)}
                            className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${viewDay === day
                                    ? "bg-brand-emerald text-brand-black"
                                    : "text-muted-foreground hover:text-white"
                                }`}
                        >
                            {day}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Active Burn Ring */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 relative overflow-hidden backdrop-blur-xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-emerald/10 blur-[50px] rounded-full translate-x-1/2 -translate-y-1/2" />

                <div className="flex flex-col items-center justify-center text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-brand-emerald/20 flex items-center justify-center mb-2">
                        <Flame className="w-6 h-6 text-brand-emerald" />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        {viewDay === "today" ? "Active Burn" : "Yesterday's Burn"}
                    </span>
                    <div className="text-5xl font-bold tracking-tighter text-white">
                        {totalCaloriesBurned}
                        <span className="text-xl text-brand-emerald ml-1">kcal</span>
                    </div>
                </div>
            </div>

            {/* Whoop Recovery Card */}
            {whoopRecovery && (
                <WhoopRecoveryCard
                    recoveryScore={whoopRecovery.recovery_score}
                    hrv={whoopRecovery.hrv}
                    restingHR={whoopRecovery.resting_heart_rate}
                    sleepPerformance={whoopRecovery.sleep_performance}
                    strain={whoopRecovery.strain}
                />
            )}

            {/* Logged Workouts List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
                        {viewDay === "today" ? "Today's Activity" : "Yesterday's Activity"}
                    </h3>
                </div>

                <AnimatePresence mode="popLayout">
                    {workouts.length === 0 && !isLoading ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-white/5 border border-white/10 border-dashed rounded-2xl p-8 text-center"
                        >
                            <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
                            <p className="text-sm text-muted-foreground">No workouts logged yet today.</p>
                        </motion.div>
                    ) : (
                        workouts.map((workout) => {
                            const ActivityConfig = ACTIVITIES.find(a => a.id === workout.activity_type) || ACTIVITIES[0];
                            const Icon = ActivityConfig.icon;

                            return (
                                <motion.div
                                    key={workout.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-brand-emerald/10 flex items-center justify-center shrink-0">
                                        <Icon className="w-6 h-6 text-brand-emerald" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-white truncate">
                                            {ActivityConfig.name}
                                        </h4>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {workout.duration_minutes}m
                                            </span>
                                            <span className="capitalize">• {workout.intensity}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className="font-bold text-brand-emerald">
                                            {workout.calories_burned} kcal
                                        </span>
                                        {viewDay === "today" && (
                                            <button
                                                onClick={() => handleDeleteWorkout(workout.id)}
                                                className="text-muted-foreground hover:text-red-400 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </AnimatePresence>
            </div>

            {/* Floating Action Button — only on today */}
            {viewDay === "today" && (
                <div className="fixed bottom-28 right-6 z-40">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsModalOpen(true)}
                        className="w-14 h-14 bg-brand-emerald hover:bg-brand-emerald/90 text-black rounded-full shadow-[0_4px_20px_rgba(34,197,94,0.4)] flex items-center justify-center transition-colors"
                    >
                        <Plus className="w-6 h-6" />
                    </motion.button>
                </div>
            )}

            <LogWorkoutModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onLogged={(newWorkout: Workout) => {
                    setWorkouts([newWorkout, ...workouts]);
                    setIsModalOpen(false);
                }}
            />
        </div>
    );
}

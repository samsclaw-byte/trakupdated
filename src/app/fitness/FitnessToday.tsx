"use client";

import { useState, useEffect } from "react";
import { Plus, Flame, Activity, Clock, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { ACTIVITIES } from "@/utils/METs";
import LogWorkoutModal from "./LogWorkoutModal";

export interface Workout {
    id: string;
    activity_type: string;
    intensity: string;
    duration_minutes: number;
    calories_burned: number;
    created_at: string;
}

export default function FitnessToday() {
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    useEffect(() => {
        const fetchWorkouts = async () => {
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                // Fetch explicitly for today in the user's timezone
                const now = new Date();
                const todayStr = new Date(now.getTime() - (now.getTimezoneOffset() * 60000))
                    .toISOString()
                    .split("T")[0];

                const { data, error } = await supabase
                    .from("workouts")
                    .select("*")
                    .eq("user_id", user.id)
                    .eq("date", todayStr)
                    .order("created_at", { ascending: false });

                if (error) throw error;
                setWorkouts(data || []);
            } catch (error) {
                console.error("Error fetching workouts:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchWorkouts();
    }, []);

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
        <div className="space-y-6">
            {/* Main Active Burn Ring */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 relative overflow-hidden backdrop-blur-xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-emerald/10 blur-[50px] rounded-full translate-x-1/2 -translate-y-1/2" />

                <div className="flex flex-col items-center justify-center text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-brand-emerald/20 flex items-center justify-center mb-2">
                        <Flame className="w-6 h-6 text-brand-emerald" />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Active Burn
                    </span>
                    <div className="text-5xl font-bold tracking-tighter text-white">
                        {totalCaloriesBurned}
                        <span className="text-xl text-brand-emerald ml-1">kcal</span>
                    </div>
                </div>
            </div>
            {/* Logged Workouts List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
                        Today&apos;s Activity
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
                                        <button
                                            onClick={() => handleDeleteWorkout(workout.id)}
                                            className="text-muted-foreground hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </AnimatePresence>
            </div >

            {/* Floating Action Button */}
            < div className="fixed bottom-28 right-6" >
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsModalOpen(true)}
                    className="w-14 h-14 bg-brand-emerald hover:bg-brand-emerald/90 text-black rounded-full shadow-[0_4px_20px_rgba(34,197,94,0.4)] flex items-center justify-center transition-colors"
                >
                    <Plus className="w-6 h-6" />
                </motion.button>
            </div >

            <LogWorkoutModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onLogged={(newWorkout: Workout) => {
                    setWorkouts([newWorkout, ...workouts]);
                    setIsModalOpen(false);
                }}
            />
        </div >
    );
}

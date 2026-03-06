"use client";

import { useState, useEffect } from "react";
import { X, Activity, Flame, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ACTIVITIES, Intensity, calculateCaloriesBurned } from "@/utils/METs";
import { createClient } from "@/utils/supabase/client";
import { Workout } from "./FitnessToday";
import { logSquadEvent } from "@/utils/squads";

interface LogWorkoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLogged: (workout: Workout) => void;
}

export default function LogWorkoutModal({ isOpen, onClose, onLogged }: LogWorkoutModalProps) {
    const [selectedActivity, setSelectedActivity] = useState(ACTIVITIES[0].id);
    const [duration, setDuration] = useState("30");
    const [intensity, setIntensity] = useState<Intensity>("Medium");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [estimatedBurn, setEstimatedBurn] = useState(0);
    const [userWeight, setUserWeight] = useState(80); // Default fallback
    const [dateOffset, setDateOffset] = useState<0 | 1>(0); // 0 = today, 1 = yesterday

    // fetch user weight on mount
    // Fetch user weight on mount to accurately calculate METs
    useEffect(() => {
        const fetchWeight = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from("users").select("weight").eq("id", user.id).single();
                if (data?.weight) {
                    setUserWeight(data.weight);
                }
            }
        };
        fetchWeight();
    }, []);

    // Update real-time estimated burn
    useEffect(() => {
        const durMint = parseInt(duration) || 0;
        const cals = calculateCaloriesBurned(selectedActivity, intensity, durMint, userWeight);
        setEstimatedBurn(cals);
    }, [selectedActivity, duration, intensity, userWeight]);

    if (!isOpen) return null;

    const handleLog = async () => {
        setIsSubmitting(true);
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not logged in");

            const durMint = parseInt(duration) || 30;

            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() - dateOffset);
            const dateStr = new Date(targetDate.getTime() - (targetDate.getTimezoneOffset() * 60000)).toISOString().split("T")[0];

            const { data, error } = await supabase
                .from("workouts")
                .insert({
                    user_id: user.id,
                    date: dateStr,
                    activity_type: selectedActivity,
                    intensity: intensity,
                    duration_minutes: durMint,
                    calories_burned: estimatedBurn
                })
                .select()
                .single();

            if (error) throw error;

            // Log squad event for workout completed
            const activityName = ACTIVITIES.find(a => a.id === selectedActivity)?.name || "Workout";
            logSquadEvent(user.id, "workout_completed", {
                activity: activityName,
                calories: estimatedBurn
            });

            onLogged(data);
        } catch (error) {
            console.error("Failed to log workout:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="relative w-full max-w-lg bg-[#111] border border-white/10 rounded-t-3xl sm:rounded-3xl p-6 pb-24 sm:pb-6 shadow-2xl overflow-y-auto max-h-[90vh]"
                >
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-brand-emerald" />
                            <h2 className="text-xl font-bold">Log Workout</h2>
                        </div>
                        <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-muted-foreground hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-8">
                        {/* 1. Activity Selection */}
                        <div className="space-y-4">
                            <label className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Activity Type</label>
                            <div className="grid grid-cols-4 gap-3">
                                {ACTIVITIES.map((activity) => {
                                    const Icon = activity.icon;
                                    const isSelected = selectedActivity === activity.id;
                                    return (
                                        <button
                                            key={activity.id}
                                            onClick={() => setSelectedActivity(activity.id)}
                                            className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${isSelected
                                                ? "bg-brand-emerald/10 border-brand-emerald text-brand-emerald"
                                                : "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10 hover:text-white"
                                                }`}
                                        >
                                            <Icon className="w-6 h-6 mb-2" />
                                            <span className="text-[10px] font-medium leading-tight text-center px-1">
                                                {activity.name}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 2. Duration */}
                        <div className="space-y-4">
                            <label className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Duration (Minutes)</label>
                            <input
                                type="number"
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                min="1"
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white font-medium focus:outline-none focus:ring-1 focus:ring-brand-emerald transition-shadow text-lg"
                                placeholder="30"
                            />
                        </div>

                        {/* 3. Intensity */}
                        <div className="space-y-4">
                            <label className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Intensity Rate</label>
                            <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
                                {["Light", "Medium", "Intense"].map((lvl) => (
                                    <button
                                        key={lvl}
                                        onClick={() => setIntensity(lvl as Intensity)}
                                        className={`flex-1 py-3 text-sm font-medium rounded-lg transition-colors ${intensity === lvl
                                            ? "bg-white/10 text-white shadow-sm"
                                            : "text-muted-foreground hover:text-white"
                                            }`}
                                    >
                                        {lvl}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 4. Date */}
                        <div className="space-y-4">
                            <label className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Date</label>
                            <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
                                <button
                                    onClick={() => setDateOffset(0)}
                                    className={`flex-1 py-3 text-sm font-medium rounded-lg transition-colors ${dateOffset === 0
                                        ? "bg-white/10 text-white shadow-sm"
                                        : "text-muted-foreground hover:text-white"
                                        }`}
                                >
                                    Today
                                </button>
                                <button
                                    onClick={() => setDateOffset(1)}
                                    className={`flex-1 py-3 text-sm font-medium rounded-lg transition-colors ${dateOffset === 1
                                        ? "bg-white/10 text-white shadow-sm"
                                        : "text-muted-foreground hover:text-white"
                                        }`}
                                >
                                    Yesterday
                                </button>
                            </div>
                        </div>

                        {/* Real-time Calculation Display */}
                        <div className="bg-brand-emerald/10 border border-brand-emerald/20 rounded-2xl p-4 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-brand-emerald/20 flex items-center justify-center shrink-0">
                                <Flame className="w-6 h-6 text-brand-emerald" />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-widest text-brand-emerald">Estimated Burn</h4>
                                <div className="text-2xl font-bold text-white flex items-baseline gap-1">
                                    {estimatedBurn} <span className="text-sm font-medium text-brand-emerald/80">kcal</span>
                                </div>
                            </div>
                        </div>

                        {/* Action List */}
                        <div className="pt-4">
                            <button
                                onClick={handleLog}
                                disabled={isSubmitting || !duration || parseInt(duration) <= 0}
                                className="w-full h-14 bg-brand-emerald hover:bg-brand-emerald/90 text-black font-bold text-lg rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "Save Workout"}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Check, Activity, Target, Zap, Scale, ArrowRight } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";

interface UserMetrics {
    bmr: number | null;
    daily_calories: number | null;
    weight: number | null;
    height: number | null;
    activity_level: number | null;
}

export default function CalibrationCompletePage() {
    const router = useRouter();
    const [metrics, setMetrics] = useState<UserMetrics | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchMetrics = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('users')
                    .select('bmr, daily_calories, weight, height, activity_level')
                    .eq('id', user.id)
                    .single();

                if (data) {
                    setMetrics(data);
                }
            }
            setIsLoading(false);
        };
        fetchMetrics();
    }, []);

    const calculateBMI = (weightKg?: number | null, heightCm?: number | null) => {
        if (!weightKg || !heightCm) return { value: 0, label: "Unknown" };
        const heightM = heightCm / 100;
        const bmi = weightKg / (heightM * heightM);
        let label = "Normal";
        if (bmi < 18.5) label = "Underweight";
        else if (bmi >= 25 && bmi < 30) label = "Overweight";
        else if (bmi >= 30) label = "Obese";
        return { value: bmi.toFixed(1), label };
    };

    const getActivityLabel = (level?: number | null) => {
        switch (level) {
            case 1: return "Sedentary";
            case 2: return "Lightly Active";
            case 3: return "Moderately Active";
            case 4: return "Very Active";
            case 5: return "High Performance";
            default: return "Unknown";
        }
    };

    const renderGauge = () => {
        return (
            <div className="relative w-64 h-64 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                    <circle
                        cx="128" cy="128" r="120"
                        className="stroke-white/10 fill-none"
                        strokeWidth="4" strokeDasharray="4 8"
                    />
                    <motion.circle
                        cx="128" cy="128" r="120"
                        className="stroke-brand-emerald fill-none drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                        strokeWidth="4" strokeLinecap="round" strokeDasharray="4 8"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 2, ease: "easeOut", delay: 0.5 }}
                    />
                </svg>
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 1, type: "spring" }}
                    className="flex flex-col items-center justify-center text-center z-10"
                >
                    <span className="text-sm font-bold uppercase tracking-[0.2em] text-brand-emerald mb-2">Daily Engine</span>
                    <span className="text-6xl font-bold tracking-tighter text-white">
                        {metrics?.daily_calories || 0}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1">kcal Target</span>
                </motion.div>

                {/* Decorative rotating elements */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-4 rounded-full border border-white/5 border-t-brand-emerald/30 border-r-brand-emerald/30"
                />
            </div>
        );
    };

    return (
        <div className="flex flex-col min-h-screen bg-brand-black text-white p-6 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(16,185,129,0.05)_0%,transparent_70%)] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center gap-3 pt-8 pb-4"
            >
                <div className="w-8 h-8 rounded-full bg-brand-emerald/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-brand-emerald" />
                </div>
                <h1 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Calibration Complete</h1>
            </motion.div>

            {isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-brand-emerald/50 border-t-brand-emerald rounded-full animate-spin" />
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center max-w-md mx-auto w-full pt-8 pb-32">

                    {/* Main Gauge Hero */}
                    <div className="mb-12">
                        {renderGauge()}
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 w-full mb-8">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.2 }}
                            className="bg-white/5 border border-white/5 p-4 rounded-3xl flex flex-col"
                        >
                            <div className="flex items-center gap-2 mb-3 text-brand-emerald">
                                <Zap className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">BMR Baseline</span>
                            </div>
                            <span className="text-2xl font-bold">{metrics?.bmr || 0}</span>
                            <span className="text-xs text-muted-foreground">kcal at rest</span>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.4 }}
                            className="bg-white/5 border border-white/5 p-4 rounded-3xl flex flex-col"
                        >
                            <div className="flex items-center gap-2 mb-3 text-blue-400">
                                <Activity className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">BMI Index</span>
                            </div>
                            <span className="text-2xl font-bold">{calculateBMI(metrics?.weight, metrics?.height).value}</span>
                            <span className="text-xs text-muted-foreground">{calculateBMI(metrics?.weight, metrics?.height).label}</span>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.6 }}
                            className="bg-white/5 border border-white/5 p-4 rounded-3xl flex flex-col"
                        >
                            <div className="flex items-center gap-2 mb-3 text-orange-400">
                                <Scale className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Starting Weight</span>
                            </div>
                            <span className="text-2xl font-bold">{metrics?.weight || 0}</span>
                            <span className="text-xs text-muted-foreground">kg logged</span>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.8 }}
                            className="bg-white/5 border border-white/5 p-4 rounded-3xl flex flex-col"
                        >
                            <div className="flex items-center gap-2 mb-3 text-purple-400">
                                <Target className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Activity Tier</span>
                            </div>
                            <span className="text-2xl font-bold">Level {metrics?.activity_level || 1}</span>
                            <span className="text-xs text-muted-foreground capitalize truncate">{getActivityLabel(metrics?.activity_level)}</span>
                        </motion.div>
                    </div>

                    {/* Research Quote */}
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2 }}
                        className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-center mt-auto"
                    >
                        <p className="text-xs text-muted-foreground leading-relaxed italic">
                            &quot;Research indicates that individuals who consistently track quantifiable progress are <span className="text-white font-bold not-italic">42% more likely to achieve their goals</span> than those who rely solely on memory.&quot;
                        </p>
                    </motion.div>

                </div>
            )}

            {/* Sticky Bottom Action */}
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.5, type: "spring" }}
                className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent z-50 pointer-events-none"
            >
                <div className="max-w-md mx-auto pointer-events-auto">
                    <button
                        onClick={() => router.push("/nutrition")}
                        disabled={isLoading}
                        className="w-full py-5 bg-brand-emerald text-brand-black font-bold rounded-2xl flex items-center justify-center gap-3 transition-all hover:brightness-110 active:scale-95 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
                    >
                        INITIALIZE DASHBOARD
                        <ArrowRight className="w-5 h-5" />
                    </button>
                    <p className="text-[10px] text-center mt-4 uppercase tracking-widest text-muted-foreground font-medium">
                        Metrics established using Mifflin-St Jeor engine.
                    </p>
                </div>
            </motion.div>
        </div>
    );
}

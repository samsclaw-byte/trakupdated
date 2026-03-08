"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { X, Target, Zap, Activity, Dumbbell, Scale } from "lucide-react";

interface WeeklyReviewProps {
    isOpen: boolean;
    onClose: () => void;
    onCompleted: (newWeight: number, newGoal: number) => void;
}

export function WeeklyReviewOverlay({ isOpen, onClose, onCompleted }: WeeklyReviewProps) {
    const [step, setStep] = useState<'input' | 'scanning' | 'results'>('input');
    const [weightInput, setWeightInput] = useState("");
    const [weightUnit, setWeightUnit] = useState<"kg" | "lb">("kg");

    // Original DB stats
    const [baseMetrics, setBaseMetrics] = useState<{
        weight: number;
        bmr: number;
        activity_level: number;
        is_trak_plus: boolean;
    } | null>(null);

    // Recalculated results
    const [results, setResults] = useState<{
        newBmr: number;
        newTdee: number;
        protein: number;
    } | null>(null);

    useEffect(() => {
        if (!isOpen) return;

        const fetchMetrics = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('users')
                    .select('weight, bmr, activity_level, is_trak_plus')
                    .eq('id', user.id)
                    .single();
                if (data) {
                    setBaseMetrics(data);
                    setWeightInput(data.weight ? data.weight.toString() : "");
                }
            }
        };
        fetchMetrics();
        setStep('input');
    }, [isOpen]);

    const handleRecalibrate = async () => {
        if (!weightInput || !baseMetrics) return;

        const inputW = parseFloat(weightInput);
        const newWeightKg = weightUnit === 'lb' ? inputW * 0.453592 : inputW;

        // Mathematical Delta Recalibration: 
        // Mifflin-St Jeor Equation: BMR = 10W + 6.25H - 5A + GenderOffset
        // Since H, A, Gender are constant over a week: ΔBMR = 10 * (New_W - Old_W)
        const weightDelta = newWeightKg - baseMetrics.weight;
        const newBmr = Math.round(baseMetrics.bmr + (10 * weightDelta));

        const multipliers: Record<number, number> = { 1: 1.2, 2: 1.375, 3: 1.55, 4: 1.725, 5: 1.9 };
        const activityMultiplier = multipliers[baseMetrics.activity_level] || 1.55;
        const newTdee = Math.round(newBmr * activityMultiplier);

        // Protein rule: 1.8g per kg
        const proteinTarget = Math.round(newWeightKg * 1.8);

        setResults({ newBmr, newTdee, protein: proteinTarget });
        setStep('scanning');

        // Simulate scanning delay
        setTimeout(async () => {
            // Save to DB
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
                await supabase.from('users').update({
                    weight: Math.round(newWeightKg * 10) / 10,
                    bmr: newBmr,
                    daily_calories: newTdee,
                    last_weigh_in_date: today
                }).eq('id', user.id);
            }
            setStep('results');
        }, 1500);
    };

    const handleConfirm = () => {
        if (results && baseMetrics) {
            onCompleted(parseFloat(weightInput), results.newTdee);
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-brand-black/90 backdrop-blur-xl flex flex-col justify-end overflow-hidden"
            >
                {/* Background Grid Pattern */}
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10 pointer-events-none" />

                <div className="relative w-full max-w-md mx-auto h-[85vh] bg-brand-black border border-white/10 rounded-t-[40px] p-6 shadow-2xl flex flex-col overflow-hidden">
                    <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/5 rounded-full hover:bg-white/10 transition">
                        <X className="w-5 h-5 text-white/50" />
                    </button>

                    <div className="mt-8 mb-4 text-center">
                        <span className="text-xs font-bold uppercase tracking-widest text-brand-emerald mb-2 block">Sunday Check-in</span>
                        <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Recalibrate Engine</h2>
                        <p className="text-sm text-muted-foreground mx-auto max-w-xs">
                            Update your biometrics to keep your daily macro and BMR targets perfectly aligned.
                        </p>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center -mt-8 relative">
                        {step === 'input' && (
                            <motion.div
                                key="input"
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0, filter: "blur(10px)" }}
                                className="w-full flex flex-col items-center"
                            >
                                <div className="relative w-full mb-8">
                                    <input
                                        type="number"
                                        value={weightInput}
                                        onChange={(e) => setWeightInput(e.target.value)}
                                        className="w-full bg-transparent text-center text-[80px] font-black tracking-tighter text-white focus:outline-none focus:ring-0 placeholder-white/10"
                                        placeholder="0.0"
                                        autoFocus
                                    />
                                    <button
                                        onClick={() => setWeightUnit(w => w === 'kg' ? 'lb' : 'kg')}
                                        className="absolute right-8 top-1/2 -translate-y-1/2 text-xl font-bold text-brand-emerald bg-brand-emerald/10 px-4 py-2 rounded-2xl"
                                    >
                                        {weightUnit.toUpperCase()}
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 'scanning' && (
                            <motion.div
                                key="scanning"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="w-full flex flex-col items-center justify-center relative"
                            >
                                <div className="absolute inset-0 flex items-center justify-center">
                                    {/* Radar Sweep Effect */}
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                        className="w-64 h-64 rounded-full border border-brand-emerald/20 border-t-brand-emerald/80"
                                        style={{ background: "conic-gradient(from 0deg, transparent 0deg, rgba(16,185,129,0.15) 360deg)" }}
                                    />
                                </div>
                                <Activity className="w-12 h-12 text-brand-emerald animate-pulse relative z-10 mb-4" />
                                <motion.div
                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                    transition={{ duration: 0.8, repeat: Infinity }}
                                    className="text-brand-emerald font-mono text-sm tracking-widest uppercase z-10"
                                >
                                    Analyzing Mass...
                                </motion.div>
                            </motion.div>
                        )}

                        {step === 'results' && results && (
                            <motion.div
                                key="results"
                                initial={{ scale: 1.1, opacity: 0, filter: "blur(10px)" }}
                                animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
                                transition={{ type: "spring", bounce: 0.4 }}
                                className="w-full flex flex-col gap-4 px-2"
                            >
                                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-emerald to-transparent opacity-50" />

                                    <div className="flex justify-between items-center mb-6">
                                        <div className="flex items-center gap-3 text-brand-emerald">
                                            <Zap className="w-5 h-5" />
                                            <span className="text-xs font-bold uppercase tracking-widest">BMR Baseline</span>
                                        </div>
                                        <span className="text-2xl font-bold">{results.newBmr}</span>
                                    </div>

                                    <div className="flex justify-between items-center mb-6">
                                        <div className="flex items-center gap-3 text-blue-400">
                                            <Target className="w-5 h-5" />
                                            <span className="text-xs font-bold uppercase tracking-widest">New Target</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-3xl font-black">{results.newTdee}</span>
                                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest block font-bold">kcal/day</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center pt-6 border-t border-white/10">
                                        <div className="flex items-center gap-3 text-orange-400">
                                            <Dumbbell className="w-5 h-5" />
                                            <span className="text-xs font-bold uppercase tracking-widest">Protein Floor</span>
                                        </div>
                                        <span className="text-xl font-bold">{results.protein}g</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Bottom Action */}
                    <div className="w-full mt-auto">
                        {step === 'input' ? (
                            <button
                                onClick={handleRecalibrate}
                                disabled={!weightInput}
                                className="w-full py-5 bg-brand-emerald text-brand-black font-bold rounded-2xl flex items-center justify-center transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:grayscale shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                            >
                                RECALIBRATE ENGINE
                            </button>
                        ) : step === 'results' ? (
                            <button
                                onClick={handleConfirm}
                                className="w-full py-5 bg-brand-emerald text-brand-black font-bold rounded-2xl flex items-center justify-center transition-all hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                            >
                                CONFIRM & DOMINATE WEEK
                            </button>
                        ) : (
                            <button disabled className="w-full py-5 bg-white/5 text-white/30 font-bold rounded-2xl flex items-center justify-center">
                                PROCESSING...
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

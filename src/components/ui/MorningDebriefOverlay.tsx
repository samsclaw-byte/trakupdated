/* eslint-disable */
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Dumbbell, Leaf, Zap, Crown } from "lucide-react";
import confetti from "canvas-confetti";
import { createClient } from "@/utils/supabase/client";
import { calculateDebriefData, DebriefStats } from "@/utils/debriefData";
import { ProfileBadgeCard } from "./ProfileBadgeCard";

// 4 phases for the debrief animation sequence
type DebriefPhase = "LOADING" | "ODOMETER" | "MAX_CHECK" | "SUPERNOVA" | "DONE";

export function MorningDebriefOverlay() {
    const [phase, setPhase] = useState<DebriefPhase>("DONE");
    const [stats, setStats] = useState<DebriefStats | null>(null);
    const [userProfile, setUserProfile] = useState<any>(null);

    // Odometer spinning values
    const [displayHabitStreak, setDisplayHabitStreak] = useState(0);
    const [displayFitnessStreak, setDisplayFitnessStreak] = useState(0);
    const [displayNutritionStreak, setDisplayNutritionStreak] = useState(0);

    const checkDebrief = async () => {
        try {
            const todayStr = new Date().toLocaleDateString();
            const lastDebrief = localStorage.getItem("trak_last_debrief_date");

            // If they already saw it today, don't show it again.
            if (lastDebrief === todayStr) return;

            // Trigger overlay
            setPhase("LOADING");
            document.body.style.overflow = "hidden"; // Prevent scrolling behind

            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setPhase("DONE");
                document.body.style.overflow = "auto";
                return;
            }

            // Fetch user basics for the profile card
            const { data: profile } = await supabase.from('users').select('name, created_at, member_number, is_trak_plus').eq('id', user.id).single();
            setUserProfile(profile || { name: user.user_metadata?.full_name || 'User', created_at: user.created_at, member_number: 1, is_trak_plus: false });

            // Calculate debrief
            const debriefData = await calculateDebriefData(supabase, user.id);
            setStats(debriefData);

            // Seed odometer starting values (Current Streak minus 1, to simulate rolling upward)
            setDisplayHabitStreak(Math.max(0, debriefData.habits.currentStreak - 1));
            setDisplayFitnessStreak(Math.max(0, debriefData.fitness.currentStreak - 1));
            setDisplayNutritionStreak(Math.max(0, debriefData.nutrition.currentStreak - 1));

            // Move to Phase 2: Odometer (Floor stats)
            setTimeout(() => setPhase("ODOMETER"), 1200);

        } catch (e) {
            console.error("Debrief failed to load:", e);
            setPhase("DONE");
            document.body.style.overflow = "auto";
        }
    };

    useEffect(() => {
        checkDebrief();
    }, []);

    // Animation Choreography Engine
    useEffect(() => {
        if (!stats) return;

        if (phase === "ODOMETER") {
            // Spin up the bottom numbers
            setTimeout(() => {
                setDisplayHabitStreak(stats.habits.currentStreak);
                setDisplayFitnessStreak(stats.fitness.currentStreak);
                setDisplayNutritionStreak(stats.nutrition.currentStreak);

                // Add soft haptic vibration if supported
                if (navigator.vibrate) navigator.vibrate(50);
            }, 800);

            // Move to Max Check Phase
            setTimeout(() => {
                const maxesBroken = stats.habits.bestIncreased || stats.fitness.bestIncreased;
                if (maxesBroken) {
                    setPhase("MAX_CHECK");
                } else {
                    // Nothing big happened, ready to dismiss
                    // Wait for user to explicitly click "Let's Go" before dismissing.
                }
            }, 2500);
        }

        if (phase === "MAX_CHECK") {
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]); // Heavier thumb

            // Move to Supernova Phase or Stop
            setTimeout(() => {
                if (stats.newBadgePillar) {
                    setPhase("SUPERNOVA");
                }
            }, 3000);
        }

        if (phase === "SUPERNOVA") {
            // Trigger FIFA Pack Explosion
            const colors = {
                nutrition: ['#34d399', '#059669'], // emerald
                fitness: ['#60a5fa', '#2563eb'], // blue
                habits: ['#c084fc', '#7e22ce'] // purple
            };
            const activeColors = stats.newBadgePillar ? colors[stats.newBadgePillar] : ['#fbbf24', '#d97706']; // gold

            confetti({
                particleCount: 150,
                spread: 80,
                origin: { y: 0.6 },
                colors: activeColors,
                disableForReducedMotion: true
            });
            if (navigator.vibrate) navigator.vibrate([200, 100, 300]);
        }
    }, [phase, stats]);

    const handleDismiss = () => {
        const todayStr = new Date().toLocaleDateString();
        localStorage.setItem("trak_last_debrief_date", todayStr);
        setPhase("DONE");
        document.body.style.overflow = "auto";
    };

    if (phase === "DONE") return null;

    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const formatDate = (dateString: string) => {
        const d = new Date(dateString);
        return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };
    const formatMemberNum = (num: number | null) => num ? num.toString().padStart(4, '0') : "0001";

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex flex-col items-center justify-between p-6 bg-background/95 backdrop-blur-3xl overflow-hidden"
            >
                {/* Background Ambient Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg h-[500px] bg-brand-emerald/10 blur-[150px] rounded-full -z-10" />

                <div className="w-full flex justify-center mt-12 h-10">
                    {phase === "LOADING" && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-brand-emerald font-bold tracking-widest uppercase text-sm">
                            <Zap className="w-4 h-4 animate-pulse" />
                            Compiling Yesterday...
                        </motion.div>
                    )}
                    {phase === "ODOMETER" && (
                        <motion.h2 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold tracking-tighter">
                            Consistent Action.
                        </motion.h2>
                    )}
                    {phase === "MAX_CHECK" && (
                        <motion.h2 initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", bounce: 0.6 }} className="text-3xl font-extrabold tracking-tight text-white flex gap-2 items-center">
                            <Crown className="text-amber-400 w-8 h-8" />
                            NEW ALL-TIME RECORD!
                        </motion.h2>
                    )}
                    {phase === "SUPERNOVA" && (
                        <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-3xl font-extrabold tracking-tight text-brand-emerald flex gap-2 items-center">
                            LEVEL UP SECURED.
                        </motion.h2>
                    )}
                </div>

                {/* Central Stage: The Profile Card */}
                <div className="flex-1 flex flex-col items-center justify-center w-full relative">
                    <AnimatePresence>
                        {(phase === "MAX_CHECK" || phase === "SUPERNOVA") && userProfile && stats && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.5, y: 50 }}
                                animate={
                                    phase === "SUPERNOVA"
                                        ? { opacity: 1, scale: 1.1, y: 0, rotateY: [0, 180, 0] } // The FIFA Flip
                                        : { opacity: 1, scale: 1, y: 0 }
                                }
                                transition={{
                                    rotateY: { duration: 1.2, ease: "anticipate" },
                                    scale: { type: "spring", bounce: 0.5 }
                                }}
                                className="relative z-10"
                                style={{ transformStyle: 'preserve-3d' }}
                            >
                                <ProfileBadgeCard
                                    initials={getInitials(userProfile.name)}
                                    sinceDate={formatDate(userProfile.created_at)}
                                    memberNumber={formatMemberNum(userProfile.member_number)}
                                    isTrakPlus={userProfile.is_trak_plus}
                                    nutritionStreak={stats.nutrition.bestStreak}
                                    habitsStreak={stats.habits.bestStreak}
                                    fitnessStreak={stats.fitness.bestStreak}
                                />

                                {/* Glowing Aura behind card during supernova */}
                                {phase === "SUPERNOVA" && (
                                    <motion.div
                                        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                                        transition={{ repeat: Infinity, duration: 2 }}
                                        className={`absolute inset-0 rounded-3xl -z-10 blur-xl ${stats.newBadgePillar === 'habits' ? 'bg-purple-500' :
                                            stats.newBadgePillar === 'fitness' ? 'bg-blue-500' : 'bg-emerald-500'
                                            }`}
                                    />
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* The Floor: Current Streaks Odometer */}
                <div className="w-full space-y-8 pb-10">
                    {stats && phase !== "LOADING" && (
                        <div className="grid grid-cols-3 gap-3">
                            <OdometerCard
                                icon={Leaf}
                                label="Nutrition"
                                value={displayNutritionStreak}
                                colorClass="text-emerald-400"
                                bgClass="bg-emerald-400/10"
                                delay={0}
                            />
                            <OdometerCard
                                icon={Dumbbell}
                                label="Fitness"
                                value={displayFitnessStreak}
                                colorClass="text-blue-400"
                                bgClass="bg-blue-400/10"
                                delay={0.1}
                            />
                            <OdometerCard
                                icon={Check}
                                label="Habits"
                                value={displayHabitStreak}
                                colorClass="text-purple-400"
                                bgClass="bg-purple-400/10"
                                delay={0.2}
                            />
                        </div>
                    )}

                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: phase !== "LOADING" ? 1 : 0, y: phase !== "LOADING" ? 0 : 20 }}
                        transition={{ delay: 1 }}
                        disabled={phase === "LOADING"}
                        onClick={handleDismiss}
                        className="w-full h-14 bg-white hover:bg-white/90 text-black font-bold text-lg rounded-2xl flex items-center justify-center transition-colors shadow-2xl"
                    >
                        Let&apos;s Go
                    </motion.button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

// Sub-component for the rolling numbers
function OdometerCard({ icon: Icon, label, value, colorClass, bgClass, delay }: { icon: React.ElementType, label: string, value: number, colorClass: string, bgClass: string, delay: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, type: "spring", bounce: 0.4 }}
            className={`p-4 rounded-2xl border border-white/5 bg-white/[0.02] flex flex-col items-center justify-center text-center gap-2`}
        >
            <div className={`w-8 h-8 rounded-full ${bgClass} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${colorClass}`} />
            </div>
            <div className="relative h-8 w-full overflow-hidden flex justify-center">
                <AnimatePresence mode="popLayout">
                    <motion.div
                        key={value}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        transition={{ type: "spring", bounce: 0 }}
                        className="text-2xl font-black text-white absolute"
                    >
                        {value}
                    </motion.div>
                </AnimatePresence>
            </div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                {label}
            </span>
        </motion.div>
    );
}

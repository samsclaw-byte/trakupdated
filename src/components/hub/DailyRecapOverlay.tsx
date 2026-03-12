"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, Flame, ChevronRight, Pencil } from "lucide-react";
import Link from "next/link";
import { ProfileBadgeCard } from "@/components/ui/ProfileBadgeCard";

export interface RecapData {
    userName: string;
    userInitials: string;
    sinceDate: string;
    memberNumber: string;
    isTrakPlus: boolean;
    yesterdayDate: string;
    // Nutrition
    bmr: number;
    workouts: { activity_type: string; calories_burned: number; duration_minutes: number }[];
    totalWorkoutCalories: number;
    totalEaten: number;
    meals: { meal_type: string; calories: number }[];
    nutritionAchieved: boolean;
    // Fitness
    fitnessAchieved: boolean;
    fitnessStreak: number;
    // Habits
    habits: { name: string; completed: boolean }[];
    habitsCompleted: number;
    habitsTotal: number;
    habitsAchieved: boolean;
    habitStreak: number;
    // Whoop
    whoopData?: {
        recovery_score: number;
        strain: number;
        hrv: number;
        sleep_duration_minutes: number;
        sleep_performance: number;
    };
    // Streaks (current / best)
    streaks: {
        nutrition: { current: number; best: number };
        fitness: { current: number; best: number };
        habits: { current: number; best: number }; // perfect days
    };
    // Points earned today
    pointsEarned: { nutrition: number; fitness: number; habits: number };
}

interface DailyRecapOverlayProps {
    data: RecapData;
    onComplete: () => void;
}

const STEPS = ["overview", "calorie_budget", "habits", "profile_upgrade"] as const;

export function DailyRecapOverlay({ data, onComplete }: DailyRecapOverlayProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const step = STEPS[currentStep];
    const isLastStep = currentStep === STEPS.length - 1;

    const goNext = () => {
        if (isLastStep) {
            onComplete();
        } else {
            setCurrentStep(prev => prev + 1);
        }
    };

    // Auto-advance for overview and habits (30 seconds)
    useEffect(() => {
        if (step === "overview" || step === "habits") {
            timerRef.current = setTimeout(goNext, 30000);
            return () => { if (timerRef.current) clearTimeout(timerRef.current); };
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-background flex flex-col"
        >
            {/* Progress bar */}
            <div className="flex gap-1 px-6 pt-4 pb-2">
                {STEPS.map((_, idx) => (
                    <div key={idx} className="flex-1 h-1 rounded-full overflow-hidden bg-white/10">
                        <motion.div
                            className="h-full bg-brand-emerald rounded-full"
                            initial={{ width: "0%" }}
                            animate={{ width: idx <= currentStep ? "100%" : "0%" }}
                            transition={{ duration: 0.4 }}
                        />
                    </div>
                ))}
            </div>

            {/* Close button */}
            <button
                onClick={onComplete}
                className="absolute top-4 right-4 z-10 p-2 bg-white/5 rounded-full text-muted-foreground hover:text-white transition-colors"
            >
                <X className="w-4 h-4" />
            </button>

            {/* Step Content */}
            <div className="flex-1 flex flex-col px-6 py-4 overflow-y-auto">
                <AnimatePresence mode="wait">
                    {step === "overview" && (
                        <OverviewStep key="overview" data={data} onNext={goNext} />
                    )}
                    {step === "calorie_budget" && (
                        <CalorieBudgetStep key="calorie" data={data} onNext={goNext} />
                    )}
                    {step === "habits" && (
                        <HabitsStep key="habits" data={data} onNext={goNext} />
                    )}
                    {step === "profile_upgrade" && (
                        <ProfileUpgradeStep key="profile" data={data} onComplete={onComplete} />
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

// ─── STEP 1: OVERVIEW (with edit links) ─────────────────────────

function OverviewStep({ data, onNext }: { data: RecapData; onNext: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="flex-1 flex flex-col justify-center items-center text-center"
        >
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold mb-2">Yesterday&apos;s Report</p>
            <h2 className="text-2xl font-black tracking-tight text-white mb-8">{data.yesterdayDate}</h2>

            <div className="w-full max-w-sm space-y-3 text-left">
                {/* Meals — editable */}
                <SummaryRow
                    emoji="🍎"
                    text={`${data.totalEaten.toLocaleString()} kcal eaten`}
                    sub={`${data.meals.length} meals logged`}
                    editHref="/dashboard"
                />

                {/* Workouts — editable */}
                {data.workouts.length > 0 ? (
                    <SummaryRow
                        emoji="🏋️"
                        text={`${data.workouts.length} workout${data.workouts.length > 1 ? "s" : ""} · ${data.totalWorkoutCalories} kcal burned`}
                        sub={data.workouts.map(w => `${w.activity_type} ${w.duration_minutes}min`).join(", ")}
                        editHref="/fitness"
                    />
                ) : (
                    <SummaryRow emoji="🏋️" text="No workouts logged" sub="Rest day" muted editHref="/fitness" />
                )}

                {/* Habits */}
                <SummaryRow
                    emoji="✅"
                    text={`${data.habitsCompleted}/${data.habitsTotal} habits completed`}
                    muted={data.habitsCompleted === 0}
                />

                {/* Whoop */}
                {data.whoopData && (
                    <>
                        <SummaryRow emoji="💤" text={`${Math.floor(data.whoopData.sleep_duration_minutes / 60)}h ${data.whoopData.sleep_duration_minutes % 60}m sleep`} sub={`${data.whoopData.sleep_performance}% performance`} />
                        <SummaryRow emoji="❤️" text={`Recovery ${data.whoopData.recovery_score}%`} sub={`Strain ${data.whoopData.strain.toFixed(1)} · HRV ${Math.round(data.whoopData.hrv)}ms`} />
                    </>
                )}
            </div>

            <button
                onClick={onNext}
                className="mt-10 px-8 py-3.5 bg-brand-emerald text-brand-black font-bold rounded-2xl flex items-center gap-2 transition-transform active:scale-[0.97]"
            >
                Let&apos;s Break It Down <ChevronRight className="w-4 h-4" />
            </button>
        </motion.div>
    );
}

function SummaryRow({ emoji, text, sub, muted, editHref }: { emoji: string; text: string; sub?: string; muted?: boolean; editHref?: string }) {
    return (
        <div className={`flex items-center gap-3 py-2.5 px-3 rounded-2xl ${muted ? "opacity-40" : ""} ${editHref ? "hover:bg-white/5 transition-colors" : ""}`}>
            <span className="text-xl leading-none shrink-0">{emoji}</span>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{text}</p>
                {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
            </div>
            {editHref && (
                <Link href={editHref} className="shrink-0 p-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                    <Pencil className="w-3 h-3 text-muted-foreground" />
                </Link>
            )}
        </div>
    );
}

// ─── STEP 2: CALORIE BUDGET — WATERFALL CHART ──────────────────

function CalorieBudgetStep({ data, onNext }: { data: RecapData; onNext: () => void }) {
    const [phase, setPhase] = useState(0);

    useEffect(() => {
        const timers = [
            setTimeout(() => setPhase(1), 400),
            setTimeout(() => setPhase(2), 1600),
            setTimeout(() => setPhase(3), 2800),
            setTimeout(() => setPhase(4), 4000),
        ];
        return () => timers.forEach(clearTimeout);
    }, []);

    const totalBudget = data.bmr + data.totalWorkoutCalories;
    const net = totalBudget - data.totalEaten;

    // All bars are scaled against the LARGER of total budget or total eaten
    const maxVal = Math.max(totalBudget, data.totalEaten);

    // Cumulative positions for waterfall (immutable)
    const bmrWidth = (data.bmr / maxVal) * 100;

    const workoutSegments = data.workouts.reduce<{ segments: { activity_type: string; calories_burned: number; duration_minutes: number; startPct: number; widthPct: number }[]; cum: number }>(
        (acc, w) => {
            const start = (acc.cum / maxVal) * 100;
            const width = (w.calories_burned / maxVal) * 100;
            return {
                segments: [...acc.segments, { ...w, startPct: start, widthPct: width }],
                cum: acc.cum + w.calories_burned,
            };
        },
        { segments: [], cum: data.bmr }
    ).segments;

    // Eaten bar: green portion (under budget) + red portion (over budget)
    const eatenWidth = (data.totalEaten / maxVal) * 100;
    const greenEatenPct = data.totalEaten <= totalBudget
        ? eatenWidth
        : (totalBudget / maxVal) * 100;
    const redEatenPct = data.totalEaten > totalBudget
        ? ((data.totalEaten - totalBudget) / maxVal) * 100
        : 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="flex-1 flex flex-col justify-center"
        >
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold mb-2 text-center">Calorie Budget</p>
            <h2 className="text-xl font-black tracking-tight text-white mb-10 text-center">Where your calories went</h2>

            <div className="space-y-6 w-full max-w-md mx-auto">
                {/* BMR Bar — fills left to right from 0 */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest">🫀 Body Burns (BMR)</span>
                        <motion.span
                            className="text-sm font-black text-indigo-300"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: phase >= 1 ? 1 : 0 }}
                        >
                            {data.bmr.toLocaleString()} kcal
                        </motion.span>
                    </div>
                    <div className="h-10 bg-white/5 rounded-xl overflow-hidden relative">
                        <motion.div
                            className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-xl absolute left-0"
                            initial={{ width: "0%" }}
                            animate={{ width: phase >= 1 ? `${bmrWidth}%` : "0%" }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        />
                    </div>
                </div>

                {/* Workout Bars — each starts where previous ends (waterfall) */}
                {workoutSegments.map((w, i) => (
                    <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-brand-emerald uppercase tracking-widest">
                                🏊 {w.activity_type} ({w.duration_minutes}min)
                            </span>
                            <motion.span
                                className="text-sm font-black text-brand-emerald"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: phase >= 2 ? 1 : 0 }}
                            >
                                +{w.calories_burned.toLocaleString()} kcal
                            </motion.span>
                        </div>
                        <div className="h-10 bg-white/5 rounded-xl overflow-hidden relative">
                            {/* Ghost spacer showing BMR + previous workouts (faded) */}
                            <div
                                className="h-full bg-white/[0.03] absolute left-0 rounded-l-xl"
                                style={{ width: `${w.startPct}%` }}
                            />
                            {/* Workout segment fills from the cumulative start position */}
                            <motion.div
                                className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-r-xl absolute"
                                style={{ left: `${w.startPct}%` }}
                                initial={{ width: "0%" }}
                                animate={{ width: phase >= 2 ? `${w.widthPct}%` : "0%" }}
                                transition={{ duration: 0.6, delay: i * 0.2, ease: [0.16, 1, 0.3, 1] }}
                            />
                        </div>
                    </div>
                ))}

                {data.workouts.length === 0 && (
                    <div className="text-center text-muted-foreground/40 text-xs py-2 italic">
                        No workouts — budget was BMR only
                    </div>
                )}

                {/* Total Budget divider */}
                <motion.div
                    className="border-t border-white/10 pt-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: phase >= 2 ? 1 : 0 }}
                >
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Total Budget</span>
                        <span className="font-bold text-white">{totalBudget.toLocaleString()} kcal</span>
                    </div>
                </motion.div>

                {/* Eaten Bar — fills RIGHT to LEFT, green for earned, red for exceeded */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">🍽️ Calories Eaten</span>
                        <motion.span
                            className="text-sm font-black text-amber-400"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: phase >= 3 ? 1 : 0 }}
                        >
                            −{data.totalEaten.toLocaleString()} kcal
                        </motion.span>
                    </div>
                    <div className="h-10 bg-white/5 rounded-xl overflow-hidden relative flex justify-end">
                        {/* Red portion (over budget) — fills first from right */}
                        {redEatenPct > 0 && (
                            <motion.div
                                className="h-full bg-gradient-to-l from-red-500 to-red-600 absolute right-0"
                                initial={{ width: "0%" }}
                                animate={{ width: phase >= 3 ? `${redEatenPct}%` : "0%" }}
                                transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            />
                        )}
                        {/* Green portion (within budget) — fills from right, before red */}
                        <motion.div
                            className={`h-full bg-gradient-to-l from-emerald-500 to-emerald-600 absolute ${redEatenPct > 0 ? "" : "rounded-l-xl"}`}
                            style={redEatenPct > 0 ? { right: `${redEatenPct}%` } : { right: "0%" }}
                            initial={{ width: "0%" }}
                            animate={{ width: phase >= 3 ? `${greenEatenPct}%` : "0%" }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        />
                    </div>
                    {redEatenPct > 0 && phase >= 3 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex justify-end gap-3 text-[10px] font-bold uppercase tracking-widest"
                        >
                            <span className="text-emerald-400">Earned: {totalBudget.toLocaleString()}</span>
                            <span className="text-red-400">Over: +{(data.totalEaten - totalBudget).toLocaleString()}</span>
                        </motion.div>
                    )}
                </div>

                {/* NET RESULT */}
                <AnimatePresence>
                    {phase >= 4 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ type: "spring", damping: 15, stiffness: 200 }}
                            className={`rounded-2xl p-5 text-center border ${net >= 0
                                ? "bg-brand-emerald/10 border-brand-emerald/30"
                                : "bg-red-500/10 border-red-500/30"
                                }`}
                        >
                            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Net Result</p>
                            <p className={`text-3xl font-black ${net >= 0 ? "text-brand-emerald" : "text-red-400"}`}>
                                {net >= 0 ? "+" : ""}{net.toLocaleString()} kcal
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {net >= 0
                                    ? `You finished ${net.toLocaleString()} kcal under budget ✅`
                                    : `You went ${Math.abs(net).toLocaleString()} kcal over budget`
                                }
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Next button */}
            <AnimatePresence>
                {phase >= 4 && (
                    <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        onClick={onNext}
                        className="mt-8 mx-auto px-8 py-3.5 bg-brand-emerald text-brand-black font-bold rounded-2xl flex items-center gap-2 transition-transform active:scale-[0.97]"
                    >
                        Next <ChevronRight className="w-4 h-4" />
                    </motion.button>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ─── STEP 3: HABITS CHECK ───────────────────────────────────────

function HabitsStep({ data, onNext }: { data: RecapData; onNext: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="flex-1 flex flex-col justify-center items-center"
        >
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold mb-2">Yesterday&apos;s Habits</p>
            <h2 className="text-xl font-black tracking-tight text-white mb-8">
                {data.habitsAchieved ? "Perfect execution 💪" : `${data.habitsCompleted} of ${data.habitsTotal} done`}
            </h2>

            <div className="w-full max-w-sm space-y-3">
                {data.habits.map((h, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.15 }}
                        className={`flex items-center gap-3 p-3.5 rounded-2xl border ${h.completed
                            ? "bg-brand-emerald/5 border-brand-emerald/20"
                            : "bg-white/5 border-white/5 opacity-40"
                            }`}
                    >
                        <CheckCircle2 className={`w-5 h-5 shrink-0 ${h.completed ? "text-brand-emerald" : "text-muted-foreground/40"}`} />
                        <span className="text-sm font-semibold text-white">{h.name}</span>
                    </motion.div>
                ))}
            </div>

            {data.habitsAchieved && data.habitStreak > 1 && (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="mt-6 text-brand-emerald text-sm font-bold flex items-center gap-1.5"
                >
                    <Flame className="w-4 h-4" /> {data.habitStreak} day perfect streak
                </motion.p>
            )}

            <button
                onClick={onNext}
                className="mt-10 px-8 py-3.5 bg-brand-emerald text-brand-black font-bold rounded-2xl flex items-center gap-2 transition-transform active:scale-[0.97]"
            >
                See Your Card <ChevronRight className="w-4 h-4" />
            </button>
        </motion.div>
    );
}

// ─── STEP 4: PROFILE CARD UPGRADE (streaks + badge card) ────────

function ProfileUpgradeStep({ data, onComplete }: { data: RecapData; onComplete: () => void }) {
    const [showUpgrade, setShowUpgrade] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setShowUpgrade(true), 800);
        return () => clearTimeout(t);
    }, []);

    const totalEarned = data.pointsEarned.nutrition + data.pointsEarned.fitness + data.pointsEarned.habits;

    const pillars = [
        {
            label: "Nutrition",
            emoji: "🍎",
            current: data.streaks.nutrition.current,
            best: data.streaks.nutrition.best,
            earned: data.pointsEarned.nutrition,
        },
        {
            label: "Fitness",
            emoji: "💪",
            current: data.streaks.fitness.current,
            best: data.streaks.fitness.best,
            earned: data.pointsEarned.fitness,
        },
        {
            label: "Perfect Days",
            emoji: "🧘",
            current: data.streaks.habits.current,
            best: data.streaks.habits.best,
            earned: data.pointsEarned.habits,
        },
    ];

    // Updated streaks for the badge card (after today's points)
    const newNutritionStreak = data.streaks.nutrition.current + data.pointsEarned.nutrition;
    const newFitnessStreak = data.streaks.fitness.current + data.pointsEarned.fitness;
    const newHabitsStreak = data.streaks.habits.current + data.pointsEarned.habits;
    const newNutritionBest = Math.max(data.streaks.nutrition.best, newNutritionStreak);
    const newFitnessBest = Math.max(data.streaks.fitness.best, newFitnessStreak);
    const newHabitsBest = Math.max(data.streaks.habits.best, newHabitsStreak);

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="flex-1 flex flex-col justify-center items-center"
        >
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold mb-2">Your Trak Card</p>
            <h2 className="text-xl font-black tracking-tight text-white mb-6">
                {totalEarned > 0 ? `+${totalEarned} point${totalEarned > 1 ? "s" : ""} earned 🔥` : "No points today"}
            </h2>

            {/* Streak Summary Card */}
            <motion.div
                className="w-full max-w-sm rounded-3xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 p-5 space-y-4 relative overflow-hidden"
                animate={showUpgrade ? { boxShadow: "0 0 40px rgba(34,197,94,0.15)" } : undefined}
            >
                <div className="absolute top-0 right-0 w-40 h-40 bg-brand-emerald/10 blur-[60px] -translate-y-1/2 translate-x-1/2 rounded-full pointer-events-none" />

                <div className="relative z-10">
                    <h3 className="text-base font-black text-white">{data.userName}</h3>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">Current Streaks</p>
                </div>

                <div className="space-y-3 relative z-10">
                    {pillars.map((p, i) => (
                        <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-sm">{p.emoji}</span>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{p.label}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                {/* Current streak */}
                                <AnimatePresence mode="wait">
                                    {showUpgrade && p.earned > 0 ? (
                                        <motion.div
                                            key="upgraded"
                                            initial={{ opacity: 0, scale: 1.5 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: i * 0.3 + 0.2, type: "spring", damping: 12 }}
                                            className="flex items-center gap-1"
                                        >
                                            <span className="text-sm font-black text-white">{p.current + p.earned}</span>
                                            <motion.span
                                                initial={{ opacity: 0, x: -3 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.3 + 0.5 }}
                                                className="text-[9px] font-black text-brand-emerald"
                                            >
                                                +{p.earned} ✨
                                            </motion.span>
                                        </motion.div>
                                    ) : (
                                        <motion.span key="base" className="text-sm font-black text-white/60">
                                            {p.current}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                                {/* Divider */}
                                <span className="text-[9px] text-muted-foreground/40">/</span>
                                {/* Best streak */}
                                <span className="text-[10px] font-bold text-muted-foreground">
                                    {Math.max(p.best, p.current + p.earned)} best
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Profile Badge Card — with updated corner streaks */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: showUpgrade ? 1 : 0, y: showUpgrade ? 0 : 20 }}
                transition={{ delay: 1.2 }}
                className="w-full max-w-sm mt-4"
            >
                <ProfileBadgeCard
                    initials={data.userInitials}
                    sinceDate={data.sinceDate}
                    memberNumber={data.memberNumber}
                    isTrakPlus={data.isTrakPlus}
                    nutritionStreak={showUpgrade ? newNutritionBest : data.streaks.nutrition.best}
                    habitsStreak={showUpgrade ? newHabitsBest : data.streaks.habits.best}
                    fitnessStreak={showUpgrade ? newFitnessBest : data.streaks.fitness.best}
                    currentNutritionStreak={showUpgrade ? newNutritionStreak : data.streaks.nutrition.current}
                    currentHabitsStreak={showUpgrade ? newHabitsStreak : data.streaks.habits.current}
                    currentFitnessStreak={showUpgrade ? newFitnessStreak : data.streaks.fitness.current}
                    name={data.userName}
                />
            </motion.div>

            <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
                onClick={onComplete}
                className="mt-8 px-8 py-3.5 bg-brand-emerald text-brand-black font-bold rounded-2xl flex items-center gap-2 transition-transform active:scale-[0.97]"
            >
                Dominate Today <ChevronRight className="w-4 h-4" />
            </motion.button>
        </motion.div>
    );
}

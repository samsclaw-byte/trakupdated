"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Apple, Drumstick, Pizza, Coffee, Loader2, Trash2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

interface Meal {
    id: string;
    user_id: string;
    meal_type: string;
    text_entry: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fibre: number;
    sugar: number;
    created_at: string;
}

interface UserProfile {
    daily_calories: number;
    weight: number;
    name: string;
}

export default function NutritionToday() {
    const [mealInput, setMealInput] = useState("");
    const [selectedType, setSelectedType] = useState<"Breakfast" | "Lunch" | "Dinner" | "Snack">("Breakfast");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [meals, setMeals] = useState<Meal[]>([]);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const supabaseRef = useRef(createClient());
    const router = useRouter();

    useEffect(() => {
        const supabase = supabaseRef.current;
        const fetchDashboardData = async () => {
            setIsLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/");
                return;
            }

            const { data: userProfile } = await supabase
                .from('users')
                .select('daily_calories, weight, name')
                .eq('id', user.id)
                .single();

            if (userProfile) setProfile(userProfile);

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const { data: todayMeals } = await supabase
                .from('meals')
                .select('*')
                .eq('user_id', user.id)
                .gte('created_at', today.toISOString())
                .order('created_at', { ascending: false });

            if (todayMeals) setMeals(todayMeals);
            setIsLoading(false);
        };

        fetchDashboardData();
    }, [router]);

    const handleAddMeal = async () => {
        if (!mealInput.trim()) return;
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/parse-meal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mealText: mealInput, mealType: selectedType })
            });
            if (!res.ok) throw new Error("Failed to parse meal");
            const newMeal = await res.json();
            setMeals(prev => [newMeal, ...prev]);
            setMealInput("");
        } catch (error) {
            console.error("Error adding meal:", error);
            alert("Sorry, there was an issue logging your meal. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteMeal = async (mealId: string) => {
        const supabase = supabaseRef.current;
        setMeals(prev => prev.filter(m => m.id !== mealId));
        const { error } = await supabase.from('meals').delete().eq('id', mealId);
        if (error) {
            console.error('Error deleting meal:', error);
            // Refetch on failure
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const { data } = await supabase.from('meals').select('*').eq('user_id', user.id).gte('created_at', today.toISOString()).order('created_at', { ascending: false });
                if (data) setMeals(data);
            }
        }
    };

    const goal = profile?.daily_calories ?? 2400;
    const proteinTarget = profile?.weight ? Math.round(profile.weight * 1.8) : 180;
    const carbsTarget = goal ? Math.round((goal * 0.45) / 4) : 270;
    const fatTarget = goal ? Math.round((goal * 0.25) / 9) : 80;
    const fibreTarget = 30;

    const consumed = meals.reduce((sum, meal) => sum + (Number(meal.calories) || 0), 0);
    const proteinConsumed = meals.reduce((sum, meal) => sum + (Number(meal.protein) || 0), 0);
    const carbsConsumed = meals.reduce((sum, meal) => sum + (Number(meal.carbs) || 0), 0);
    const fatConsumed = meals.reduce((sum, meal) => sum + (Number(meal.fat) || 0), 0);
    const fibreConsumed = meals.reduce((sum, meal) => sum + (Number(meal.fibre) || 0), 0);
    const percentage = Math.min((consumed / goal) * 100, 100);

    return (
        <div className="px-6 py-8 space-y-12 pb-8">
            {/* Calorie Ring Area */}
            <div className="relative flex flex-col items-center justify-center py-4">
                {isLoading ? (
                    <div className="flex flex-col items-center gap-12 w-full">
                        <div className="w-64 h-64 rounded-full bg-white/5 animate-pulse" />
                        <div className="grid grid-cols-5 w-full max-w-md gap-2">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="flex flex-col items-center gap-2">
                                    <div className="h-3 w-10 bg-white/5 rounded animate-pulse" />
                                    <div className="h-5 w-8 bg-white/5 rounded animate-pulse" />
                                    <div className="h-1 w-10 bg-white/5 rounded animate-pulse" />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="relative w-64 h-64">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="45" className="stroke-white/5 fill-none" strokeWidth="8" />
                                <motion.circle
                                    cx="50" cy="50" r="45"
                                    className="stroke-brand-emerald fill-none"
                                    strokeWidth="8" strokeLinecap="round"
                                    initial={{ strokeDasharray: "0, 283" }}
                                    animate={{ strokeDasharray: `${percentage * 2.83}, 283` }}
                                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                <motion.span initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-5xl font-bold tracking-tighter">
                                    {consumed}
                                </motion.span>
                                <span className="text-muted-foreground text-xs uppercase tracking-[0.2em] font-medium">kcal of {goal}</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-5 w-full max-w-md mt-12 gap-2">
                            <StatsCard label="Protein" value={`${proteinConsumed}g`} progress={(proteinConsumed / proteinTarget) * 100} />
                            <StatsCard label="Carbs" value={`${carbsConsumed}g`} progress={(carbsConsumed / carbsTarget) * 100} />
                            <StatsCard label="Fat" value={`${fatConsumed}g`} progress={(fatConsumed / fatTarget) * 100} />
                            <StatsCard label="Fibre" value={`${fibreConsumed}g`} progress={(fibreConsumed / fibreTarget) * 100} />
                            <StatsCard label="Meals" value={`${meals.length}`} progress={100} />
                        </div>
                    </>
                )}
            </div>

            {/* AI Input */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60">What did you eat today?</h3>
                <div className="flex flex-col gap-3 bg-white/5 border border-white/10 rounded-3xl p-3 transition-all focus-within:bg-white/[0.07] focus-within:border-brand-emerald/50">
                    <textarea
                        placeholder="2 eggs and a black coffee..."
                        className="w-full bg-transparent outline-none px-3 py-2 text-lg resize-none min-h-[80px]"
                        value={mealInput}
                        onChange={(e) => setMealInput(e.target.value)}
                        disabled={isSubmitting}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddMeal(); } }}
                    />

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                        <div className="flex flex-wrap gap-2 flex-1">
                            <QuickAction label="Breakfast" icon={Coffee} isActive={selectedType === "Breakfast"} onClick={() => setSelectedType("Breakfast")} />
                            <QuickAction label="Lunch" icon={Pizza} isActive={selectedType === "Lunch"} onClick={() => setSelectedType("Lunch")} />
                            <QuickAction label="Dinner" icon={Drumstick} isActive={selectedType === "Dinner"} onClick={() => setSelectedType("Dinner")} />
                            <QuickAction label="Snack" icon={Apple} isActive={selectedType === "Snack"} onClick={() => setSelectedType("Snack")} />
                        </div>
                        <button
                            onClick={handleAddMeal}
                            disabled={!mealInput.trim() || isSubmitting}
                            className="h-10 px-5 w-full sm:w-auto bg-brand-emerald text-brand-black font-bold rounded-2xl flex items-center justify-center transition-transform active:scale-95 disabled:opacity-50 disabled:grayscale flex-shrink-0"
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Add meal"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Meal List */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60">Recent Activity</h3>
                <div className="space-y-3">
                    {isLoading ? (
                        [1, 2].map(i => (
                            <div key={i} className="flex items-center gap-4 p-5 bg-white/5 rounded-3xl animate-pulse">
                                <div className="w-12 h-12 bg-white/5 rounded-2xl flex-shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-white/5 rounded w-2/3" />
                                    <div className="h-3 bg-white/5 rounded w-1/2" />
                                </div>
                                <div className="h-6 w-10 bg-white/5 rounded" />
                            </div>
                        ))
                    ) : meals.length === 0 ? (
                        <div className="text-center py-8 border border-dashed border-white/10 rounded-3xl">
                            <p className="text-muted-foreground text-sm uppercase tracking-widest font-bold">No meals logged yet today.</p>
                        </div>
                    ) : (
                        <AnimatePresence>
                            {meals.map((meal) => {
                                let MealIcon = Apple;
                                if (meal.meal_type === 'Breakfast') MealIcon = Coffee;
                                if (meal.meal_type === 'Lunch') MealIcon = Pizza;
                                if (meal.meal_type === 'Dinner') MealIcon = Drumstick;
                                const timeStr = new Date(meal.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
                                return (
                                    <motion.div key={meal.id}
                                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -200, height: 0, marginBottom: 0, padding: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="flex items-center justify-between p-5 bg-white/5 border border-white/5 rounded-3xl group transition-all hover:bg-white/[0.08]">
                                        <div className="flex items-center gap-4 min-w-0 flex-1">
                                            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-brand-emerald/10 transition-colors flex-shrink-0">
                                                <MealIcon className="w-5 h-5 text-muted-foreground group-hover:text-brand-emerald transition-colors" />
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-semibold text-foreground/90 capitalize truncate">
                                                    {meal.text_entry.substring(0, 25)}{meal.text_entry.length > 25 ? '...' : ''}
                                                </h4>
                                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground font-medium uppercase tracking-wider mt-1 w-full max-w-[150px]">
                                                    <span className="w-[50px]">P: {meal.protein || 0}g</span>
                                                    <span className="w-[50px]">C: {meal.carbs || 0}g</span>
                                                    <span className="w-[50px]">F: {meal.fat || 0}g</span>
                                                    <span className="w-[50px]">Fi: {meal.fibre || 0}g</span>
                                                    <span className="w-[50px]">S: {meal.sugar || 0}g</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 flex-shrink-0 pl-4">
                                            <div className="text-right">
                                                <span className="text-lg font-bold">+{meal.calories}</span>
                                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter text-right">{timeStr}</p>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteMeal(meal.id)}
                                                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-red-500/20 flex items-center justify-center transition-all ml-2"
                                                title="Delete meal"
                                            >
                                                <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-red-400 transition-colors" />
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatsCard({ label, value, progress }: { label: string; value: string; progress: number }) {
    return (
        <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-bold">{label}</span>
            <span className="text-lg font-bold leading-tight">{value}</span>
            <div className="w-12 h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(progress, 100)}%` }}
                    transition={{ duration: 1, delay: 1 }} className="h-full bg-brand-emerald" />
            </div>
        </div>
    );
}

function QuickAction({ label, icon: Icon, isActive, onClick }: { label: string; icon: React.ElementType; isActive: boolean; onClick: () => void }) {
    return (
        <button onClick={onClick}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl whitespace-nowrap text-xs font-semibold transition-all ${isActive
                ? "bg-transparent border border-white text-white"
                : "bg-white/5 border border-white/5 text-muted-foreground hover:bg-white/[0.08]"
                }`}>
            <Icon className="w-3 h-3" />{label}
        </button>
    );
}

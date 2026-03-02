"use client";

import { motion } from "framer-motion";
import { Plus, Flame, ChevronRight, Apple, Drumstick, Pizza, Coffee, Loader2, LineChart } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { useState, useEffect } from "react";
import Link from "next/link";

import { createClient } from "@/utils/supabase/client";

export default function Dashboard() {
    const [meanInput, setMealInput] = useState("");
    const [selectedType, setSelectedType] = useState<"Breakfast" | "Lunch" | "Dinner" | "Snack">("Breakfast");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [meals, setMeals] = useState<any[]>([]);
    const [goal, setGoal] = useState(2400);

    const supabase = createClient();

    // Fetch User Goal & Today's Meals on load
    useEffect(() => {
        const fetchDashboardData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Get user's daily calorie goal
            const { data: profile } = await supabase
                .from('users')
                .select('daily_calories')
                .eq('id', user.id)
                .single();

            if (profile?.daily_calories) setGoal(profile.daily_calories);

            // Fetch today's meals ONLY
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const { data: todayMeals } = await supabase
                .from('meals')
                .select('*')
                .eq('user_id', user.id)
                .gte('created_at', today.toISOString())
                .order('created_at', { ascending: false });

            if (todayMeals) setMeals(todayMeals);
        };

        fetchDashboardData();
    }, []);

    const handleAddMeal = async () => {
        if (!meanInput.trim()) return;
        setIsSubmitting(true);

        try {
            const res = await fetch('/api/parse-meal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mealText: meanInput, mealType: selectedType })
            });

            if (!res.ok) throw new Error("Failed to parse meal");

            const newMeal = await res.json();
            // Prepend the new meal to our local state so the UI updates instantly
            setMeals(prev => [newMeal, ...prev]);
            setMealInput(""); // reset input
        } catch (error) {
            console.error("Error adding meal:", error);
            alert("Sorry, there was an issue logging your meal right now. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const consumed = meals.reduce((sum, meal) => sum + (Number(meal.calories) || 0), 0);
    const proteinConsumed = meals.reduce((sum, meal) => sum + (Number(meal.protein) || 0), 0);
    const carbsConsumed = 0; // Kimi strictly returns Sugar/Fibre, we aren't tracking total carbs explicitly right now per plan
    const fatConsumed = meals.reduce((sum, meal) => sum + (Number(meal.fat) || 0), 0);

    const percentage = Math.min((consumed / goal) * 100, 100);

    return (
        <div className="flex flex-col min-h-screen bg-background pb-32">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-6 border-b border-white/5">
                <Link href="/dashboard">
                    <Logo className="text-xl" animate={false} />
                </Link>
                <div className="flex items-center gap-4">
                    <Link href="/trends" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center transition-all hover:bg-white/10 active:scale-95">
                        <LineChart className="w-4 h-4 text-muted-foreground" />
                    </Link>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Today</span>
                        <span className="text-sm font-semibold">
                            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                    </div>
                </div>
            </div>

            <div className="px-6 py-8 space-y-12">
                {/* Calorie Ring Area */}
                <div className="relative flex flex-col items-center justify-center py-4">
                    <div className="relative w-64 h-64">
                        {/* Progress Background */}
                        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                            <circle
                                cx="50" cy="50" r="45"
                                className="stroke-white/5 fill-none"
                                strokeWidth="8"
                            />
                            <motion.circle
                                cx="50" cy="50" r="45"
                                className="stroke-brand-emerald fill-none"
                                strokeWidth="8"
                                strokeLinecap="round"
                                initial={{ strokeDasharray: "0, 283" }}
                                animate={{ strokeDasharray: `${percentage * 2.83}, 283` }}
                                transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                            <motion.span
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-5xl font-bold tracking-tighter"
                            >
                                {consumed}
                            </motion.span>
                            <span className="text-muted-foreground text-xs uppercase tracking-[0.2em] font-medium">kcal of {goal}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 w-full max-w-sm mt-12 gap-4">
                        <StatsCard label="Protein" value={`${proteinConsumed}g`} progress={(proteinConsumed / 180) * 100} />
                        <StatsCard label="Fat" value={`${fatConsumed}g`} progress={(fatConsumed / 80) * 100} />
                        <StatsCard label="Meals" value={`${meals.length}`} progress={100} />
                    </div>
                </div>

                {/* AI Input Area */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60">What did you eat today?</h3>
                    <div className="relative group flex items-center bg-white/5 border border-white/10 rounded-3xl p-2 transition-all focus-within:bg-white/[0.07] focus-within:border-brand-emerald/50">
                        <input
                            type="text"
                            placeholder="2 eggs and a black coffee..."
                            className="flex-1 bg-transparent outline-none px-4 py-3 text-lg"
                            value={meanInput}
                            onChange={(e) => setMealInput(e.target.value)}
                            disabled={isSubmitting}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleAddMeal() }}
                        />
                        <button
                            onClick={handleAddMeal}
                            disabled={!meanInput.trim() || isSubmitting}
                            className="h-12 px-6 bg-brand-emerald text-brand-black font-bold rounded-2xl flex items-center justify-center transition-transform active:scale-95 disabled:opacity-50 disabled:grayscale flex-shrink-0"
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Add meal"}
                        </button>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                        <QuickAction label="Breakfast" icon={Coffee} isActive={selectedType === "Breakfast"} onClick={() => setSelectedType("Breakfast")} />
                        <QuickAction label="Lunch" icon={Pizza} isActive={selectedType === "Lunch"} onClick={() => setSelectedType("Lunch")} />
                        <QuickAction label="Dinner" icon={Drumstick} isActive={selectedType === "Dinner"} onClick={() => setSelectedType("Dinner")} />
                        <QuickAction label="Snack" icon={Apple} isActive={selectedType === "Snack"} onClick={() => setSelectedType("Snack")} />
                    </div>
                </div>

                {/* Meal List */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60">Recent Activity</h3>
                        <button className="text-brand-emerald text-xs font-bold uppercase tracking-widest flex items-center">
                            View All <ChevronRight className="w-3 h-3 ml-1" />
                        </button>
                    </div>
                    <div className="space-y-3">
                        {meals.length === 0 ? (
                            <div className="text-center py-8 border border-dashed border-white/10 rounded-3xl">
                                <p className="text-muted-foreground text-sm uppercase tracking-widest font-bold">No meals logged yet today.</p>
                            </div>
                        ) : (
                            meals.map((meal) => {
                                // Determine icon based on DB string
                                let MealIcon = Apple;
                                if (meal.meal_type === 'Breakfast') MealIcon = Coffee;
                                if (meal.meal_type === 'Lunch') MealIcon = Pizza;
                                if (meal.meal_type === 'Dinner') MealIcon = Drumstick;

                                // Format timestamp nicely
                                const rowDate = new Date(meal.created_at);
                                const timeStr = rowDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

                                return (
                                    <motion.div
                                        key={meal.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex items-center justify-between p-5 bg-white/5 border border-white/5 rounded-3xl group transition-all hover:bg-white/[0.08]"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-brand-emerald/10 transition-colors">
                                                <MealIcon className="w-5 h-5 text-muted-foreground group-hover:text-brand-emerald transition-colors" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-foreground/90 capitalize">{meal.text_entry.substring(0, 25)}{meal.text_entry.length > 25 ? '...' : ''}</h4>
                                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                                    P: {meal.protein || 0}g • F: {meal.fat || 0}g • FIBRE: {meal.fibre || 0}g
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right flex-shrink-0 pl-4">
                                            <span className="text-lg font-bold">+{meal.calories}</span>
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter text-right">{timeStr}</p>
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Floating Build Shake Button */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background/90 to-transparent">
                <Link href="/shake-builder">
                    <button className="w-full py-5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between px-6 transition-all hover:border-brand-emerald/30 active:scale-[0.98]">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-brand-emerald text-brand-black rounded-xl flex items-center justify-center">
                                <Flame className="w-6 h-6" />
                            </div>
                            <div className="text-left">
                                <h4 className="font-bold text-sm">Build My Shake</h4>
                                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Science-backed prep</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </button>
                </Link>
            </div>
        </div>
    );
}

function StatsCard({ label, value, progress }: { label: string, value: string, sub?: string, progress: number }) {
    return (
        <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-bold">{label}</span>
            <span className="text-lg font-bold leading-tight">{value}</span>
            <div className="w-12 h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, delay: 1 }}
                    className="h-full bg-brand-emerald"
                />
            </div>
        </div>
    )
}

function QuickAction({ label, icon: Icon, isActive, onClick }: { label: string, icon: React.ElementType, isActive: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl whitespace-nowrap text-xs font-semibold transition-all ${isActive
                ? "bg-transparent border border-white text-white"
                : "bg-white/5 border border-white/5 text-muted-foreground hover:bg-white/[0.08]"
                }`}
        >
            <Icon className="w-3 h-3" />
            {label}
        </button>
    )
}

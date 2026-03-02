"use client";

export const dynamic = 'force-dynamic';

import { motion } from "framer-motion";
import { Flame, ChevronRight, Apple, Drumstick, Pizza, Coffee, Loader2, LineChart, LogOut } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

interface Meal {
    id: string;
    user_id: string;
    meal_type: string;
    text_entry: string;
    calories: number;
    protein: number;
    fat: number;
    fibre: number;
    sugar: number;
    created_at: string;
}

interface UserProfile {
    daily_calories: number;
    weight: number; // in kg, stored from setup
    name: string;
    avatar_url?: string;
}

export default function Dashboard() {
    const [mealInput, setMealInput] = useState("");
    const [selectedType, setSelectedType] = useState<"Breakfast" | "Lunch" | "Dinner" | "Snack">("Breakfast");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [meals, setMeals] = useState<Meal[]>([]);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    const supabase = useMemo(() => createClient(), []);
    const router = useRouter();

    // Fetch User Profile & Today's Meals on load
    useEffect(() => {
        const fetchDashboardData = async () => {
            setIsLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch Google avatar from auth metadata
            const avatarFromGoogle = user.user_metadata?.avatar_url;
            if (avatarFromGoogle) setAvatarUrl(avatarFromGoogle);

            // Get full user profile (calories, weight for macro targets)
            const { data: userProfile } = await supabase
                .from('users')
                .select('daily_calories, weight, name')
                .eq('id', user.id)
                .single();

            if (userProfile) setProfile(userProfile);

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
            setIsLoading(false);
        };

        fetchDashboardData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
            alert("Sorry, there was an issue logging your meal right now. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/");
    };

    const goal = profile?.daily_calories ?? 2400;
    // Derive protein target from body weight (1.8g per kg is a solid performance target)
    const proteinTarget = profile?.weight ? Math.round(profile.weight * 1.8) : 180;
    // Fat target: ~25% of total calories / 9 calories per gram
    const fatTarget = goal ? Math.round((goal * 0.25) / 9) : 80;

    const consumed = meals.reduce((sum, meal) => sum + (Number(meal.calories) || 0), 0);
    const proteinConsumed = meals.reduce((sum, meal) => sum + (Number(meal.protein) || 0), 0);
    const fatConsumed = meals.reduce((sum, meal) => sum + (Number(meal.fat) || 0), 0);

    const percentage = Math.min((consumed / goal) * 100, 100);

    return (
        <div className="flex flex-col min-h-screen bg-background pb-32">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-6 border-b border-white/5">
                <Link href="/dashboard">
                    <Logo className="text-xl" />
                </Link>
                <div className="flex items-center gap-3">
                    <Link href="/trends" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center transition-all hover:bg-white/10 active:scale-95">
                        <LineChart className="w-4 h-4 text-muted-foreground" />
                    </Link>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Today</span>
                        <span className="text-sm font-semibold">
                            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                    </div>
                    {/* Avatar + Sign Out */}
                    <div className="relative group">
                        <button className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/10 flex items-center justify-center bg-brand-emerald/10">
                            {avatarUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                            ) : (
                                <span className="text-brand-emerald text-xs font-bold">
                                    {profile?.name?.charAt(0)?.toUpperCase() ?? "?"}
                                </span>
                            )}
                        </button>
                        <div className="absolute right-0 top-12 z-50 hidden group-hover:flex flex-col bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
                            <button
                                onClick={handleSignOut}
                                className="flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
                            >
                                <LogOut className="w-3 h-3" />
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-6 py-8 space-y-12">
                {/* Calorie Ring Area */}
                <div className="relative flex flex-col items-center justify-center py-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center gap-12 w-full">
                            {/* Skeleton Ring */}
                            <div className="w-64 h-64 rounded-full bg-white/5 animate-pulse" />
                            {/* Skeleton Stats */}
                            <div className="grid grid-cols-3 w-full max-w-sm gap-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex flex-col items-center gap-2">
                                        <div className="h-3 w-12 bg-white/5 rounded animate-pulse" />
                                        <div className="h-5 w-10 bg-white/5 rounded animate-pulse" />
                                        <div className="h-1 w-12 bg-white/5 rounded animate-pulse" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="relative w-64 h-64">
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
                                <StatsCard label="Protein" value={`${proteinConsumed}g`} progress={(proteinConsumed / proteinTarget) * 100} />
                                <StatsCard label="Fat" value={`${fatConsumed}g`} progress={(fatConsumed / fatTarget) * 100} />
                                <StatsCard label="Meals" value={`${meals.length}`} progress={100} />
                            </div>
                        </>
                    )}
                </div>

                {/* AI Input Area */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60">What did you eat today?</h3>
                    <div className="relative group flex items-center bg-white/5 border border-white/10 rounded-3xl p-2 transition-all focus-within:bg-white/[0.07] focus-within:border-brand-emerald/50">
                        <input
                            type="text"
                            placeholder="2 eggs and a black coffee..."
                            className="flex-1 bg-transparent outline-none px-4 py-3 text-lg"
                            value={mealInput}
                            onChange={(e) => setMealInput(e.target.value)}
                            disabled={isSubmitting}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleAddMeal() }}
                        />
                        <button
                            onClick={handleAddMeal}
                            disabled={!mealInput.trim() || isSubmitting}
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
                            meals.map((meal) => {
                                let MealIcon = Apple;
                                if (meal.meal_type === 'Breakfast') MealIcon = Coffee;
                                if (meal.meal_type === 'Lunch') MealIcon = Pizza;
                                if (meal.meal_type === 'Dinner') MealIcon = Drumstick;

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

function StatsCard({ label, value, progress }: { label: string, value: string, progress: number }) {
    return (
        <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-bold">{label}</span>
            <span className="text-lg font-bold leading-tight">{value}</span>
            <div className="w-12 h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(progress, 100)}%` }}
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

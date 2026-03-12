"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Logo } from "@/components/ui/logo";
import { User, Bell, Brain, Zap, Coffee } from "lucide-react";
import Link from "next/link";
import { WeeklyReviewOverlay } from "@/components/ui/WeeklyReviewOverlay";

// Hub Components
import { HubHeroCard, HeroCardType } from "@/components/hub/HubHeroCard";
import { HubVitalSigns } from "@/components/hub/HubVitalSigns";
import { HubActionDeck, ActionCard } from "@/components/hub/HubActionDeck";
import { BottomTabBar } from "@/components/ui/BottomTabBar";

export default function HubClient() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const supabase = createClient();

    // Data states
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [profile, setProfile] = useState<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [whoopData, setWhoopData] = useState<any>(null);
    const [whoopConnected, setWhoopConnected] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [meals, setMeals] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [fitness, setFitness] = useState<any[]>([]);
    const [habitsStats, setHabitsStats] = useState({ completed: 0, total: 0 });

    useEffect(() => {
        const fetchHubData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/");
                return;
            }

            const today = new Date();
            const todayLocalISO = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
            const startOfDay = new Date(today);
            startOfDay.setHours(0, 0, 0, 0);

            // 1. Profile
            const { data: userProfile } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single();
            setProfile(userProfile);

            // 2. Whoop Data
            const { data: whoopTokens } = await supabase.from('whoop_tokens').select('id').eq('user_id', user.id).maybeSingle();
            setWhoopConnected(!!whoopTokens);

            const { data: dailyWhoop } = await supabase
                .from('whoop_daily')
                .select('*')
                .eq('user_id', user.id)
                .eq('date', todayLocalISO)
                .single();
            setWhoopData(dailyWhoop);

            // 3. Meals
            const { data: todayMeals } = await supabase
                .from('meals')
                .select('calories, meal_type')
                .eq('user_id', user.id)
                .gte('created_at', startOfDay.toISOString());
            setMeals(todayMeals || []);

            // 4. Fitness
            const { data: todayWorkouts } = await supabase
                .from('workouts')
                .select('calories_burned')
                .eq('user_id', user.id)
                .eq('date', todayLocalISO);
            setFitness(todayWorkouts || []);

            // 5. Habits (Fetch active habits and today's logs)
            const { data: myHabits } = await supabase.from('habit_definitions').select('id').eq('user_id', user.id).eq('is_active', true);
            const { data: habitLogs } = await supabase.from('habit_logs').select('habit_id').eq('user_id', user.id).eq('date', todayLocalISO).eq('completed', true);
            setHabitsStats({
                completed: habitLogs?.length || 0,
                total: myHabits?.length || 0
            });

            setIsLoading(false);
        };

        fetchHubData();
    }, [router, supabase]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/");
    };

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 rounded-full border-2 border-brand-emerald border-t-transparent animate-spin" /></div>;
    }

    // --- RULES ENGINE CALCULATIONS ---

    const todayDate = new Date();
    const todayLocalISO = new Date(todayDate.getTime() - (todayDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    const isMorning = todayDate.getHours() < 12;

    // 1. Determine Hero Card State
    let heroType: HeroCardType = "all_caught_up";
    let isWeeklyReviewPending = false;

    const lastWeighIn = profile?.last_weigh_in_date;
    const diffDays = lastWeighIn ? Math.floor((todayDate.getTime() - new Date(lastWeighIn).getTime()) / (1000 * 3600 * 24)) : 999;

    if (!lastWeighIn || diffDays >= 7 || (todayDate.getDay() === 0 && lastWeighIn !== todayLocalISO)) {
        isWeeklyReviewPending = true;
    }

    if (isMorning && lastWeighIn !== todayLocalISO) {
        heroType = "log_weight";
    } else if (isWeeklyReviewPending) {
        heroType = "weekly_review";
    } else if (whoopData) {
        heroType = "synced_whoop";
    }

    // 2. Vital Signs Data
    const consumedCalories = meals.reduce((sum, m) => sum + (Number(m.calories) || 0), 0);
    const goalCalories = profile?.daily_calories || 2400;
    const burnedCalories = fitness.reduce((sum, w) => sum + (Number(w.calories_burned) || 0), 0);
    const activeTarget = 500; // Static target for now

    // Nutrition: under calorie goal = 100% achieved
    const nutritionProgress = consumedCalories <= goalCalories ? 100 : Math.max(0, 100 - ((consumedCalories - goalCalories) / goalCalories) * 100);
    const fitnessProgress = (burnedCalories / activeTarget) * 100;
    const habitsProgress = habitsStats.total > 0 ? (habitsStats.completed / habitsStats.total) * 100 : 0;

    // 3. Action Deck Population
    const actionCards: ActionCard[] = [];

    if (!whoopConnected) {
        actionCards.push({
            id: "connect_whoop",
            title: "Connect Whoop",
            subtitle: "Auto-sync recovery & sleep",
            icon: Zap,
            iconColor: "text-amber-400",
            iconBg: "bg-amber-400/10",
            actionLabel: "Connect Now",
            actionHref: "/api/whoop/auth"
        });
    }

    const hasBreakfast = meals.some(m => m.meal_type === "Breakfast");
    if (!hasBreakfast && todayDate.getHours() >= 9) {
        actionCards.push({
            id: "log_breakfast",
            title: "Missing Breakfast",
            subtitle: "Keep your metabolism active",
            icon: Coffee,
            iconColor: "text-brand-emerald",
            iconBg: "bg-brand-emerald/10",
            actionLabel: "Log Meal",
            actionHref: "/nutrition"
        });
    }

    actionCards.push({
        id: "learn_macros",
        title: "Trak Academy",
        subtitle: "How to hit macro targets easily",
        icon: Brain,
        iconColor: "text-purple-400",
        iconBg: "bg-purple-400/10",
        actionLabel: "Watch (2 min)",
    });

    return (
        <div className="flex flex-col min-h-screen bg-background pb-32">
            <WeeklyReviewOverlay
                isOpen={isReviewModalOpen}
                onClose={() => setIsReviewModalOpen(false)}
                onCompleted={(newWeight, newGoal) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    setProfile((prev: any) => prev ? { ...prev, weight: newWeight, daily_calories: newGoal, last_weigh_in_date: new Date().toISOString() } : null);
                }}
            />

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-6 border-b border-white/5">
                <Link href="/hub"><Logo className="text-xl" /></Link>
                <div className="flex items-center gap-3">
                    <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center transition-all hover:bg-white/10 active:scale-95">
                        <Bell className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <Link
                        href="/profile"
                        className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center transition-all hover:bg-white/10 hover:text-brand-emerald active:scale-95"
                    >
                        <User className="w-4 h-4 text-muted-foreground" />
                    </Link>
                </div>
            </div>

            <div className="px-6 py-6 space-y-8 overflow-x-hidden">
                {/* Layer 1: The Contextual Hero Card */}
                <div className="w-full">
                    <HubHeroCard
                        type={heroType}
                        userName={profile?.name?.split(" ")[0]}
                        data={whoopData}
                        onAction={() => {
                            if (heroType === "log_weight" || heroType === "weekly_review") {
                                setIsReviewModalOpen(true);
                            }
                        }}
                    />
                </div>

                {/* Layer 2: Vital Signs Triad */}
                <div className="w-full">
                    <HubVitalSigns
                        nutritionProgress={nutritionProgress}
                        nutritionLabel={`${consumedCalories} / ${goalCalories} kcal`}
                        fitnessProgress={fitnessProgress}
                        fitnessLabel={whoopData ? `${whoopData.strain?.toFixed(1) || 0} Strain` : `${burnedCalories} kcal`}
                        habitsProgress={habitsProgress}
                        habitsLabel={`${habitsStats.completed} of ${habitsStats.total}`}
                    />
                </div>

                {/* Layer 3: Connected Devices */}
                <div className="w-full space-y-3">
                    <h3 className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground font-bold">Connected Devices</h3>
                    {whoopConnected ? (
                        <Link href="/hub/whoop" className="block bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/[0.08] transition-all active:scale-[0.98]">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-400/10 flex items-center justify-center">
                                        <Zap className="w-5 h-5 text-emerald-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-white">Whoop</h4>
                                        <span className="text-[10px] text-emerald-400 font-semibold">● Connected</span>
                                    </div>
                                </div>
                                <span className="text-muted-foreground text-xs font-semibold">View Data →</span>
                            </div>
                            {whoopData && (
                                <div className="flex gap-4 mt-3 pt-3 border-t border-white/5 text-xs text-muted-foreground">
                                    {whoopData.recovery_score != null && <span>Recovery: <span className="text-white font-bold">{whoopData.recovery_score}%</span></span>}
                                    {whoopData.strain != null && <span>Strain: <span className="text-white font-bold">{whoopData.strain?.toFixed(1)}</span></span>}
                                    {whoopData.hrv != null && <span>HRV: <span className="text-white font-bold">{Math.round(whoopData.hrv)}ms</span></span>}
                                </div>
                            )}
                        </Link>
                    ) : (
                        <Link href="/api/whoop/auth" className="block bg-white/5 border border-dashed border-white/10 rounded-2xl p-4 hover:bg-white/[0.08] transition-all text-center">
                            <Zap className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                            <p className="text-sm font-semibold text-white">Connect Whoop</p>
                            <p className="text-[10px] text-muted-foreground mt-1">Auto-sync recovery, sleep & strain</p>
                        </Link>
                    )}
                </div>

                {/* Layer 4: Action Deck Carousel */}
                <div className="w-full">
                    <HubActionDeck cards={actionCards} />
                </div>
            </div>

            <BottomTabBar />
        </div>
    );
}

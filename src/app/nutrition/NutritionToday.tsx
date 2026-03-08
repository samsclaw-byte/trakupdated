"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Apple, Drumstick, Pizza, Coffee, Loader2, Trash2, ChevronLeft, ChevronRight, ScanLine, Crown, X, Scale } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { logSquadEvent } from "@/utils/squads";
import SnapToTrakModal, { ParsedMeal } from "./SnapToTrakModal";
import { WeeklyReviewOverlay } from "@/components/ui/WeeklyReviewOverlay";

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
    micronutrients?: {
        sodium: number;
        potassium: number;
        calcium: number;
        magnesium: number;
        iron: number;
        zinc: number;
        vitamin_c: number;
        vitamin_d: number;
        vitamin_b12: number;
        folate: number;
    } | null;
}

interface UserProfile {
    daily_calories: number;
    weight: number;
    name: string;
    is_trak_plus: boolean;
    last_weigh_in_date: string | null;
}

export default function NutritionToday() {
    const [mealInput, setMealInput] = useState("");
    const [imageBase64, setImageBase64] = useState<string | null>(null);
    const [selectedType, setSelectedType] = useState<"Breakfast" | "Lunch" | "Dinner" | "Snack">("Breakfast");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [meals, setMeals] = useState<Meal[]>([]);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [isSnapModalOpen, setIsSnapModalOpen] = useState(false);
    const [macroView, setMacroView] = useState<'macro' | 'micro'>('macro');
    const [microInfo, setMicroInfo] = useState<string | null>(null);
    const [needsWeeklyReview, setNeedsWeeklyReview] = useState(false);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

    const supabaseRef = useRef(createClient());
    const router = useRouter();

    const handlePrevDay = () => {
        const prev = new Date(selectedDate);
        prev.setDate(prev.getDate() - 1);
        setSelectedDate(prev);
    };

    const handleNextDay = () => {
        const next = new Date(selectedDate);
        next.setDate(next.getDate() + 1);
        if (next <= new Date()) {
            setSelectedDate(next);
        }
    };

    const isToday = () => {
        const today = new Date();
        return selectedDate.getDate() === today.getDate() &&
            selectedDate.getMonth() === today.getMonth() &&
            selectedDate.getFullYear() === today.getFullYear();
    };

    const formatDateHeader = () => {
        if (isToday()) return "Today";
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (selectedDate.getDate() === yesterday.getDate() &&
            selectedDate.getMonth() === yesterday.getMonth() &&
            selectedDate.getFullYear() === yesterday.getFullYear()) {
            return "Yesterday";
        }
        return selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

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
                .select('daily_calories, weight, name, is_trak_plus, last_weigh_in_date')
                .eq('id', user.id)
                .single();

            if (userProfile) {
                setProfile(userProfile);

                // Weekly Review Trigger Logic
                const today = new Date();
                const todayLocalISO = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
                const lastDate = userProfile.last_weigh_in_date;
                let overdue = false;

                if (!lastDate) {
                    if (today.getDay() === 0) overdue = true; // It's Sunday and no weigh-in
                } else {
                    const diffDays = Math.floor((today.getTime() - new Date(lastDate).getTime()) / (1000 * 3600 * 24));
                    // Trigger if it's been a week, OR if it's Sunday and they haven't weighed in yet today
                    if (diffDays >= 7 || (today.getDay() === 0 && lastDate !== todayLocalISO)) {
                        overdue = true;
                    }
                }
                setNeedsWeeklyReview(overdue);
            }

            const startOfDay = new Date(selectedDate);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(selectedDate);
            endOfDay.setHours(23, 59, 59, 999);

            const { data: dayMeals } = await supabase
                .from('meals')
                .select('*')
                .eq('user_id', user.id)
                .gte('created_at', startOfDay.toISOString())
                .lte('created_at', endOfDay.toISOString())
                .order('created_at', { ascending: false });

            if (dayMeals) setMeals(dayMeals);
            setIsLoading(false);
        };

        fetchDashboardData();
    }, [router, selectedDate]);

    const handleAddMeal = async () => {
        if (!mealInput.trim() && !imageBase64) return;
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/parse-meal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mealText: mealInput,
                    mealType: selectedType,
                    date: selectedDate.toISOString(),
                    imageBase64
                })
            });
            if (!res.ok) throw new Error("Failed to parse meal");
            const newMeal = await res.json();
            setMeals(prev => [newMeal, ...prev]);

            const newConsumed = consumed + (Number(newMeal.calories) || 0);
            if (consumed < goal * 0.9 && newConsumed >= goal * 0.9 && newConsumed <= goal + 150) {
                const supabase = supabaseRef.current;
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    logSquadEvent(user.id, 'calorie_target_hit', { calories: newConsumed });
                }
            }

            setMealInput("");
            setImageBase64(null);
        } catch (error) {
            console.error("Error adding meal:", error);
            alert("Sorry, there was an issue logging your meal. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLogVisionMeal = async (parsedData: ParsedMeal) => {
        const supabase = supabaseRef.current;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: newMeal, error } = await supabase
            .from("meals")
            .insert({
                user_id: user.id,
                meal_type: selectedType, // default or let user choose later? For now default to what is selected on dashboard
                text_entry: `${parsedData.title} |:| ${parsedData.description}`,
                calories: parsedData.calories,
                protein: parsedData.protein,
                carbs: parsedData.carbs,
                fat: parsedData.fat,
                fibre: parsedData.fibre,
                sugar: parsedData.sugar,
                micronutrients: parsedData.micronutrients || null,
                ...(selectedDate ? { created_at: new Date(selectedDate).toISOString() } : {}),
            })
            .select()
            .single();

        if (error) throw error;

        setMeals(prev => [newMeal, ...prev]);

        // Squad logic
        const newConsumed = consumed + (Number(newMeal.calories) || 0);
        if (consumed < goal * 0.9 && newConsumed >= goal * 0.9 && newConsumed <= goal + 150) {
            logSquadEvent(user.id, 'calorie_target_hit', { calories: newConsumed });
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
                const startOfDay = new Date(selectedDate);
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date(selectedDate);
                endOfDay.setHours(23, 59, 59, 999);
                const { data } = await supabase.from('meals').select('*')
                    .eq('user_id', user.id)
                    .gte('created_at', startOfDay.toISOString())
                    .lte('created_at', endOfDay.toISOString())
                    .order('created_at', { ascending: false });
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
    const proteinConsumed = Math.round(meals.reduce((sum, meal) => sum + (Number(meal.protein) || 0), 0));
    const carbsConsumed = Math.round(meals.reduce((sum, meal) => sum + (Number(meal.carbs) || 0), 0));
    const fatConsumed = Math.round(meals.reduce((sum, meal) => sum + (Number(meal.fat) || 0), 0));
    const fibreConsumed = Math.round(meals.reduce((sum, meal) => sum + (Number(meal.fibre) || 0), 0));
    const percentage = Math.min((consumed / goal) * 100, 100);
    const overfillPercentage = Math.min(Math.max(((consumed / goal) * 100) - 100, 0), 100);

    // Micronutrient daily totals
    const sodiumTotal = Math.round(meals.reduce((s, m) => s + (m.micronutrients?.sodium || 0), 0));
    const potassiumTotal = Math.round(meals.reduce((s, m) => s + (m.micronutrients?.potassium || 0), 0));
    const calciumTotal = Math.round(meals.reduce((s, m) => s + (m.micronutrients?.calcium || 0), 0));
    const magnesiumTotal = Math.round(meals.reduce((s, m) => s + (m.micronutrients?.magnesium || 0), 0));
    const ironTotal = Math.round(meals.reduce((s, m) => s + (m.micronutrients?.iron || 0), 0) * 10) / 10;
    const zincTotal = Math.round(meals.reduce((s, m) => s + (m.micronutrients?.zinc || 0), 0) * 10) / 10;
    const vitCTotal = Math.round(meals.reduce((s, m) => s + (m.micronutrients?.vitamin_c || 0), 0));
    const vitDTotal = Math.round(meals.reduce((s, m) => s + (m.micronutrients?.vitamin_d || 0), 0) * 10) / 10;
    const vitB12Total = Math.round(meals.reduce((s, m) => s + (m.micronutrients?.vitamin_b12 || 0), 0) * 10) / 10;
    const folateTotal = Math.round(meals.reduce((s, m) => s + (m.micronutrients?.folate || 0), 0));

    // Target values (EU Daily Reference Intakes)
    const MICRO_TARGETS = { sodium: 2300, potassium: 3500, calcium: 1000, magnesium: 375, iron: 14, zinc: 10, vitamin_c: 80, vitamin_d: 5, vitamin_b12: 2.5, folate: 200 };
    const isTrakPlus = profile?.is_trak_plus || false;

    const MICRO_INFO: Record<string, { why: string; sources: string }> = {
        Sodium: { why: "Regulates fluid balance, blood pressure, and nerve signals. Most people over-consume sodium — tracking helps stay under 2300mg.", sources: "Processed foods, table salt, bread, deli meats" },
        Potassium: { why: "Counteracts sodium's blood pressure effects, supports muscle contractions and heart rhythm. Critical for athletes.", sources: "Bananas, potatoes, spinach, avocado, salmon" },
        Calcium: { why: "Essential for bone density, muscle contraction, and nerve function. Deficiency accelerates bone loss over time.", sources: "Dairy, leafy greens, fortified plant milks, tofu" },
        Magnesium: { why: "Involved in 300+ enzyme reactions including energy production, protein synthesis, sleep quality, and stress regulation. One of the most common deficiencies.", sources: "Nuts, seeds, dark chocolate, legumes, leafy greens" },
        Iron: { why: "Carries oxygen in red blood cells. Iron deficiency causes fatigue and impaired focus — especially common in women and athletes.", sources: "Red meat, spinach, lentils, tofu, fortified cereals" },
        Zinc: { why: "Supports immune function, testosterone production, wound healing, and taste/smell. Often depleted by intense exercise.", sources: "Oysters, beef, pumpkin seeds, chickpeas, cashews" },
        "Vit C": { why: "Powerful antioxidant, boosts immune response, aids collagen production, and dramatically improves iron absorption from plant sources.", sources: "Citrus fruits, bell peppers, broccoli, strawberries" },
        "Vit D": { why: "Regulates calcium absorption, immune defence, mood, and inflammation. Majority of people are deficient, especially those indoors or in northern climates.", sources: "Sunlight, fatty fish, egg yolks, fortified foods" },
        "Vit B12": { why: "Essential for nerve function, DNA synthesis, and red blood cell formation. Vegans and vegetarians are high-risk for deficiency.", sources: "Meat, fish, dairy, eggs — hard to get without animal products" },
        Folate: { why: "Critical for DNA repair, cell division, and neural tube development. Especially vital for women of childbearing age and anyone with high cell turnover.", sources: "Leafy greens, legumes, asparagus, fortified grains" },
    };

    return (
        <div className="px-6 py-8 space-y-12 pb-8">
            <WeeklyReviewOverlay
                isOpen={isReviewModalOpen}
                onClose={() => setIsReviewModalOpen(false)}
                onCompleted={(newWeight, newGoal) => {
                    setProfile(prev => prev ? { ...prev, weight: newWeight, daily_calories: newGoal, last_weigh_in_date: new Date().toISOString() } : null);
                    setNeedsWeeklyReview(false);
                }}
            />

            {needsWeeklyReview && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full relative rounded-2xl p-4 bg-brand-emerald/10 border border-brand-emerald overflow-hidden backdrop-blur-sm cursor-pointer"
                    onClick={() => setIsReviewModalOpen(true)}
                >
                    <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center bg-brand-emerald opacity-[0.05] pointer-events-none" />
                    <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-brand-emerald text-brand-black rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                                <Scale className="w-5 h-5 ml-0.5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-brand-emerald capitalize">Weekly Recalibration</h4>
                                <p className="text-[10px] uppercase tracking-widest text-brand-emerald/70 font-bold leading-tight">Sync metrics for new targets</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-brand-emerald" />
                    </div>
                </motion.div>
            )}

            {/* Date Navigator */}
            <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl p-2 mb-4">
                <button onClick={handlePrevDay} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                    <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                </button>
                <span className="font-bold text-sm tracking-widest uppercase text-white/90">{formatDateHeader()}</span>
                <button onClick={handleNextDay} disabled={isToday()} className="p-2 hover:bg-white/10 rounded-xl transition-colors disabled:opacity-30 disabled:hover:bg-transparent">
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
            </div>

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
                                {overfillPercentage > 0 && (
                                    <motion.circle
                                        cx="50" cy="50" r="45"
                                        className="stroke-red-500 fill-none"
                                        strokeWidth="8" strokeLinecap="round"
                                        initial={{ strokeDasharray: "0, 283" }}
                                        animate={{ strokeDasharray: `${overfillPercentage * 2.83}, 283` }}
                                        transition={{ duration: 1.5, ease: "easeOut", delay: 2.0 }}
                                    />
                                )}
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                <motion.span initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-5xl font-bold tracking-tighter">
                                    {consumed}
                                </motion.span>
                                <span className="text-muted-foreground text-xs uppercase tracking-[0.2em] font-medium">kcal of {goal}</span>
                            </div>
                        </div>
                        {/* Macro/Micro Toggle */}
                        <div className="flex gap-1 bg-white/5 p-1 rounded-2xl w-48 mx-auto mb-4">
                            <button
                                onClick={() => setMacroView('macro')}
                                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${macroView === 'macro' ? 'bg-white/10 text-white' : 'text-muted-foreground'}`}
                            >
                                Macro
                            </button>
                            <button
                                onClick={() => isTrakPlus ? setMacroView('micro') : null}
                                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${macroView === 'micro' ? 'bg-white/10 text-white' : 'text-muted-foreground'} ${!isTrakPlus ? 'opacity-50' : ''}`}
                            >
                                {!isTrakPlus && <Crown className="w-3 h-3 text-amber-400" />}
                                Micro
                            </button>
                        </div>

                        <AnimatePresence mode="wait">
                            {macroView === 'macro' ? (
                                <motion.div
                                    key="macro"
                                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                                    className="grid grid-cols-5 w-full max-w-md gap-2"
                                >
                                    <StatsCard label="Protein" value={`${proteinConsumed}g`} progress={(proteinConsumed / proteinTarget) * 100} />
                                    <StatsCard label="Carbs" value={`${carbsConsumed}g`} progress={(carbsConsumed / carbsTarget) * 100} />
                                    <StatsCard label="Fat" value={`${fatConsumed}g`} progress={(fatConsumed / fatTarget) * 100} />
                                    <StatsCard label="Fibre" value={`${fibreConsumed}g`} progress={(fibreConsumed / fibreTarget) * 100} />
                                    <StatsCard label="Meals" value={`${meals.length}`} progress={100} />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="micro"
                                    initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                                    className="relative w-full"
                                >
                                    {!isTrakPlus && (
                                        <div className="absolute inset-0 z-10 backdrop-blur-sm bg-black/40 rounded-2xl flex flex-col items-center justify-center gap-2">
                                            <Crown className="w-6 h-6 text-amber-400" />
                                            <p className="text-xs font-bold text-amber-400">Trak+ Feature</p>
                                            <p className="text-[10px] text-white/50 text-center px-8">Upgrade to see micronutrient tracking</p>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-2 gap-2">
                                        <MicroCard label="Sodium" value={sodiumTotal} unit="mg" target={MICRO_TARGETS.sodium} onClick={() => setMicroInfo('Sodium')} colorClass="bg-sky-400" />
                                        <MicroCard label="Potassium" value={potassiumTotal} unit="mg" target={MICRO_TARGETS.potassium} onClick={() => setMicroInfo('Potassium')} colorClass="bg-yellow-400" />
                                        <MicroCard label="Calcium" value={calciumTotal} unit="mg" target={MICRO_TARGETS.calcium} onClick={() => setMicroInfo('Calcium')} colorClass="bg-slate-200" />
                                        <MicroCard label="Magnesium" value={magnesiumTotal} unit="mg" target={MICRO_TARGETS.magnesium} onClick={() => setMicroInfo('Magnesium')} colorClass="bg-pink-400" />
                                        <MicroCard label="Iron" value={ironTotal} unit="mg" target={MICRO_TARGETS.iron} onClick={() => setMicroInfo('Iron')} colorClass="bg-red-400" />
                                        <MicroCard label="Zinc" value={zincTotal} unit="mg" target={MICRO_TARGETS.zinc} onClick={() => setMicroInfo('Zinc')} colorClass="bg-purple-400" />
                                        <MicroCard label="Vit C" value={vitCTotal} unit="mg" target={MICRO_TARGETS.vitamin_c} onClick={() => setMicroInfo('Vit C')} colorClass="bg-orange-500" />
                                        <MicroCard label="Vit D" value={vitDTotal} unit="mcg" target={MICRO_TARGETS.vitamin_d} onClick={() => setMicroInfo('Vit D')} colorClass="bg-amber-400" />
                                        <MicroCard label="Vit B12" value={vitB12Total} unit="mcg" target={MICRO_TARGETS.vitamin_b12} onClick={() => setMicroInfo('Vit B12')} colorClass="bg-rose-500" />
                                        <MicroCard label="Folate" value={folateTotal} unit="mcg" target={MICRO_TARGETS.folate} onClick={() => setMicroInfo('Folate')} colorClass="bg-green-400" />
                                    </div>

                                    {/* Micro Info Modal */}
                                    <AnimatePresence>
                                        {microInfo && MICRO_INFO[microInfo] && (
                                            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                                    className="w-full max-w-sm bg-brand-black border border-white/10 rounded-[32px] p-6 relative shadow-2xl"
                                                >
                                                    <button onClick={() => setMicroInfo(null)} className="absolute top-5 right-5 text-white/40 hover:text-white transition-colors bg-white/5 rounded-full p-2">
                                                        <X className="w-5 h-5" />
                                                    </button>
                                                    <div className="mb-6 mt-2">
                                                        <h3 className="text-3xl font-black mb-1">{microInfo}</h3>
                                                        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-emerald">Micronutrient Guide</p>
                                                    </div>
                                                    <div className="space-y-4">
                                                        <div>
                                                            <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1.5">Why you need it</p>
                                                            <p className="text-sm text-white/80 leading-relaxed font-medium">{MICRO_INFO[microInfo].why}</p>
                                                        </div>
                                                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                                            <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-2">Best Sources</p>
                                                            <p className="text-sm text-white/90 leading-relaxed font-medium">{MICRO_INFO[microInfo].sources}</p>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => setMicroInfo(null)} className="w-full mt-6 py-4 bg-white/10 hover:bg-white/20 transition-colors rounded-2xl font-bold text-sm tracking-wide">Got it</button>
                                                </motion.div>
                                            </div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </>
                )}
            </div>

            {/* Add Meal Text Input */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60">Log a Meal</h3>
                </div>

                {/* Snap-to-Trak Premium Entry */}
                <button
                    onClick={() => setIsSnapModalOpen(true)}
                    className="w-full relative overflow-hidden rounded-3xl p-6 border border-amber-500/20 group transition-all"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-black via-brand-black to-amber-900/20 z-0"></div>
                    <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(245,158,11,0.15)]">
                                <ScanLine className="w-5 h-5 text-amber-500" />
                            </div>
                            <div className="text-left">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-bold text-lg text-white">Snap-to-Trak</h4>
                                    <span className="px-2 py-0.5 rounded-sm bg-amber-500/20 text-amber-500 text-[9px] font-black uppercase tracking-wider">Pro</span>
                                </div>
                                <p className="text-xs text-muted-foreground">Log meals instantly with Vision AI</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-white transition-colors" />
                    </div>
                </button>

                {/* Standard Text Logging */}
                <div className="flex flex-col gap-3 bg-white/5 border border-white/10 rounded-3xl p-3 transition-all focus-within:bg-white/[0.07] focus-within:border-brand-emerald/50">
                    <textarea
                        placeholder="Or manually type it (e.g. 2 eggs and a black coffee)..."
                        className="w-full bg-transparent outline-none px-3 py-2 text-sm resize-none min-h-[60px]"
                        value={mealInput}
                        onChange={(e) => setMealInput(e.target.value)}
                        disabled={isSubmitting}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddMeal(); } }}
                    />

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                        <div className="flex flex-wrap gap-2 flex-1 items-center">
                            <QuickAction label="Breakfast" icon={Coffee} isActive={selectedType === "Breakfast"} onClick={() => setSelectedType("Breakfast")} />
                            <QuickAction label="Lunch" icon={Pizza} isActive={selectedType === "Lunch"} onClick={() => setSelectedType("Lunch")} />
                            <QuickAction label="Dinner" icon={Drumstick} isActive={selectedType === "Dinner"} onClick={() => setSelectedType("Dinner")} />
                            <QuickAction label="Snack" icon={Apple} isActive={selectedType === "Snack"} onClick={() => setSelectedType("Snack")} />
                        </div>
                        <button
                            onClick={handleAddMeal}
                            disabled={!mealInput.trim() || isSubmitting}
                            className="h-9 px-5 bg-brand-emerald text-brand-black text-sm font-bold rounded-2xl flex items-center justify-center transition-transform active:scale-95 disabled:opacity-50 disabled:grayscale flex-shrink-0"
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
                                                    {meal.text_entry.includes(' |:| ') ? meal.text_entry.split(' |:| ')[0] : meal.text_entry}
                                                </h4>
                                                {meal.text_entry.includes(' |:| ') && (
                                                    <p className="text-[11px] text-muted-foreground/80 mt-0.5 line-clamp-1 italic">
                                                        &quot;{meal.text_entry.split(' |:| ')[1]}&quot;
                                                    </p>
                                                )}
                                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground font-medium uppercase tracking-wider mt-1 w-full max-w-[150px]">
                                                    <span className="w-[50px]">P: {Math.round(meal.protein || 0)}g</span>
                                                    <span className="w-[50px]">C: {Math.round(meal.carbs || 0)}g</span>
                                                    <span className="w-[50px]">F: {Math.round(meal.fat || 0)}g</span>
                                                    <span className="w-[50px]">Fi: {Math.round(meal.fibre || 0)}g</span>
                                                    <span className="w-[50px]">S: {Math.round(meal.sugar || 0)}g</span>
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

            <SnapToTrakModal
                isOpen={isSnapModalOpen}
                onClose={() => setIsSnapModalOpen(false)}
                onLogMeal={handleLogVisionMeal}
            />

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

function MicroCard({ label, value, unit, target, onClick, colorClass }: { label: string; value: number; unit: string; target: number; onClick?: () => void; colorClass: string }) {
    const pct = Math.min((value / target) * 100, 100);
    const textClass = colorClass.replace('bg-', 'text-');

    return (
        <button onClick={onClick} className="flex flex-col items-start gap-1 bg-white/[0.03] border border-white/5 rounded-2xl p-3.5 w-full text-left active:bg-white/10 transition-all hover:bg-white/[0.05]">
            <span className={`text-[10px] uppercase tracking-widest font-bold ${textClass}`}>{label}</span>
            <div className="flex items-end gap-1 mt-1">
                <span className="text-2xl font-black leading-none">{value}</span>
                <span className="text-[10px] text-muted-foreground mb-0.5">{unit}</span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full mt-2 overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                    transition={{ duration: 1, delay: 0.5 }} className={`h-full rounded-full ${colorClass}`} />
            </div>
            <span className="text-[9px] text-white/30 font-medium mt-1 uppercase tracking-wider">{target}{unit} goal</span>
        </button>
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

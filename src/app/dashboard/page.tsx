"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Plus, Flame, Target, Trophy, ChevronRight, Apple, Drumstick, Pizza, Coffee } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { useState } from "react";
import Link from "next/link";

const meals = [
    { id: 1, name: "Egg & Avocado Toast", cals: 340, macros: "P: 12g • C: 24g • F: 18g", time: "8:30 AM", icon: Coffee },
    { id: 2, name: "Grilled Chicken Salad", cals: 420, macros: "P: 45g • C: 12g • F: 14g", time: "12:45 PM", icon: Drumstick },
];

export default function Dashboard() {
    const [mealInput, setMealInput] = useState("");
    const goal = 2400;
    const consumed = 760;
    const percentage = (consumed / goal) * 100;

    return (
        <div className="flex flex-col min-h-screen bg-background pb-32">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-6 border-b border-white/5">
                <Link href="/dashboard">
                    <Logo className="text-xl" animate={false} />
                </Link>
                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Today</span>
                        <span className="text-sm font-semibold">Feb 28</span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-brand-emerald/10 border border-brand-emerald/20 flex items-center justify-center overflow-hidden">
                        <span className="text-brand-emerald text-xs font-bold">SC</span>
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
                        <StatsCard label="Protein" value="57g" sub="Target: 180g" progress={32} />
                        <StatsCard label="Carbs" value="36g" sub="Target: 220g" progress={16} />
                        <StatsCard label="Fat" value="32g" sub="Target: 80g" progress={40} />
                    </div>
                </div>

                {/* AI Input Area */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60">What did you eat today?</h3>
                    <div className="relative group">
                        <input
                            type="text"
                            placeholder="2 eggs and a black coffee..."
                            className="w-full bg-white/5 border border-white/10 focus:border-brand-emerald/50 outline-none rounded-3xl px-6 py-5 pr-16 text-lg transition-all focus:bg-white/[0.07]"
                            value={mealInput}
                            onChange={(e) => setMealInput(e.target.value)}
                        />
                        <button className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-brand-emerald text-brand-black rounded-2xl flex items-center justify-center transition-transform active:scale-95 group-focus-within:shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                            <Plus className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                        <QuickAction label="Breakfast" icon={Coffee} />
                        <QuickAction label="Lunch" icon={Pizza} />
                        <QuickAction label="Dinner" icon={Drumstick} />
                        <QuickAction label="Snack" icon={Apple} />
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
                        {meals.map((meal) => (
                            <motion.div
                                key={meal.id}
                                initial={{ opacity: 0, x: -10 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                className="flex items-center justify-between p-5 bg-white/5 border border-white/5 rounded-3xl group transition-all hover:bg-white/[0.08]"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-brand-emerald/10 transition-colors">
                                        <meal.icon className="w-5 h-5 text-muted-foreground group-hover:text-brand-emerald transition-colors" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-foreground/90">{meal.name}</h4>
                                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{meal.macros} • {meal.time}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-lg font-bold">+{meal.cals}</span>
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">kcal</p>
                                </div>
                            </motion.div>
                        ))}
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

function StatsCard({ label, value, sub, progress }: { label: string, value: string, sub: string, progress: number }) {
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

function QuickAction({ label, icon: Icon }: { label: string, icon: any }) {
    return (
        <button className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/5 rounded-2xl whitespace-nowrap text-xs font-semibold text-muted-foreground transition-all hover:bg-brand-emerald/10 hover:text-brand-emerald hover:border-brand-emerald/20">
            <Icon className="w-3 h-3" />
            {label}
        </button>
    )
}

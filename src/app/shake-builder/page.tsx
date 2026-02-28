"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Check, Info, Zap, Leaf, Brain, FlaskConical } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const presets = [
    {
        id: "energy",
        name: "Energy Boost",
        ingredients: "Kale, Berries, 5g Creatine",
        quote: "Focus on the marginal gains.",
        author: "Dr. Andrew Huberman",
        price: "$4.50",
        color: "text-emerald-400",
        icon: Zap
    },
    {
        id: "recovery",
        name: "Night Recovery",
        ingredients: "Casein, Magnesium, Tart Cherry",
        quote: "Sleep is the greatest legal performance enhancer.",
        author: "Dr. Matthew Walker",
        price: "$5.20",
        color: "text-purple-400",
        icon: Brain
    },
];

const ingredients = [
    { id: "creatine", name: "Creatine Monohydrate", dose: "5g", price: 0.50, icon: Zap },
    { id: "protein", name: "Whey Isolate", dose: "25g", price: 1.20, icon: FlaskConical },
    { id: "magnesium", name: "Magnesium Glycinate", dose: "400mg", price: 0.30, icon: Brain },
    { id: "greens", name: "Super Greens", dose: "1 scoop", price: 0.80, icon: Leaf },
];

export default function ShakeBuilder() {
    const [tab, setTab] = useState<"recommended" | "custom">("recommended");
    const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);

    const toggleIngredient = (id: string) => {
        setSelectedIngredients(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const totalPrice = selectedIngredients.reduce((acc, id) => {
        const item = ingredients.find(i => i.id === id);
        return acc + (item?.price || 0);
    }, 2.50); // Base price

    return (
        <div className="flex flex-col min-h-screen bg-background pb-12">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-6 sticky top-0 bg-background/80 backdrop-blur-xl z-50">
                <Link href="/dashboard">
                    <button className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/5 active:scale-90 transition-transform">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                </Link>
                <span className="text-sm font-bold uppercase tracking-[0.2em]">Shake Builder</span>
                <div className="w-10" />
            </div>

            <div className="px-6 py-4 space-y-8">
                {/* Tabs */}
                <div className="flex p-1 bg-white/5 border border-white/5 rounded-2xl">
                    {(["recommended", "custom"] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={cn(
                                "flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all",
                                tab === t ? "bg-white/10 text-white shadow-lg" : "text-muted-foreground hover:text-white"
                            )}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {tab === "recommended" ? (
                        <motion.div
                            key="rec"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            <div className="p-5 bg-brand-emerald/10 border border-brand-emerald/20 rounded-3xl flex items-start gap-4">
                                <Info className="w-5 h-5 text-brand-emerald shrink-0 mt-0.5" />
                                <p className="text-xs text-brand-emerald/90 leading-relaxed font-medium">
                                    Based on your profile, you are low on magnesium. Consider adding super greens or a supplement.
                                </p>
                            </div>

                            <div className="space-y-4">
                                {presets.map((preset) => (
                                    <div key={preset.id} className="group relative overflow-hidden p-6 bg-white/5 border border-white/5 rounded-[2rem] transition-all hover:bg-white/[0.08] hover:border-white/10">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                                                <preset.icon className={cn("w-6 h-6", preset.color)} />
                                            </div>
                                            <span className="text-xl font-bold">{preset.price}</span>
                                        </div>
                                        <div className="space-y-1 mb-8">
                                            <h3 className="text-xl font-bold">{preset.name}</h3>
                                            <p className="text-sm text-muted-foreground">{preset.ingredients}</p>
                                        </div>
                                        <blockquote className="border-l-2 border-white/10 pl-4 py-1 italic font-serif text-sm text-white/40 mb-8 max-w-[200px]">
                                            &quot;{preset.quote}&quot;
                                            <footer className="text-[10px] uppercase tracking-widest not-italic mt-2 font-sans font-bold text-white/20">
                                                — {preset.author}
                                            </footer>
                                        </blockquote>
                                        <button className="w-full py-4 bg-white text-brand-black font-bold rounded-2xl transition-all active:scale-[0.98]">
                                            Select Preset
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="custom"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-8"
                        >
                            <div className="space-y-6">
                                <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Base Ingredients</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    {ingredients.map((ing) => (
                                        <button
                                            key={ing.id}
                                            onClick={() => toggleIngredient(ing.id)}
                                            className={cn(
                                                "flex items-center justify-between p-5 rounded-[1.5rem] border transition-all",
                                                selectedIngredients.includes(ing.id)
                                                    ? "bg-brand-emerald/10 border-brand-emerald/30"
                                                    : "bg-white/5 border-white/5"
                                            )}
                                        >
                                            <div className="flex items-center gap-4 text-left">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-xl flex items-center justify-center",
                                                    selectedIngredients.includes(ing.id) ? "bg-brand-emerald text-brand-black" : "bg-white/5 text-muted-foreground"
                                                )}>
                                                    <ing.icon className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-sm">{ing.name}</h4>
                                                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{ing.dose}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-bold text-muted-foreground">+${ing.price.toFixed(2)}</span>
                                                <div className={cn(
                                                    "w-6 h-6 rounded-full border flex items-center justify-center transition-all",
                                                    selectedIngredients.includes(ing.id) ? "bg-brand-emerald border-brand-emerald" : "border-white/10"
                                                )}>
                                                    {selectedIngredients.includes(ing.id) && <Check className="w-3.5 h-3.5 text-brand-black" />}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent pt-12">
                                <button className="w-full group relative py-5 bg-brand-emerald text-brand-black font-bold rounded-2xl flex items-center justify-between px-8 transition-all hover:scale-[1.01] active:scale-[0.99] overflow-hidden">
                                    <span className="relative z-10">Add to Plan</span>
                                    <span className="relative z-10 text-xl tracking-tighter">${totalPrice.toFixed(2)}</span>
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

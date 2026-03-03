"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
    X, ChevronRight,
    Pill, Zap, Droplets, Apple, Dumbbell, Check,
    Heart, Star, Flame, Moon, Sun, Coffee, Book, Leaf, Brain,
    Music, Smile, Shield, Clock, Compass, Diamond, Sparkles, Target, Medal, Eye
} from "lucide-react";
import { useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";

const ICON_OPTIONS = [
    { name: "Pill", icon: Pill },
    { name: "Heart", icon: Heart },
    { name: "Star", icon: Star },
    { name: "Flame", icon: Flame },
    { name: "Droplets", icon: Droplets },
    { name: "Apple", icon: Apple },
    { name: "Dumbbell", icon: Dumbbell },
    { name: "Moon", icon: Moon },
    { name: "Sun", icon: Sun },
    { name: "Coffee", icon: Coffee },
    { name: "Book", icon: Book },
    { name: "Leaf", icon: Leaf },
    { name: "Brain", icon: Brain },
    { name: "Zap", icon: Zap },
    { name: "Music", icon: Music },
    { name: "Smile", icon: Smile },
    { name: "Shield", icon: Shield },
    { name: "Clock", icon: Clock },
    { name: "Compass", icon: Compass },
    { name: "Diamond", icon: Diamond },
    { name: "Sparkles", icon: Sparkles },
    { name: "Target", icon: Target },
    { name: "Medal", icon: Medal },
    { name: "Eye", icon: Eye },
];

const COLOR_OPTIONS = [
    { name: "emerald", class: "bg-emerald-400" },
    { name: "blue-400", class: "bg-blue-400" },
    { name: "purple-400", class: "bg-purple-400" },
    { name: "orange-400", class: "bg-orange-400" },
    { name: "yellow-400", class: "bg-yellow-400" },
    { name: "pink-400", class: "bg-pink-400" },
    { name: "red-400", class: "bg-red-400" },
    { name: "cyan-400", class: "bg-cyan-400" },
    { name: "lime-400", class: "bg-lime-400" },
    { name: "rose-400", class: "bg-rose-400" },
];

interface AddHabitModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => void;
}

export default function AddHabitModal({ isOpen, onClose, onCreated }: AddHabitModalProps) {
    const [step, setStep] = useState(1);
    const [name, setName] = useState("");
    const [trackType, setTrackType] = useState<"boolean" | "count">("boolean");
    const [targetValue, setTargetValue] = useState(1);
    const [unit, setUnit] = useState("");
    const [incrementBy, setIncrementBy] = useState(1);
    const [selectedIcon, setSelectedIcon] = useState("Star");
    const [selectedColor, setSelectedColor] = useState("emerald");
    const [isCreating, setIsCreating] = useState(false);

    const supabaseRef = useRef(createClient());

    const reset = () => {
        setStep(1);
        setName("");
        setTrackType("boolean");
        setTargetValue(1);
        setUnit("");
        setIncrementBy(1);
        setSelectedIcon("Star");
        setSelectedColor("emerald");
    };

    const handleCreate = async () => {
        if (!name.trim()) return;
        setIsCreating(true);

        const supabase = supabaseRef.current;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase.from('habit_definitions').insert({
            user_id: user.id,
            name: name.trim(),
            icon: selectedIcon,
            color: selectedColor,
            target_value: trackType === "boolean" ? 1 : targetValue,
            unit: trackType === "boolean" ? null : unit || null,
            increment_by: trackType === "boolean" ? 1 : incrementBy,
            track_type: trackType,
            sort_order: 99,
            is_active: true,
        });

        setIsCreating(false);
        onCreated();
        onClose();
        reset();
    };

    const SelectedIconComponent = ICON_OPTIONS.find(o => o.name === selectedIcon)?.icon || Star;
    const selectedColorClass = COLOR_OPTIONS.find(c => c.name === selectedColor)?.class || "bg-emerald-400";

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className="fixed inset-x-4 top-[10vh] bottom-auto z-50 bg-card border border-white/5 rounded-3xl overflow-hidden max-h-[80vh] overflow-y-auto"
                    >
                        <div className="p-6 space-y-6">
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold">New Habit</h3>
                                <button onClick={() => { onClose(); reset(); }}
                                    className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Step Indicator */}
                            <div className="flex gap-2">
                                {[1, 2, 3].map(s => (
                                    <div key={s} className={cn(
                                        "h-1 flex-1 rounded-full transition-colors duration-300",
                                        s <= step ? "bg-brand-emerald" : "bg-white/10"
                                    )} />
                                ))}
                            </div>

                            {/* Preview Card */}
                            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", selectedColorClass + "/20")}>
                                    <SelectedIconComponent className={cn("w-5 h-5", selectedColorClass.replace('bg-', 'text-'))} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm">{name || "Habit Name"}</h4>
                                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                                        {trackType === "boolean" ? "Yes / No" : `${targetValue} ${unit || "units"}`}
                                    </p>
                                </div>
                            </div>

                            <AnimatePresence mode="wait">
                                {/* Step 1: Name & Type */}
                                {step === 1 && (
                                    <motion.div
                                        key="step1"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-6"
                                    >
                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Habit Name</label>
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="e.g. Read 30 min"
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 outline-none focus:border-brand-emerald/50 transition-colors"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Tracking Type</label>
                                            <div className="flex gap-3">
                                                {(["boolean", "count"] as const).map(t => (
                                                    <button
                                                        key={t}
                                                        onClick={() => setTrackType(t)}
                                                        className={cn(
                                                            "flex-1 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest border transition-all",
                                                            trackType === t ? "bg-white/10 border-brand-emerald/50 text-white" : "bg-white/5 border-white/5 text-muted-foreground"
                                                        )}
                                                    >
                                                        {t === "boolean" ? "Yes / No" : "Count"}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {trackType === "count" && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                className="space-y-4"
                                            >
                                                <div className="grid grid-cols-3 gap-3">
                                                    <div className="space-y-1">
                                                        <label className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Target</label>
                                                        <input type="number" value={targetValue} onChange={e => setTargetValue(Number(e.target.value))}
                                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none text-center" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Unit</label>
                                                        <input type="text" value={unit} onChange={e => setUnit(e.target.value)} placeholder="cups"
                                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none text-center" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Step</label>
                                                        <input type="number" value={incrementBy} onChange={e => setIncrementBy(Number(e.target.value))}
                                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none text-center" />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}

                                        <button
                                            onClick={() => setStep(2)}
                                            disabled={!name.trim()}
                                            className="w-full py-4 bg-white/10 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all hover:bg-white/15 disabled:opacity-30"
                                        >
                                            Next <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </motion.div>
                                )}

                                {/* Step 2: Icon Picker */}
                                {step === 2 && (
                                    <motion.div
                                        key="step2"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-4"
                                    >
                                        <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Choose Icon</label>
                                        <div className="grid grid-cols-6 gap-3">
                                            {ICON_OPTIONS.map(opt => (
                                                <motion.button
                                                    key={opt.name}
                                                    whileTap={{ scale: 0.85 }}
                                                    onClick={() => setSelectedIcon(opt.name)}
                                                    className={cn(
                                                        "w-full aspect-square rounded-2xl flex items-center justify-center transition-all",
                                                        selectedIcon === opt.name
                                                            ? "bg-white/10 ring-2 ring-brand-emerald"
                                                            : "bg-white/5 hover:bg-white/[0.08]"
                                                    )}
                                                >
                                                    <opt.icon className={cn("w-5 h-5", selectedIcon === opt.name ? "text-brand-emerald" : "text-muted-foreground")} />
                                                </motion.button>
                                            ))}
                                        </div>
                                        <button
                                            onClick={() => setStep(3)}
                                            className="w-full py-4 bg-white/10 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all hover:bg-white/15"
                                        >
                                            Next <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </motion.div>
                                )}

                                {/* Step 3: Color Picker */}
                                {step === 3 && (
                                    <motion.div
                                        key="step3"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-6"
                                    >
                                        <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Choose Color</label>
                                        <div className="flex flex-wrap gap-4 justify-center">
                                            {COLOR_OPTIONS.map(color => (
                                                <motion.button
                                                    key={color.name}
                                                    whileTap={{ scale: 0.85 }}
                                                    onClick={() => setSelectedColor(color.name)}
                                                    className={cn(
                                                        "w-12 h-12 rounded-full transition-all",
                                                        color.class,
                                                        selectedColor === color.name
                                                            ? "ring-2 ring-offset-2 ring-offset-card ring-white scale-110"
                                                            : "opacity-60 hover:opacity-80"
                                                    )}
                                                />
                                            ))}
                                        </div>
                                        <button
                                            onClick={handleCreate}
                                            disabled={isCreating}
                                            className="w-full py-5 bg-brand-emerald text-brand-black font-bold rounded-2xl text-lg transition-all hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {isCreating ? "Creating..." : (
                                                <><Check className="w-5 h-5" /> Create Habit</>
                                            )}
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Back button for steps 2/3 */}
                            {step > 1 && (
                                <button
                                    onClick={() => setStep(step - 1)}
                                    className="w-full py-3 text-sm text-muted-foreground hover:text-white transition-colors"
                                >
                                    ← Back
                                </button>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

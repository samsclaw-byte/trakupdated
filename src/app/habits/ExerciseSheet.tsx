"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
    X, Minus, Plus,
    PersonStanding, Dumbbell, Bike, Waves, Flower2,
    Footprints, Zap, Swords, Wind, Trophy
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const EXERCISE_TYPES = [
    { id: "running", label: "Running", icon: PersonStanding, color: "text-emerald-400" },
    { id: "weights", label: "Weights", icon: Dumbbell, color: "text-orange-400" },
    { id: "cycling", label: "Cycling", icon: Bike, color: "text-blue-400" },
    { id: "swimming", label: "Swimming", icon: Waves, color: "text-cyan-400" },
    { id: "yoga", label: "Yoga", icon: Flower2, color: "text-purple-400" },
    { id: "walking", label: "Walking", icon: Footprints, color: "text-lime-400" },
    { id: "hiit", label: "HIIT", icon: Zap, color: "text-red-400" },
    { id: "boxing", label: "Boxing", icon: Swords, color: "text-rose-400" },
    { id: "pilates", label: "Pilates", icon: Wind, color: "text-pink-400" },
    { id: "sports", label: "Sports", icon: Trophy, color: "text-yellow-400" },
];

interface ExerciseSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onLog: (exerciseType: string, duration: number) => void;
}

export default function ExerciseSheet({ isOpen, onClose, onLog }: ExerciseSheetProps) {
    const [selectedType, setSelectedType] = useState("running");
    const [duration, setDuration] = useState(30);

    const selected = EXERCISE_TYPES.find(t => t.id === selectedType) || EXERCISE_TYPES[0];

    const handleLog = () => {
        onLog(selected.label, duration);
        setDuration(30);
        setSelectedType("running");
    };

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

                    {/* Sheet */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-white/5 rounded-t-3xl overflow-hidden"
                    >
                        {/* Drag handle */}
                        <div className="flex justify-center py-3">
                            <div className="w-10 h-1 bg-white/20 rounded-full" />
                        </div>

                        <div className="px-6 pb-10 space-y-8">
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold">Log Exercise</h3>
                                <button
                                    onClick={onClose}
                                    className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center transition-all hover:bg-white/10"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Exercise Type Picker */}
                            <div className="space-y-4">
                                <div className="flex gap-3 overflow-x-auto scrollbar-none pb-2">
                                    {EXERCISE_TYPES.map((type) => {
                                        const isActive = selectedType === type.id;
                                        return (
                                            <motion.button
                                                key={type.id}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => setSelectedType(type.id)}
                                                className={cn(
                                                    "flex flex-col items-center gap-2 min-w-[64px]",
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300",
                                                    isActive
                                                        ? "bg-white/10 ring-2 ring-brand-emerald scale-110"
                                                        : "bg-white/5"
                                                )}>
                                                    <type.icon className={cn("w-6 h-6 transition-colors", isActive ? type.color : "text-muted-foreground")} />
                                                </div>
                                                <span className={cn(
                                                    "text-[9px] uppercase tracking-wider font-bold transition-colors",
                                                    isActive ? "text-white" : "text-muted-foreground"
                                                )}>
                                                    {type.label}
                                                </span>
                                            </motion.button>
                                        );
                                    })}
                                </div>
                                <p className={cn("text-center text-sm font-bold", selected.color)}>{selected.label}</p>
                            </div>

                            {/* Duration Picker */}
                            <div className="flex items-center justify-center gap-8">
                                <motion.button
                                    whileTap={{ scale: 0.85 }}
                                    onClick={() => setDuration(Math.max(5, duration - 5))}
                                    className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center transition-all hover:bg-white/10"
                                >
                                    <Minus className="w-5 h-5" />
                                </motion.button>
                                <div className="text-center">
                                    <motion.span
                                        key={duration}
                                        initial={{ scale: 1.2, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="text-5xl font-bold tracking-tighter block"
                                    >
                                        {duration}
                                    </motion.span>
                                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">minutes</span>
                                </div>
                                <motion.button
                                    whileTap={{ scale: 0.85 }}
                                    onClick={() => setDuration(Math.min(300, duration + 5))}
                                    className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center transition-all hover:bg-white/10"
                                >
                                    <Plus className="w-5 h-5" />
                                </motion.button>
                            </div>

                            {/* Log Button */}
                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                onClick={handleLog}
                                className="w-full py-5 bg-brand-emerald text-brand-black font-bold rounded-2xl text-lg transition-all hover:brightness-110"
                            >
                                Log Session
                            </motion.button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

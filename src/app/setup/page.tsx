"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Check, Sofa, Footprints, Activity, Dumbbell, Zap } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { useRouter } from "next/navigation";

const steps = [
    { id: "personal", title: "Basic Info", description: "Tell us about yourself." },
    { id: "stats", title: "Stats", description: "Numerical baseline." },
    { id: "activity", title: "Activity", description: "Your daily movement." },
];

export default function SetupPage() {
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState({
        name: "",
        age: "",
        weight: "",
        weightUnit: "kg",
        height: "",
        heightUnit: "cm",
        gender: "male",
        activity: 3,
    });
    const router = useRouter();

    const nextStep = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(s => s + 1);
        } else {
            router.push("/loading-calc");
        }
    };

    const prevStep = () => setCurrentStep(s => Math.max(0, s - 1));

    return (
        <div className="flex flex-col min-h-screen bg-background p-6">
            <div className="flex items-center justify-between mb-12">
                <Logo className="text-2xl" animate={false} />
                <div className="flex gap-1">
                    {steps.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1 w-8 rounded-full transition-colors duration-500 ${i <= currentStep ? "bg-brand-emerald" : "bg-border"
                                }`}
                        />
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="flex-1 flex flex-col"
                >
                    <div className="mb-8">
                        <h2 className="text-3xl font-semibold tracking-tight mb-2">
                            {steps[currentStep].title}
                        </h2>
                        <p className="text-muted-foreground">
                            {steps[currentStep].description}
                        </p>
                    </div>

                    <div className="flex-1 space-y-8">
                        {currentStep === 0 && (
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Name</label>
                                    <input
                                        type="text"
                                        placeholder="Enter your name"
                                        className="w-full bg-white/5 border border-border focus:border-brand-emerald outline-none rounded-2xl px-5 py-4 text-lg transition-all"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Gender</label>
                                    <div className="flex gap-4">
                                        {["Male", "Female", "Other"].map((g) => (
                                            <button
                                                key={g}
                                                onClick={() => setFormData({ ...formData, gender: g.toLowerCase() })}
                                                className={`flex-1 py-4 rounded-2xl border transition-all ${formData.gender === g.toLowerCase()
                                                    ? "bg-brand-emerald text-brand-black border-brand-emerald font-semibold"
                                                    : "bg-white/5 border-border text-muted-foreground"
                                                    }`}
                                            >
                                                {g}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentStep === 1 && (
                            <div className="space-y-8">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Age</label>
                                        <input
                                            type="number"
                                            placeholder="25"
                                            className="w-full bg-white/5 border border-border focus:border-brand-emerald outline-none rounded-2xl px-5 py-4 text-lg transition-all text-center"
                                            value={formData.age}
                                            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Weight</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                placeholder="70"
                                                className="w-full bg-white/5 border border-border focus:border-brand-emerald outline-none rounded-2xl px-5 py-4 text-lg transition-all text-center pr-12"
                                                value={formData.weight}
                                                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                            />
                                            <button
                                                onClick={() => setFormData({ ...formData, weightUnit: formData.weightUnit === 'kg' ? 'lb' : 'kg' })}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-brand-emerald"
                                            >
                                                {formData.weightUnit.toUpperCase()}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Height ({formData.heightUnit})</label>
                                    <input
                                        type="number"
                                        placeholder="180"
                                        className="w-full bg-white/5 border border-border focus:border-brand-emerald outline-none rounded-2xl px-5 py-4 text-lg transition-all"
                                        value={formData.height}
                                        onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="space-y-12 py-8">
                                <div className="flex justify-between items-end px-4 h-24">
                                    {[
                                        { level: 1, icon: Sofa },
                                        { level: 2, icon: Footprints },
                                        { level: 3, icon: Activity },
                                        { level: 4, icon: Dumbbell },
                                        { level: 5, icon: Zap }
                                    ].map((item) => (
                                        <motion.div
                                            key={item.level}
                                            initial={false}
                                            animate={{
                                                scale: formData.activity === item.level ? 1.5 : 1,
                                                opacity: formData.activity === item.level ? 1 : 0.2,
                                                y: formData.activity === item.level ? -10 : 0,
                                                color: formData.activity === item.level ? "#22c55e" : "#94a3b8"
                                            }}
                                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                            className="flex flex-col items-center gap-4"
                                        >
                                            <item.icon className="w-8 h-8" />
                                            <div className={`w-1.5 h-1.5 rounded-full ${formData.activity >= item.level ? "bg-brand-emerald" : "bg-border"}`} />
                                        </motion.div>
                                    ))}
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max="5"
                                    step="1"
                                    className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-brand-emerald"
                                    value={formData.activity}
                                    onChange={(e) => setFormData({ ...formData, activity: parseInt(e.target.value) })}
                                />
                                <div className="text-center space-y-2">
                                    <h3 className="text-xl font-medium">
                                        {formData.activity === 1 && "Sedentary"}
                                        {formData.activity === 2 && "Lightly Active"}
                                        {formData.activity === 3 && "Moderately Active"}
                                        {formData.activity === 4 && "Very Active"}
                                        {formData.activity === 5 && "High Performance"}
                                    </h3>
                                    <p className="text-sm text-muted-foreground px-12">
                                        {formData.activity === 1 && "Minimal movement. Office job."}
                                        {formData.activity === 2 && "Light walking. 1-2 workouts/week."}
                                        {formData.activity === 3 && "Daily activity. 3-4 workouts/week."}
                                        {formData.activity === 4 && "Physical job. Daily intense exercise."}
                                        {formData.activity === 5 && "Elite training. Pro-athlete level."}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </AnimatePresence>

            <div className="flex gap-4 pt-12">
                {currentStep > 0 && (
                    <button
                        onClick={prevStep}
                        className="p-5 border border-border rounded-2xl text-muted-foreground hover:bg-white/5 transition-all"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                )}
                <button
                    onClick={nextStep}
                    disabled={currentStep === 0 && !formData.name}
                    className="flex-1 flex items-center justify-center gap-2 py-5 bg-brand-emerald text-brand-black font-bold rounded-2xl transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:grayscale"
                >
                    {currentStep === steps.length - 1 ? (
                        <>Complete <Check className="w-5 h-5" /></>
                    ) : (
                        <>Continue <ChevronRight className="w-5 h-5" /></>
                    )}
                </button>
            </div>
        </div>
    );
}

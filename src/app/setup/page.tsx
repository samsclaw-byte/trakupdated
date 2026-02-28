"use client";

import { useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { useRouter } from "next/navigation";

// Premium Grade Animated Vectors
const drawVariants: Variants = {
    inactive: { pathLength: 1, opacity: 0.3, transition: { duration: 0.5 } },
    active: {
        pathLength: [0, 1],
        opacity: [0.3, 1],
        transition: { duration: 1.2, ease: "easeOut" }
    }
};

const PremiumIconSofa = ({ className, isActive }: { className?: string, isActive: boolean }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <motion.path variants={drawVariants} initial="inactive" animate={isActive ? "active" : "inactive"} d="M4 6c0 0 2 8 5 10s5 1 8-1c1.5-1 3-2.5 3-2.5" />
        <motion.path variants={drawVariants} initial="inactive" animate={isActive ? "active" : "inactive"} d="M8 14l-2 5M15 15l2 4M5 20h14" />
    </svg>
);

const PremiumIconWalking = ({ className, isActive }: { className?: string, isActive: boolean }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <motion.circle variants={drawVariants} initial="inactive" animate={isActive ? "active" : "inactive"} cx="12" cy="4" r="2" />
        <motion.path variants={drawVariants} initial="inactive" animate={isActive ? "active" : "inactive"} d="M12 6v7M12 13l2 4 1 3M12 13l-2 4-2 2M12 7l3 2 1 2M12 7l-3 2-1-2" />
    </svg>
);

const PremiumIconJogging = ({ className, isActive }: { className?: string, isActive: boolean }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <motion.circle variants={drawVariants} initial="inactive" animate={isActive ? "active" : "inactive"} cx="14" cy="4" r="2" />
        <motion.path variants={drawVariants} initial="inactive" animate={isActive ? "active" : "inactive"} d="M14 6l-2 7M12 13l3 4 1 3M12 13l-3 3-2-2M13 8l3-1 2 2M13 8l-3 1-2-2" />
    </svg>
);

const PremiumIconRunner = ({ className, isActive }: { className?: string, isActive: boolean }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <motion.circle variants={drawVariants} initial="inactive" animate={isActive ? "active" : "inactive"} cx="16" cy="5" r="2" />
        <motion.path variants={drawVariants} initial="inactive" animate={isActive ? "active" : "inactive"} d="M2 10h4 M4 14h5 M3 18h3M15 8c0 0-2 4-2 6M13 10l3-1 2 2M13 10l-3 1-2-2M13 14l3 3 1 4M13 14l-3 1-2 4" />
    </svg>
);

const PremiumIconTrophy = ({ className, isActive }: { className?: string, isActive: boolean }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <motion.path variants={drawVariants} initial="inactive" animate={isActive ? "active" : "inactive"} d="M6 4h12c0 4-2 7-6 7s-6-3-6-7z" />
        <motion.path variants={drawVariants} initial="inactive" animate={isActive ? "active" : "inactive"} d="M6 4H4c-1 0-2 1-2 2s1 2 2 2h2 M18 4h2c1 0 2 1 2 2s-1 2-2 2h-2M12 11v6 M8 17h8" />
        <motion.path variants={drawVariants} initial="inactive" animate={isActive ? "active" : "inactive"} d="M15 19c0-1.5 1-2 1.5-3 1 1 1.5 2 1.5 3 0 1.5-1.5 2.5-3 2.5s-2-1-2-2.5c0-1 .5-1.5 1-2.5 0 0 .5 1 1 2z" />
    </svg>
);

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
                                        { level: 1, icon: PremiumIconSofa },
                                        { level: 2, icon: PremiumIconWalking },
                                        { level: 3, icon: PremiumIconJogging },
                                        { level: 4, icon: PremiumIconRunner },
                                        { level: 5, icon: PremiumIconTrophy }
                                    ].map((item) => {
                                        const isActive = formData.activity === item.level;
                                        return (
                                            <motion.div
                                                key={item.level}
                                                initial={false}
                                                animate={{
                                                    scale: isActive ? 1.5 : 1,
                                                    color: isActive ? "#10b981" : "#e2e8f0",
                                                    filter: isActive ? "drop-shadow(0px 0px 12px rgba(16,185,129,0.8))" : "drop-shadow(0px 0px 0px rgba(0,0,0,0))"
                                                }}
                                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                                className="flex flex-col items-center gap-4 relative cursor-pointer"
                                                onClick={() => setFormData(prev => ({ ...prev, activity: item.level }))}
                                            >
                                                <item.icon className="w-8 h-8 relative z-10 transition-colors duration-500" isActive={isActive} />
                                                <div className={`w-2 h-2 rounded-full ${isActive ? "bg-brand-emerald shadow-[0_0_12px_rgba(16,185,129,1)]" : "bg-transparent transition-colors duration-500"}`} />
                                            </motion.div>
                                        );
                                    })}                                </div>
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

"use client";

import { motion } from "framer-motion";
import { Flame, Activity, CheckCircle2 } from "lucide-react";

interface HubVitalSignsProps {
    nutritionProgress: number;
    nutritionLabel: string;
    fitnessProgress: number;
    fitnessLabel: string;
    habitsProgress: number;
    habitsLabel: string;
}

export function HubVitalSigns({
    nutritionProgress,
    nutritionLabel,
    fitnessProgress,
    fitnessLabel,
    habitsProgress,
    habitsLabel
}: HubVitalSignsProps) {
    return (
        <div className="w-full">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mb-4 px-1">
                Vital Signs
            </h3>
            <div className="grid grid-cols-3 gap-3">
                <VitalRing
                    icon={Flame}
                    progress={nutritionProgress}
                    label="Nutrition"
                    sublabel={nutritionLabel}
                    color="text-brand-emerald"
                    strokeColor="stroke-brand-emerald"
                />
                <VitalRing
                    icon={Activity}
                    progress={fitnessProgress}
                    label="Fitness"
                    sublabel={fitnessLabel}
                    color="text-blue-400"
                    strokeColor="stroke-blue-400"
                />
                <VitalRing
                    icon={CheckCircle2}
                    progress={habitsProgress}
                    label="Habits"
                    sublabel={habitsLabel}
                    color="text-purple-400"
                    strokeColor="stroke-purple-400"
                />
            </div>
        </div>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function VitalRing({ icon: Icon, progress, label, sublabel, color, strokeColor }: any) {
    const radius = 38;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (Math.min(progress, 100) / 100) * circumference;

    return (
        <div className="flex flex-col items-center bg-white/5 border border-white/5 rounded-3xl p-4 relative overflow-hidden group hover:bg-white/[0.08] transition-colors">
            {/* Subtle background glow */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 blur-2xl opacity-10 ${color.replace('text-', 'bg-')}`} />

            <div className="relative w-16 h-16 mb-3">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                        cx="50" cy="50" r={radius}
                        className="stroke-white/5 fill-none"
                        strokeWidth="8"
                    />
                    <motion.circle
                        cx="50" cy="50" r={radius}
                        className={`${strokeColor} fill-none drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]`}
                        strokeWidth="8"
                        strokeLinecap="round"
                        initial={{ strokeDasharray: `${circumference} ${circumference}`, strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <Icon className={`w-5 h-5 ${color}`} />
                </div>
            </div>

            <span className="text-foreground font-bold text-sm tracking-tight mb-0.5">{label}</span>
            <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-widest text-center leading-tight">
                {sublabel}
            </span>
        </div>
    );
}

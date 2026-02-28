"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const calculationQuotes = [
    "Calculating your BMR…",
    "Calculating expected daily calorie burn…",
    "Optimizing for your activity level…",
    "Building your personal baseline…",
];

export default function LoadingCalcPage() {
    const [index, setIndex] = useState(0);
    const router = useRouter();

    useEffect(() => {
        const timer = setInterval(() => {
            setIndex((prev) => {
                if (prev === calculationQuotes.length - 1) {
                    clearInterval(timer);
                    setTimeout(() => router.push("/dashboard"), 1000);
                    return prev;
                }
                return prev + 1;
            });
        }, 1500);

        return () => clearInterval(timer);
    }, [router]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-brand-black text-white px-8">
            <div className="relative flex flex-col items-center gap-12 max-w-sm text-center">
                {/* Animated Rings */}
                <div className="relative w-32 h-32">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 border-t-2 border-brand-emerald rounded-full opacity-40"
                    />
                    <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-2 border-r-2 border-brand-emerald rounded-full opacity-60"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-brand-emerald animate-spin" />
                    </div>
                </div>

                <div className="h-24">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            transition={{ duration: 0.5 }}
                        >
                            <h2 className="text-xl font-medium tracking-tight font-sans">
                                {calculationQuotes[index]}
                            </h2>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Cinematic Progress Bar */}
                <div className="w-full h-[1px] bg-white/10 relative overflow-hidden">
                    <motion.div
                        initial={{ x: "-100%" }}
                        animate={{ x: "0%" }}
                        transition={{ duration: 6, ease: "easeInOut" }}
                        className="absolute inset-0 bg-brand-emerald shadow-[0_0_15px_rgba(34,197,94,0.5)]"
                    />
                </div>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-medium"
                >
                    High Performance Engine • v1.0
                </motion.p>
            </div>
        </div>
    );
}

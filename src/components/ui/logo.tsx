"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LogoProps {
    className?: string;
    animate?: boolean;
}

export const Logo = ({ className, animate = true }: LogoProps) => {
    return (
        <div className={cn("flex items-center gap-0.5 font-sans font-bold tracking-tighter", className)}>
            <span className="text-foreground">tra</span>
            <div className="relative flex items-center">
                <span className="text-foreground">k</span>
                <motion.div
                    initial={animate ? { y: 20, opacity: 0, scale: 0.5 } : { y: -4, x: 4, opacity: 1, scale: 1 }}
                    animate={animate ? {
                        y: [-4, -6, -4],
                        x: [4, 6, 4],
                        opacity: 1,
                        scale: 1
                    } : {}}
                    transition={animate ? {
                        opacity: { duration: 0.5, delay: 0.2 },
                        scale: { duration: 0.4, delay: 0.2 },
                        y: {
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        },
                        x: {
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }
                    } : {}}
                    className="absolute -top-4 -right-4 text-brand-emerald"
                >
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M7 17L17 7" />
                        <path d="M7 7h10v10" />
                    </svg>
                </motion.div>
            </div>
        </div>
    );
};

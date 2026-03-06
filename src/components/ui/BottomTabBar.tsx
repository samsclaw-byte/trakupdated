"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, CheckCircle2, User, Users, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const tabs = [
    { href: "/nutrition", label: "Nutrition", icon: Flame },
    { href: "/fitness", label: "Fitness", icon: Activity },
    { href: "/habits", label: "Habits", icon: CheckCircle2 },
    { href: "/squads", label: "Squads", icon: Users },
    { href: "/profile", label: "Profile", icon: User },
];

export function BottomTabBar() {
    const pathname = usePathname();

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50">
            {/* Gradient fade above the bar */}
            <div className="h-6 bg-gradient-to-t from-background to-transparent pointer-events-none" />

            <nav className="bg-background/80 backdrop-blur-xl border-t border-white/5 px-6 pb-6 pt-3">
                <div className="flex items-center justify-around max-w-md mx-auto">
                    {tabs.map((tab) => {
                        const isActive = pathname.startsWith(tab.href);
                        return (
                            <Link key={tab.href} href={tab.href} className="relative flex flex-col items-center gap-1 min-w-[64px]">
                                <motion.div
                                    whileTap={{ scale: 0.85 }}
                                    className="relative flex flex-col items-center gap-1"
                                >
                                    <tab.icon
                                        className={cn(
                                            "w-6 h-6 transition-colors duration-300",
                                            isActive ? "text-brand-emerald" : "text-muted-foreground"
                                        )}
                                    />
                                    <span
                                        className={cn(
                                            "text-[9px] uppercase tracking-[0.15em] font-bold transition-colors duration-300",
                                            isActive ? "text-brand-emerald" : "text-muted-foreground"
                                        )}
                                    >
                                        {tab.label}
                                    </span>
                                    {isActive && (
                                        <motion.div
                                            layoutId="tab-indicator"
                                            className="absolute -bottom-2 w-1 h-1 rounded-full bg-brand-emerald shadow-[0_0_8px_rgba(34,197,94,0.8)]"
                                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                        />
                                    )}
                                </motion.div>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}

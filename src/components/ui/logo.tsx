"use client";


import { cn } from "@/lib/utils";

interface LogoProps {
    className?: string;
    animate?: boolean;
}

export const Logo = ({ className, animate = true }: LogoProps) => {
    return (
        <div className={cn("flex items-center justify-center", className)}>
            <img
                src="/trak-logo-static.png"
                alt="Trak Logo"
                className="h-[1.5em] w-auto object-contain"
            />
        </div>
    );
};

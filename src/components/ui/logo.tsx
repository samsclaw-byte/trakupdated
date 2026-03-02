"use client";


import { cn } from "@/lib/utils";
import Image from "next/image";

interface LogoProps {
    className?: string;
    animate?: boolean;
}

export const Logo = ({ className, animate = true }: LogoProps) => {
    // animate prop is kept in the interface for backward compatibility with 
    // components still passing it, but ignored here to pass strict linting cleanly.
    return (
        <div className={cn("flex items-center justify-center", className)}>
            <div className="relative h-[1.5em] aspect-video">
                <Image
                    src="/trak-logo-static.png"
                    alt="Trak Logo"
                    fill
                    className="object-contain"
                    priority
                />
            </div>
        </div>
    );
};

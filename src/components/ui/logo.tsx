"use client";


import { cn } from "@/lib/utils";

interface LogoProps {
    className?: string;
    animate?: boolean;
}

export const Logo = ({ className, animate = true }: LogoProps) => {


    return (
        <div className={cn("flex items-center gap-0.5 font-sans font-bold tracking-tighter", className)}>
            <span className="text-foreground">tra</span>
            <div className="relative flex items-center justify-center">
                <span className="text-foreground -mr-1">k</span>
                <div className="w-10 h-10 -ml-1 flex-shrink-0">
                    <video
                        src="/traklogo.mp4"
                        autoPlay={animate}
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                    />
                </div>
            </div>
        </div>
    );
};

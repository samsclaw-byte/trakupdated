"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { cn } from "@/lib/utils";

interface SubViewToggleProps {
    views: { key: string; label: string; content: React.ReactNode }[];
    defaultView?: string;
}

export function SubViewToggle({ views, defaultView }: SubViewToggleProps) {
    const [activeKey, setActiveKey] = useState(defaultView || views[0].key);
    const [direction, setDirection] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    const activeIndex = views.findIndex((v) => v.key === activeKey);

    const switchTo = (key: string) => {
        const newIndex = views.findIndex((v) => v.key === key);
        setDirection(newIndex > activeIndex ? 1 : -1);
        setActiveKey(key);
    };

    const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const threshold = 50;
        if (info.offset.x < -threshold && activeIndex < views.length - 1) {
            switchTo(views[activeIndex + 1].key);
        } else if (info.offset.x > threshold && activeIndex > 0) {
            switchTo(views[activeIndex - 1].key);
        }
    };

    const activeView = views.find((v) => v.key === activeKey);

    return (
        <div className="flex flex-col flex-1 min-h-0">
            {/* Pill Toggle */}
            <div className="px-6 pt-4 pb-2">
                <div className="flex p-1 bg-white/5 border border-white/5 rounded-2xl relative">
                    {views.map((view) => (
                        <button
                            key={view.key}
                            onClick={() => switchTo(view.key)}
                            className={cn(
                                "flex-1 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-colors duration-300 relative z-10",
                                activeKey === view.key
                                    ? "text-white"
                                    : "text-muted-foreground hover:text-white"
                            )}
                        >
                            {view.label}
                        </button>
                    ))}
                    {/* Sliding background */}
                    <motion.div
                        layoutId="sub-view-pill"
                        className="absolute top-1 bottom-1 rounded-xl bg-white/10"
                        style={{
                            width: `${100 / views.length}%`,
                            left: `${(activeIndex / views.length) * 100}%`,
                        }}
                        transition={{ type: "spring", stiffness: 400, damping: 35 }}
                    />
                </div>
            </div>

            {/* Swipeable Content */}
            <div
                ref={containerRef}
                className="flex-1 min-h-0 overflow-hidden relative"
            >
                <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                        key={activeKey}
                        custom={direction}
                        initial={{ x: direction > 0 ? 100 : -100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: direction > 0 ? -100 : 100, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        drag="x"
                        dragDirectionLock
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.15}
                        onDragEnd={handleDragEnd}
                        className="flex-1 min-h-0 overflow-y-auto px-6 py-4"
                        style={{ touchAction: "pan-y" }}
                    >
                        {activeView?.content}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}

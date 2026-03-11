"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";

export interface ActionCard {
    id: string;
    title: string;
    subtitle: string;
    icon: React.ElementType;
    iconColor: string;
    iconBg: string;
    actionLabel: string;
    actionHref?: string;
    onAction?: () => void;
}

interface HubActionDeckProps {
    cards: ActionCard[];
}

export function HubActionDeck({ cards }: HubActionDeckProps) {

    if (!cards || cards.length === 0) return null;

    return (
        <div className="w-full">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mb-4 px-1">
                Suggested Actions
            </h3>

            {/* Horizontal Carousel */}
            <div className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scrollbar-none px-1 -mx-1">
                {cards.map((card, idx) => (
                    <motion.div
                        key={card.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="min-w-[240px] max-w-[280px] flex-shrink-0 snap-start bg-white/5 border border-white/10 rounded-3xl p-5 flex flex-col justify-between group transition-all hover:bg-white/[0.08]"
                    >
                        <div className="flex items-start gap-4 mb-6">
                            <div className={`w-12 h-12 rounded-2xl ${card.iconBg} flex items-center justify-center shrink-0`}>
                                <card.icon className={`w-6 h-6 ${card.iconColor}`} />
                            </div>
                            <div>
                                <h4 className="font-bold text-foreground leading-tight text-sm mb-1">{card.title}</h4>
                                <p className="text-[10px] text-muted-foreground leading-snug">{card.subtitle}</p>
                            </div>
                        </div>

                        {card.actionHref ? (
                            <Link href={card.actionHref} className="w-full block">
                                <button className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl transition-colors">
                                    {card.actionLabel}
                                </button>
                            </Link>
                        ) : (
                            <button
                                onClick={card.onAction}
                                className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl transition-colors"
                            >
                                {card.actionLabel}
                            </button>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

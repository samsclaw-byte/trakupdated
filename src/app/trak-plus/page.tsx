"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Check, Sparkles, Palette, Users, Apple, Download, Crown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function TrakPlusPage() {
    const router = useRouter();
    const [isUpgrading, setIsUpgrading] = useState(false);

    const handleUpgrade = async () => {
        setIsUpgrading(true);
        // Simulate Stripe checkout or immediate beta upgrade
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            // Beta bypass: Just set the flag to true for now
            await supabase
                .from('users')
                .update({ is_trak_plus: true })
                .eq('id', user.id);

            // Wait for effect
            await new Promise(resolve => setTimeout(resolve, 1500));
            router.push('/profile');
        } else {
            setIsUpgrading(false);
        }
    };

    const features = [
        {
            icon: <Palette className="w-5 h-5 text-purple-400" />,
            title: "Unlimited Colors",
            desc: "Unlock the full spectrum of custom hex colors for your habits."
        },
        {
            icon: <Users className="w-5 h-5 text-blue-400" />,
            title: "Unlimited Squads",
            desc: "Create and join as many squads as you want. No 5-member limit."
        },
        {
            icon: <Apple className="w-5 h-5 text-emerald-400" />,
            title: "AI Grocery Lists",
            desc: "Weekly auto-generated shopping lists based on your macros."
        },
        {
            icon: <Download className="w-5 h-5 text-amber-400" />,
            title: "Data Export & Sync",
            desc: "Native sync to Apple Health & Whoop, plus CSV exports."
        }
    ];

    return (
        <div className="min-h-screen bg-brand-black text-white selection:bg-brand-emerald/30 font-sans pb-24 overflow-x-hidden relative">

            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-brand-emerald/20 blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-500/10 blur-[120px]"></div>
                <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] rounded-full bg-purple-500/10 blur-[100px]"></div>
            </div>

            {/* Header */}
            <div className="px-6 py-6 sticky top-0 z-40 bg-brand-black/50 backdrop-blur-xl border-b border-white/5 flex items-center justify-between">
                <Link href="/profile" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/10">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold tracking-widest uppercase">Premium</span>
                </div>
            </div>

            <div className="px-6 pt-10 pb-6 max-w-md mx-auto space-y-10 relative z-10">

                {/* Hero Section */}
                <div className="text-center space-y-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-emerald to-blue-500 p-1 shadow-[0_0_40px_rgba(16,185,129,0.4)] mb-4"
                    >
                        <div className="w-full h-full bg-brand-black rounded-[20px] flex items-center justify-center">
                            <Sparkles className="w-8 h-8 text-brand-emerald" />
                        </div>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl font-black tracking-tighter"
                    >
                        Unlock <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-emerald to-blue-400">Trak+</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-white/60 text-lg max-w-[280px] mx-auto leading-relaxed"
                    >
                        The ultimate toolkit for those serious about their progress.
                    </motion.p>
                </div>

                {/* Features List */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-4"
                >
                    {features.map((feature, i) => (
                        <div key={i} className="flex gap-4 items-start p-4 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-md">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shrink-0">
                                {feature.icon}
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-1">{feature.title}</h3>
                                <p className="text-sm text-white/50 leading-relaxed">{feature.desc}</p>
                            </div>
                        </div>
                    ))}
                </motion.div>

                {/* Pricing Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="relative p-[1px] rounded-3xl overflow-hidden bg-gradient-to-br from-brand-emerald/50 via-purple-500/20 to-brand-amber/30 mt-8"
                >
                    <div className="relative bg-brand-black/90 backdrop-blur-2xl rounded-[23px] p-6 text-center shadow-2xl">
                        <p className="text-xs uppercase tracking-widest text-brand-emerald font-bold mb-2">Beta Pricing</p>
                        <div className="flex items-center justify-center gap-1 mb-2">
                            <span className="text-2xl text-white/50 line-through font-mono">$12</span>
                            <span className="text-5xl font-black tracking-tighter">$0</span>
                            <span className="text-sm text-white/50 self-end mb-2">/mo</span>
                        </div>
                        <p className="text-sm text-white/60 mb-6">Upgrade for free during the Beta period.</p>

                        <button
                            onClick={handleUpgrade}
                            disabled={isUpgrading}
                            className="w-full relative group overflow-hidden rounded-2xl p-[1px]"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-brand-emerald via-blue-500 to-brand-emerald opacity-70 group-hover:opacity-100 transition-opacity duration-500 bg-[length:200%_auto] animate-gradient"></div>
                            <div className="relative bg-brand-black px-6 py-4 rounded-[15px] flex items-center justify-center gap-2 group-hover:bg-opacity-90 transition-all duration-300">
                                {isUpgrading ? (
                                    <div className="w-5 h-5 border-2 border-brand-emerald border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <span className="font-bold text-lg text-white">Upgrade Now</span>
                                        <Check className="w-5 h-5 text-brand-emerald" />
                                    </>
                                )}
                            </div>
                        </button>
                    </div>
                </motion.div>

                <p className="text-center text-xs text-white/30 px-8">
                    By upgrading, you agree to our Terms of Service. Cancel anytime from your profile settings.
                </p>

            </div>
        </div>
    );
}

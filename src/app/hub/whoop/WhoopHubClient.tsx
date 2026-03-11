"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { ChevronLeft, Zap, HeartPulse, Moon, Activity, Droplets, Thermometer, Info } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function WhoopHubClient() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [history, setHistory] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [todayData, setTodayData] = useState<any>(null);
    const supabase = createClient();

    useEffect(() => {
        const fetchWhoopHistory = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/");
                return;
            }

            const { data } = await supabase
                .from('whoop_daily')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: false })
                .limit(7);

            if (data && data.length > 0) {
                setHistory(data);

                // Get today's local date
                const today = new Date();
                const todayLocalISO = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

                if (data[0].date === todayLocalISO) {
                    setTodayData(data[0]);
                } else {
                    // Fallback to the latest available if today hasn't synced yet
                    setTodayData(data[0]);
                }
            }

            setIsLoading(false);
        };

        fetchWhoopHistory();
    }, [router, supabase]);

    const handleManualSync = async () => {
        setIsLoading(true);
        try {
            await fetch('/api/whoop/sync', { method: 'POST' });
            window.location.reload();
        } catch (error) {
            console.error("Sync failed", error);
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 rounded-full border-2 border-brand-emerald border-t-transparent animate-spin" /></div>;
    }

    if (!todayData) {
        return (
            <div className="flex flex-col min-h-screen bg-background p-6 items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                    <HeartPulse className="w-8 h-8 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-bold">No Whoop Data Found</h2>
                <p className="text-sm text-muted-foreground max-w-xs">Connect your Whoop account in the Profile tab to enable this dashboard.</p>
                <Link href="/hub">
                    <button className="mt-8 px-6 py-3 bg-white/10 rounded-2xl text-sm font-bold">Return to Hub</button>
                </Link>
            </div>
        );
    }

    // Colors based on recovery thresholds
    const getRecoveryColor = (score: number) => {
        if (score >= 67) return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
        if (score >= 34) return "text-amber-400 bg-amber-400/10 border-amber-400/20";
        return "text-red-400 bg-red-400/10 border-red-400/20";
    };

    const getRecoveryGradient = (score: number) => {
        if (score >= 67) return "from-emerald-500/20 to-emerald-900/5";
        if (score >= 34) return "from-amber-500/20 to-amber-900/5";
        return "from-red-500/20 to-red-900/5";
    };

    const recoveryTheme = getRecoveryColor(todayData.recovery_score);
    const recoveryGradient = getRecoveryGradient(todayData.recovery_score);

    return (
        <div className="flex flex-col min-h-screen bg-background pb-32">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-6 border-b border-white/5 sticky top-0 bg-background/80 backdrop-blur-xl z-50">
                <div className="flex items-center gap-4">
                    <Link href="/hub" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center transition-all hover:bg-white/10 active:scale-95">
                        <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                    </Link>
                    <div>
                        <h1 className="text-sm font-bold tracking-widest uppercase">Whoop Data</h1>
                        <p className="text-[10px] text-brand-emerald font-semibold flex items-center gap-1 uppercase tracking-widest">
                            <Zap className="w-3 h-3" /> Live Sync
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleManualSync}
                    className="text-xs font-bold text-muted-foreground hover:text-white transition-colors uppercase tracking-widest px-3 py-1.5 bg-white/5 rounded-full"
                >
                    Sync Now
                </button>
            </div>

            <div className="px-6 py-8 space-y-8">
                {/* Hero Recovery Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`w-full rounded-[2rem] p-8 border bg-gradient-to-br ${recoveryGradient} ${recoveryTheme.split(' ')[2]} relative overflow-hidden`}
                >
                    <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-[0.05]" />

                    <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-70">Today&apos;s Recovery</span>
                        </div>

                        <div className="relative flex items-center justify-center">
                            {/* Glowing ring behind score */}
                            <div className={`absolute w-40 h-40 blur-3xl opacity-40 rounded-full ${recoveryTheme.split(' ')[1].replace('/10', '')}`} />
                            <h2 className={`text-8xl font-black tracking-tighter ${recoveryTheme.split(' ')[0]} drop-shadow-2xl`}>
                                {todayData.recovery_score}%
                            </h2>
                        </div>

                        <div className="grid grid-cols-2 gap-4 w-full pt-4 border-t border-white/10">
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] uppercase font-bold tracking-widest opacity-60">HRV</span>
                                <span className={`text-xl font-bold ${recoveryTheme.split(' ')[0]}`}>{Math.round(todayData.hrv_rmssd)}ms</span>
                            </div>
                            <div className="flex flex-col items-center border-l border-white/10">
                                <span className="text-[10px] uppercase font-bold tracking-widest opacity-60">Resting HR</span>
                                <span className="text-xl font-bold text-white">{Math.round(todayData.resting_heart_rate)} bpm</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Sub Metrics Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <MetricsCard
                        title="Sleep Performance"
                        value={`${todayData.sleep_performance}%`}
                        icon={Moon}
                        color="text-indigo-400"
                        bg="bg-indigo-400/10"
                    />
                    <MetricsCard
                        title="Day Strain"
                        value={todayData.strain.toFixed(1)}
                        icon={Activity}
                        color="text-blue-400"
                        bg="bg-blue-400/10"
                    />
                    <MetricsCard
                        title="Skin Temp Var"
                        value={`${todayData.skin_temp_celsius > 0 ? '+' : ''}${todayData.skin_temp_celsius?.toFixed(2) || '0.0'}°`}
                        icon={Thermometer}
                        color="text-orange-400"
                        bg="bg-orange-400/10"
                    />
                    <MetricsCard
                        title="Blood Oxygen"
                        value={`${todayData.spo2_percentage?.toFixed(1) || '--'}%`}
                        icon={Droplets}
                        color="text-cyan-400"
                        bg="bg-cyan-400/10"
                    />
                </div>

                {/* 7-Day Trend (Simple Visual) */}
                <div className="space-y-4 pt-6 pb-12">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
                            7-Day Trend
                        </h3>
                        <Info className="w-4 h-4 text-muted-foreground/40" />
                    </div>

                    <div className="flex gap-2 items-end h-32 p-4 bg-white/5 border border-white/5 rounded-3xl justify-between">
                        {history.slice().reverse().map((day, idx) => {
                            const isToday = day.date === todayData.date;
                            const hrvColor = getRecoveryColor(day.recovery_score).split(' ')[1]; // Get the bg color

                            return (
                                <div key={idx} className="flex flex-col items-center gap-2 w-full">
                                    <div className="w-full flex justify-center h-full items-end relative">
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${Math.max(day.recovery_score, 10)}%` }}
                                            transition={{ delay: idx * 0.1, duration: 0.5 }}
                                            className={`w-full max-w-[24px] rounded-t-lg ${hrvColor} ${isToday ? 'border-t-2 border-white' : 'opacity-70'}`}
                                        />
                                    </div>
                                    <span className={`text-[9px] font-bold uppercase tracking-wider ${isToday ? 'text-white' : 'text-muted-foreground/50'}`}>
                                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MetricsCard({ title, value, icon: Icon, color, bg }: any) {
    return (
        <div className="bg-white/5 border border-white/5 p-4 rounded-3xl flex flex-col items-center text-center gap-3 relative overflow-hidden group hover:bg-white/[0.08] transition-colors">
            <div className={`absolute top-0 right-0 w-24 h-24 ${bg} blur-[40px] -translate-y-1/2 translate-x-1/2 rounded-full pointer-events-none group-hover:scale-110 transition-transform`} />
            <div className="relative z-10 space-y-2 flex flex-col items-center">
                <Icon className={`w-6 h-6 ${color}`} />
                <div>
                    <span className="text-2xl font-bold tracking-tighter block">{value}</span>
                    <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">{title}</span>
                </div>
            </div>
        </div>
    );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { ChevronLeft, Zap, HeartPulse, Moon, Activity, Droplets, Thermometer, TrendingUp, Calendar } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DailyData = any;

export default function WhoopHubClient() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"today" | "trends">("today");
    const [allData, setAllData] = useState<DailyData[]>([]);
    const [selectedDayIdx, setSelectedDayIdx] = useState(0);
    const [trendPeriod, setTrendPeriod] = useState<7 | 28 | 90>(28);
    const [isSyncing, setIsSyncing] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push("/"); return; }

            const { data } = await supabase
                .from("whoop_daily")
                .select("*")
                .eq("user_id", user.id)
                .order("date", { ascending: false })
                .limit(90);

            if (data && data.length > 0) {
                setAllData(data);
            }
            setIsLoading(false);
        };
        fetchData();
    }, [router, supabase]);

    const handleManualSync = useCallback(async () => {
        setIsSyncing(true);
        try {
            const res = await fetch("/api/whoop/sync?days=7", { method: "POST" });
            const result = await res.json();
            if (result.workout_error || result.recovery_error) {
                alert(`Sync had errors: ${JSON.stringify(result)}`);
            }
            window.location.reload();
        } catch (error) {
            console.error("Sync failed", error);
            setIsSyncing(false);
        }
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="w-8 h-8 rounded-full border-2 border-brand-emerald border-t-transparent animate-spin" />
            </div>
        );
    }

    if (allData.length === 0) {
        return (
            <div className="flex flex-col min-h-screen bg-background p-6 items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                    <HeartPulse className="w-8 h-8 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-bold">No Whoop Data Found</h2>
                <p className="text-sm text-muted-foreground max-w-xs">
                    Hit Sync to pull in your last 90 days of data from Whoop.
                </p>
                <button
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    className="mt-4 px-6 py-3 bg-brand-emerald/20 border border-brand-emerald/30 rounded-2xl text-sm font-bold text-brand-emerald"
                >
                    {isSyncing ? "Syncing..." : "Sync Now"}
                </button>
                <Link href="/hub">
                    <button className="mt-4 px-6 py-3 bg-white/10 rounded-2xl text-sm font-bold">Return to Hub</button>
                </Link>
            </div>
        );
    }

    const selectedDay = allData[selectedDayIdx];
    const trendData = allData.slice(0, trendPeriod).reverse();

    return (
        <div className="flex flex-col min-h-screen bg-background pb-32">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 sticky top-0 bg-background/80 backdrop-blur-xl z-50">
                <div className="flex items-center gap-4">
                    <Link href="/hub" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center transition-all hover:bg-white/10 active:scale-95">
                        <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                    </Link>
                    <div>
                        <h1 className="text-sm font-bold tracking-widest uppercase">Whoop</h1>
                        <p className="text-[10px] text-brand-emerald font-semibold flex items-center gap-1 uppercase tracking-widest">
                            <Zap className="w-3 h-3" /> {allData.length} days of data
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    className="text-xs font-bold text-brand-emerald hover:text-white transition-colors uppercase tracking-widest px-4 py-2 bg-brand-emerald/10 border border-brand-emerald/30 rounded-full hover:bg-brand-emerald/20"
                >
                    {isSyncing ? "Syncing..." : "⚡ Sync"}
                </button>
            </div>

            {/* Tab Switcher */}
            <div className="flex px-6 pt-5 gap-1 bg-background">
                <button
                    onClick={() => setActiveTab("today")}
                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2
                        ${activeTab === "today" ? "bg-white/10 text-white border border-white/10" : "text-muted-foreground/50 hover:text-muted-foreground"}`}
                >
                    <Calendar className="w-3.5 h-3.5" /> Today
                </button>
                <button
                    onClick={() => setActiveTab("trends")}
                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2
                        ${activeTab === "trends" ? "bg-white/10 text-white border border-white/10" : "text-muted-foreground/50 hover:text-muted-foreground"}`}
                >
                    <TrendingUp className="w-3.5 h-3.5" /> Trends
                </button>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === "today" ? (
                    <TodayView
                        key="today"
                        data={allData}
                        selectedIdx={selectedDayIdx}
                        onSelectDay={setSelectedDayIdx}
                        selectedDay={selectedDay}
                    />
                ) : (
                    <TrendsView
                        key="trends"
                        data={trendData}
                        period={trendPeriod}
                        onChangePeriod={setTrendPeriod}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── TODAY VIEW ─────────────────────────────────────────────────

function TodayView({ data, selectedIdx, onSelectDay, selectedDay }: {
    data: DailyData[];
    selectedIdx: number;
    onSelectDay: (idx: number) => void;
    selectedDay: DailyData;
}) {
    const getRecoveryColor = (score: number) => {
        if (score >= 67) return "emerald";
        if (score >= 34) return "amber";
        return "red";
    };

    const color = getRecoveryColor(selectedDay?.recovery_score || 0);
    const colorMap = {
        emerald: { text: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20", gradient: "from-emerald-500/20 to-emerald-900/5" },
        amber: { text: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20", gradient: "from-amber-500/20 to-amber-900/5" },
        red: { text: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/20", gradient: "from-red-500/20 to-red-900/5" },
    };
    const theme = colorMap[color];

    const formatDate = (dateStr: string) => {
        const today = new Date();
        const todayISO = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split("T")[0];
        const yesterday = new Date(today.getTime() - 86400000);
        const yesterdayISO = new Date(yesterday.getTime() - yesterday.getTimezoneOffset() * 60000).toISOString().split("T")[0];

        if (dateStr === todayISO) return "Today";
        if (dateStr === yesterdayISO) return "Yesterday";
        return new Date(dateStr).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="px-6 py-6 space-y-6"
        >
            {/* Date Selector Ribbon */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
                {data.slice(0, 14).map((day: DailyData, idx: number) => (
                    <button
                        key={day.date}
                        onClick={() => onSelectDay(idx)}
                        className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold transition-all
                            ${idx === selectedIdx
                                ? "bg-white/10 text-white border border-white/10"
                                : "text-muted-foreground/50 hover:text-muted-foreground hover:bg-white/5"
                            }`}
                    >
                        {formatDate(day.date)}
                    </button>
                ))}
            </div>

            {/* Hero Recovery Card */}
            {selectedDay?.recovery_score != null ? (
                <motion.div
                    key={selectedDay.date}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`w-full rounded-[2rem] p-8 border bg-gradient-to-br ${theme.gradient} ${theme.border} relative overflow-hidden`}
                >
                    <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-[0.05]" />
                    <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-70">
                            {formatDate(selectedDay.date)}&apos;s Recovery
                        </span>
                        <div className="relative flex items-center justify-center">
                            <div className={`absolute w-40 h-40 blur-3xl opacity-40 rounded-full ${theme.bg}`} />
                            <h2 className={`text-8xl font-black tracking-tighter ${theme.text} drop-shadow-2xl`}>
                                {selectedDay.recovery_score}%
                            </h2>
                        </div>
                        <div className="grid grid-cols-2 gap-4 w-full pt-4 border-t border-white/10">
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] uppercase font-bold tracking-widest opacity-60">HRV</span>
                                <span className={`text-xl font-bold ${theme.text}`}>
                                    {selectedDay.hrv ? `${Math.round(selectedDay.hrv)}ms` : "--"}
                                </span>
                            </div>
                            <div className="flex flex-col items-center border-l border-white/10">
                                <span className="text-[10px] uppercase font-bold tracking-widest opacity-60">Resting HR</span>
                                <span className="text-xl font-bold text-white">
                                    {selectedDay.resting_heart_rate ? `${Math.round(selectedDay.resting_heart_rate)} bpm` : "--"}
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            ) : (
                <div className="w-full rounded-[2rem] p-8 border border-white/5 bg-white/5 text-center">
                    <p className="text-sm text-muted-foreground">No recovery data for this day</p>
                </div>
            )}

            {/* Sub Metrics Grid */}
            <div className="grid grid-cols-2 gap-4">
                <MetricsCard title="Sleep" value={selectedDay?.sleep_performance != null ? `${selectedDay.sleep_performance}%` : "--"} subtitle={selectedDay?.sleep_duration_minutes ? `${Math.floor(selectedDay.sleep_duration_minutes / 60)}h ${selectedDay.sleep_duration_minutes % 60}m` : ""} icon={Moon} color="text-indigo-400" bg="bg-indigo-400/10" />
                <MetricsCard title="Day Strain" value={selectedDay?.strain != null ? selectedDay.strain.toFixed(1) : "--"} subtitle={selectedDay?.calories_burned ? `${selectedDay.calories_burned} cal` : ""} icon={Activity} color="text-blue-400" bg="bg-blue-400/10" />
                <MetricsCard title="Skin Temp" value={selectedDay?.skin_temp != null ? `${selectedDay.skin_temp > 0 ? "+" : ""}${selectedDay.skin_temp.toFixed(1)}°` : "--"} icon={Thermometer} color="text-orange-400" bg="bg-orange-400/10" />
                <MetricsCard title="SpO2" value={selectedDay?.spo2 != null ? `${selectedDay.spo2.toFixed(1)}%` : "--"} icon={Droplets} color="text-cyan-400" bg="bg-cyan-400/10" />
            </div>
        </motion.div>
    );
}

// ─── TRENDS VIEW ────────────────────────────────────────────────

function TrendsView({ data, period, onChangePeriod }: {
    data: DailyData[];
    period: 7 | 28 | 90;
    onChangePeriod: (p: 7 | 28 | 90) => void;
}) {
    const periods: (7 | 28 | 90)[] = [7, 28, 90];
    const periodLabels: Record<number, string> = { 7: "7 Days", 28: "28 Days", 90: "90 Days" };

    const avg = (key: string) => {
        const valid = data.filter((d: DailyData) => d[key] != null);
        if (valid.length === 0) return null;
        return valid.reduce((sum: number, d: DailyData) => sum + d[key], 0) / valid.length;
    };

    const trendConfigs = [
        { key: "recovery_score", label: "Recovery", unit: "%", color: "#34d399", avgLabel: "Avg Recovery" },
        { key: "hrv", label: "HRV", unit: "ms", color: "#a78bfa", avgLabel: "Avg HRV" },
        { key: "resting_heart_rate", label: "Resting HR", unit: "bpm", color: "#f87171", avgLabel: "Avg RHR" },
        { key: "sleep_duration_minutes", label: "Sleep", unit: "hrs", color: "#818cf8", avgLabel: "Avg Sleep", transform: (v: number) => +(v / 60).toFixed(1) },
        { key: "strain", label: "Day Strain", unit: "", color: "#fbbf24", avgLabel: "Avg Strain" },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="px-6 py-6 space-y-6"
        >
            {/* Period Toggle */}
            <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/5">
                {periods.map(p => (
                    <button
                        key={p}
                        onClick={() => onChangePeriod(p)}
                        className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-widest rounded-lg transition-all
                            ${period === p ? "bg-brand-emerald/20 text-brand-emerald border border-brand-emerald/20" : "text-muted-foreground/50 hover:text-muted-foreground"}`}
                    >
                        {periodLabels[p]}
                    </button>
                ))}
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: "Recovery", val: avg("recovery_score"), fmt: (v: number) => `${Math.round(v)}%`, color: "text-emerald-400" },
                    { label: "HRV", val: avg("hrv"), fmt: (v: number) => `${Math.round(v)}ms`, color: "text-purple-400" },
                    { label: "Sleep", val: avg("sleep_duration_minutes"), fmt: (v: number) => `${(v / 60).toFixed(1)}h`, color: "text-indigo-400" },
                ].map(stat => (
                    <div key={stat.label} className="bg-white/5 border border-white/5 rounded-2xl p-3 text-center">
                        <span className={`text-lg font-black ${stat.color}`}>
                            {stat.val != null ? stat.fmt(stat.val) : "--"}
                        </span>
                        <p className="text-[9px] uppercase tracking-widest text-muted-foreground/60 font-bold mt-1">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Trend Charts */}
            {trendConfigs.map(config => {
                const avgVal = avg(config.key);
                const chartData = data.map((d: DailyData) => {
                    const raw = d[config.key];
                    if (raw == null) return null;
                    return config.transform ? config.transform(raw) : raw;
                });

                return (
                    <TrendCard
                        key={config.key}
                        label={config.label}
                        unit={config.unit}
                        color={config.color}
                        avgLabel={config.avgLabel}
                        avgValue={avgVal != null
                            ? config.transform
                                ? `${config.transform(avgVal)}${config.unit}`
                                : `${Math.round(avgVal)}${config.unit}`
                            : "--"}
                        data={chartData}
                        dates={data.map((d: DailyData) => d.date)}
                        period={period}
                    />
                );
            })}
        </motion.div>
    );
}

// ─── TREND CARD WITH SVG CHART ─────────────────────────────────

function TrendCard({ label, unit, color, avgLabel, avgValue, data, dates, period }: {
    label: string;
    unit: string;
    color: string;
    avgLabel: string;
    avgValue: string;
    data: (number | null)[];
    dates: string[];
    period: number;
}) {
    // Filter out nulls for chart rendering
    const validPoints = data.map((v, i) => v != null ? { x: i, y: v } : null).filter(Boolean) as { x: number; y: number }[];

    if (validPoints.length < 2) {
        return (
            <div className="bg-white/5 border border-white/5 rounded-3xl p-5">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">{label}</span>
                </div>
                <p className="text-sm text-muted-foreground/40">Not enough data</p>
            </div>
        );
    }

    const minY = Math.min(...validPoints.map(p => p.y));
    const maxY = Math.max(...validPoints.map(p => p.y));
    const rangeY = maxY - minY || 1;
    const width = 320;
    const height = 80;
    const padding = 4;

    const points = validPoints.map(p => ({
        x: padding + ((p.x / (data.length - 1)) * (width - padding * 2)),
        y: padding + ((1 - (p.y - minY) / rangeY) * (height - padding * 2)),
    }));

    // Build smooth SVG path
    const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/5 rounded-3xl p-5 overflow-hidden"
        >
            <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">{label}</span>
                <div className="text-right">
                    <span className="text-lg font-black" style={{ color }}>{avgValue}</span>
                    <p className="text-[9px] uppercase tracking-widest text-muted-foreground/40 font-bold">
                        {avgLabel}
                    </p>
                </div>
            </div>

            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-20 mt-2" preserveAspectRatio="none">
                <defs>
                    <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={color} stopOpacity="0.02" />
                    </linearGradient>
                </defs>
                <path d={areaPath} fill={`url(#grad-${label})`} />
                <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                {/* Latest point dot */}
                <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="3" fill={color} />
            </svg>

            {/* Date labels */}
            <div className="flex justify-between mt-2">
                {(() => {
                    // Pick evenly spaced label indices
                    const labelCount = period <= 7 ? dates.length : period <= 28 ? 5 : 6;
                    const step = Math.max(1, Math.floor((dates.length - 1) / (labelCount - 1)));
                    const indices = Array.from({ length: labelCount }, (_, i) =>
                        Math.min(i * step, dates.length - 1)
                    );
                    // Deduplicate last index
                    const uniqueIndices = [...new Set(indices)];

                    return uniqueIndices.map(idx => {
                        const d = new Date(dates[idx]);
                        const lbl = period <= 7
                            ? d.toLocaleDateString("en-US", { weekday: "short" })
                            : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                        return (
                            <span key={idx} className="text-[8px] text-muted-foreground/40 font-bold">
                                {lbl}
                            </span>
                        );
                    });
                })()}
            </div>
        </motion.div>
    );
}

// ─── METRICS CARD ──────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MetricsCard({ title, value, subtitle, icon: Icon, color, bg }: any) {
    return (
        <div className="bg-white/5 border border-white/5 p-4 rounded-3xl flex flex-col items-center text-center gap-2 relative overflow-hidden group hover:bg-white/[0.08] transition-colors">
            <div className={`absolute top-0 right-0 w-24 h-24 ${bg} blur-[40px] -translate-y-1/2 translate-x-1/2 rounded-full pointer-events-none group-hover:scale-110 transition-transform`} />
            <div className="relative z-10 space-y-1 flex flex-col items-center">
                <Icon className={`w-5 h-5 ${color}`} />
                <span className="text-2xl font-bold tracking-tighter block">{value}</span>
                {subtitle && <span className="text-[10px] text-muted-foreground/60 font-semibold">{subtitle}</span>}
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">{title}</span>
            </div>
        </div>
    );
}

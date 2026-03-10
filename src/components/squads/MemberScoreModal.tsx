"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Loader2, Flame, Target, Dumbbell, Activity } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface MemberScoreModalProps {
    member: { user_id: string; name: string };
    squadId: string;
    onClose: () => void;
}

export function MemberScoreModal({ member, squadId, onClose }: MemberScoreModalProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [dailyData, setDailyData] = useState<{ day: string; habits: number; perfect: number; workout: number; cals: number; total: number }[]>([]);
    const [totals, setTotals] = useState({ habits: 0, perfect: 0, workouts: 0, cals: 0, score: 0 });

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const supabase = createClient();

            const today = new Date();
            const day = today.getDay();
            const diff = today.getDate() - day + (day === 0 ? -6 : 1);
            const startOfWeekDate = new Date(today);
            startOfWeekDate.setDate(diff);
            startOfWeekDate.setHours(0, 0, 0, 0);

            const { data: feedData } = await supabase
                .from('squad_feed')
                .select('*')
                .eq('squad_id', squadId)
                .eq('user_id', member.user_id)
                .gte('created_at', startOfWeekDate.toISOString());

            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            const dayMap = days.map(d => ({ day: d, habits: 0, perfect: 0, workout: 0, cals: 0, total: 0 }));
            const agg = { habits: 0, perfect: 0, workouts: 0, cals: 0, score: 0 };

            if (feedData) {
                feedData.forEach((event: { event_type: string; created_at: string }) => {
                    const eventDate = new Date(event.created_at);
                    let dayIdx = eventDate.getDay() - 1;
                    if (dayIdx === -1) dayIdx = 6;

                    if (event.event_type === 'habit_completed') { dayMap[dayIdx].habits += 5; dayMap[dayIdx].total += 5; agg.habits++; agg.score += 5; }
                    if (event.event_type === 'perfect_day') { dayMap[dayIdx].perfect += 25; dayMap[dayIdx].total += 25; agg.perfect++; agg.score += 25; }
                    if (event.event_type === 'workout_completed') { dayMap[dayIdx].workout += 50; dayMap[dayIdx].total += 50; agg.workouts++; agg.score += 50; }
                    if (event.event_type === 'calorie_target_hit') { dayMap[dayIdx].cals += 50; dayMap[dayIdx].total += 50; agg.cals++; agg.score += 50; }
                });
            }

            setDailyData(dayMap);
            setTotals(agg);
            setIsLoading(false);
        };

        fetchData();
    }, [member.user_id, squadId]);

    const maxTotal = Math.max(...dailyData.map(d => d.total), 1);

    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center bg-black/80 backdrop-blur-md p-4 sm:p-6 pb-0 sm:pb-6">
            <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className="w-full max-w-md bg-brand-black border border-white/10 rounded-t-[32px] sm:rounded-[32px] p-6 relative flex flex-col max-h-[90vh]"
            >
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/20 rounded-full sm:hidden" />

                <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                    <X className="w-5 h-5 text-white/50" />
                </button>

                <div className="mt-4 mb-8">
                    <h3 className="text-2xl font-black">{member.name}&apos;s Week</h3>
                    <p className="text-xs font-bold uppercase tracking-widest text-brand-emerald mt-1">{totals.score} Total Points</p>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-emerald" /></div>
                ) : (
                    <div className="flex flex-col gap-8 flex-1 overflow-y-auto no-scrollbar pb-10">
                        <div className="h-48 flex items-end justify-between gap-2 px-2">
                            {dailyData.map((d, i) => (
                                <div key={i} className="flex flex-col items-center gap-2 flex-1 group">
                                    <div className="w-full relative flex flex-col justify-end h-32 bg-white/5 rounded-t-lg overflow-hidden">
                                        <motion.div initial={{ height: 0 }} animate={{ height: `${(d.workout / maxTotal) * 100}%` }} className="w-full bg-orange-500 rounded-t-sm" />
                                        <motion.div initial={{ height: 0 }} animate={{ height: `${(d.cals / maxTotal) * 100}%` }} className="w-full bg-blue-500 rounded-t-sm" />
                                        <motion.div initial={{ height: 0 }} animate={{ height: `${(d.perfect / maxTotal) * 100}%` }} className="w-full bg-amber-400 rounded-t-sm" />
                                        <motion.div initial={{ height: 0 }} animate={{ height: `${(d.habits / maxTotal) * 100}%` }} className="w-full bg-brand-emerald" />
                                    </div>
                                    <span className={`text-[10px] font-bold uppercase ${d.total > 0 ? 'text-white' : 'text-white/30'}`}>{d.day}</span>
                                    {d.total > 0 && <span className="text-[9px] font-mono text-white/50">{d.total}</span>}
                                </div>
                            ))}
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 mb-4 px-1">Score Breakdown</h4>

                            <BreakdownRow icon={Activity} color="text-brand-emerald" bg="bg-brand-emerald/10" label="Habits Completed" count={totals.habits} pts={totals.habits * 5} />
                            <BreakdownRow icon={Flame} color="text-amber-400" bg="bg-amber-400/10" label="Perfect Days" count={totals.perfect} pts={totals.perfect * 25} />
                            <BreakdownRow icon={Dumbbell} color="text-orange-500" bg="bg-orange-500/10" label="Workouts" count={totals.workouts} pts={totals.workouts * 50} />
                            <BreakdownRow icon={Target} color="text-blue-500" bg="bg-blue-500/10" label="Calorie Targets" count={totals.cals} pts={totals.cals * 50} />
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}

function BreakdownRow({ icon: Icon, color, bg, label, count, pts }: { icon: React.ElementType, color: string, bg: string, label: string, count: number, pts: number }) {
    if (count === 0) return null;
    return (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div>
                    <h5 className="font-bold text-sm">{label}</h5>
                    <p className="text-[10px] uppercase tracking-widest text-white/40 mt-0.5">{count}x times</p>
                </div>
            </div>
            <div className="text-right">
                <span className="font-mono font-bold text-lg">+{pts}</span>
            </div>
        </div>
    );
}

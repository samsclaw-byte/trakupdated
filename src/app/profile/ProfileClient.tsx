"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, LogOut, Bell, Moon, HeartPulse, Shield, Smartphone, Fingerprint, Activity, Crown, Loader2, Check } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { BottomTabBar } from "@/components/ui/BottomTabBar";
import { ProfileBadgeCard } from "@/components/ui/ProfileBadgeCard";
import { PillarProgressCards } from "@/components/ui/PillarProgressCards";
import { ProfileProgressModal } from "@/components/ui/ProfileProgressModal";

interface UserProfile {
    name: string;
    email: string;
    member_number: number | null;
    created_at: string;
    daily_calories: number;
    is_trak_plus: boolean;
}

export default function ProfileClient() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [pillarStreaks, setPillarStreaks] = useState({ nutrition: 0, habits: 0, fitness: 0 });
    const [showProgress, setShowProgress] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [whoopConnected, setWhoopConnected] = useState(false);
    const [whoopSyncing, setWhoopSyncing] = useState(false);
    const [whoopLastSync, setWhoopLastSync] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const loadProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/');
                return;
            }
            setUserId(user.id);

            const { data: dbUser } = await supabase
                .from('users')
                .select('name, email, member_number, created_at, daily_calories, is_trak_plus')
                .eq('id', user.id)
                .single();

            setProfile({
                name: dbUser?.name || user.user_metadata?.full_name || 'User',
                email: dbUser?.email || user.email || '',
                member_number: dbUser?.member_number || null,
                created_at: dbUser?.created_at || user.created_at,
                daily_calories: dbUser?.daily_calories || 2400,
                is_trak_plus: dbUser?.is_trak_plus || false,
            });

            // Calculate perfect days streak (ALL active habits completed)
            const { data: activeHabits } = await supabase
                .from('habit_definitions')
                .select('id')
                .eq('user_id', user.id)
                .eq('is_active', true);

            const { data: allLogs } = await supabase
                .from('habit_logs')
                .select('habit_id, date, completed')
                .eq('user_id', user.id)
                .eq('completed', true);

            if (activeHabits && allLogs && activeHabits.length > 0) {
                const logsByDate = allLogs.reduce((acc: Record<string, Set<string>>, log: { habit_id: string, date: string, completed: boolean }) => {
                    if (!acc[log.date]) acc[log.date] = new Set();
                    acc[log.date].add(log.habit_id);
                    return acc;
                }, {});

                const activeHabitIds = activeHabits.map((h: { id: string }) => h.id);

                const perfectDates = Object.keys(logsByDate).filter(date => {
                    const completedOnDate = logsByDate[date];
                    return activeHabitIds.every((id: string) => completedOnDate.has(id));
                }).sort((a, b) => b.localeCompare(a)); // Descending sort

                let bestHabitsStreak = 0;
                if (perfectDates.length > 0) {
                    let currentStreak = 1;
                    bestHabitsStreak = 1;
                    for (let i = 1; i < perfectDates.length; i++) {
                        const prev = new Date(perfectDates[i - 1]);
                        const curr = new Date(perfectDates[i]);
                        const diffDays = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
                        if (Math.round(diffDays) === 1) {
                            currentStreak++;
                            bestHabitsStreak = Math.max(bestHabitsStreak, currentStreak);
                        } else {
                            currentStreak = 1;
                        }
                    }
                }
                setPillarStreaks(prev => ({ ...prev, habits: bestHabitsStreak }));
            }

            // Load workout streak (consecutive days with workouts)
            const { data: workoutDays } = await supabase
                .from('workouts')
                .select('created_at')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(200);

            if (workoutDays && workoutDays.length > 0) {
                const uniqueDays = [...new Set(workoutDays.map((w: Record<string, unknown>) => new Date(w.created_at as string).toISOString().split('T')[0]))];
                let fitnessStreak = 1;
                let bestFitnessStreak = 1;
                for (let i = 1; i < uniqueDays.length; i++) {
                    const prev = new Date(uniqueDays[i - 1]);
                    const curr = new Date(uniqueDays[i]);
                    const diffDays = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
                    if (Math.round(diffDays) === 1) {
                        fitnessStreak++;
                        bestFitnessStreak = Math.max(bestFitnessStreak, fitnessStreak);
                    } else {
                        fitnessStreak = 1;
                    }
                }
                setPillarStreaks(prev => ({ ...prev, fitness: bestFitnessStreak }));
            }

            // Check Whoop connection status
            const { data: whoopToken } = await supabase
                .from("whoop_tokens")
                .select("id, updated_at")
                .eq("user_id", user.id)
                .maybeSingle();

            if (whoopToken) {
                setWhoopConnected(true);
                if (whoopToken.updated_at) {
                    setWhoopLastSync(new Date(whoopToken.updated_at).toLocaleTimeString());
                }
            }

            setIsLoading(false);
        };
        loadProfile();
    }, [router, supabase]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    const handleEditProfile = () => {
        router.push('/setup');
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    const formatDate = (dateString: string) => {
        const d = new Date(dateString);
        return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };

    const formatMemberNum = (num: number | null) => {
        if (!num) return "0001";
        return num.toString().padStart(4, '0');
    };

    return (
        <div className="min-h-screen bg-background text-foreground pb-24">
            <div className="px-6 py-8 space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold tracking-tighter">Profile</h1>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center mt-4 mb-10">
                        <div className="w-full max-w-sm h-28 animate-shimmer rounded-3xl shadow-2xl" />
                    </div>
                ) : (
                    <>
                        {/* Profile Badge Card */}
                        <div className="flex flex-col items-center mt-4 mb-6">
                            <ProfileBadgeCard
                                initials={getInitials(profile?.name || 'User')}
                                sinceDate={profile ? formatDate(profile.created_at) : 'Mar 2026'}
                                memberNumber={profile ? formatMemberNum(profile.member_number) : '0001'}
                                isTrakPlus={profile?.is_trak_plus || false}
                                nutritionStreak={pillarStreaks.nutrition}
                                habitsStreak={pillarStreaks.habits}
                                fitnessStreak={pillarStreaks.fitness}
                                tappable
                                name={profile?.name}
                            />
                            <button
                                onClick={() => setShowProgress(true)}
                                className="mt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-brand-emerald transition-colors flex items-center gap-1"
                            >
                                View 28-day progress →
                            </button>
                        </div>

                        {/* Pillar Progress Cards */}
                        <PillarProgressCards
                            nutritionStreak={pillarStreaks.nutrition}
                            habitsStreak={pillarStreaks.habits}
                            fitnessStreak={pillarStreaks.fitness}
                        />

                        {/* Upgrade Button (If not premium) */}
                        {profile?.is_trak_plus === false && (
                            <div className="mb-8">
                                <button
                                    onClick={() => router.push('/trak-plus')}
                                    className="w-full relative group overflow-hidden rounded-2xl p-[1px]"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-brand-emerald via-blue-500 to-brand-emerald opacity-70 group-hover:opacity-100 transition-opacity duration-500 bg-[length:200%_auto] animate-gradient"></div>
                                    <div className="relative bg-brand-black px-4 py-3 rounded-[15px] flex items-center justify-between group-hover:bg-opacity-90 transition-all duration-300">
                                        <div className="flex flex-col text-left">
                                            <span className="font-bold text-sm text-white flex items-center gap-1"><Crown className="w-4 h-4 text-brand-emerald" /> Upgrade to Trak+</span>
                                            <span className="text-[10px] text-white/60">Unlock premium colors & squads</span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                                    </div>
                                </button>
                            </div>
                        )}

                        {/* Stats & Goals */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60">Your Targets</h3>

                            <div className="p-6 bg-emerald-gradient rounded-3xl text-brand-black flex flex-col items-center justify-center text-center space-y-2">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Daily Goal</h4>
                                <p className="text-4xl font-bold tracking-tighter">
                                    {profile?.daily_calories.toLocaleString()} <span className="text-lg tracking-normal opacity-80">kcal</span>
                                </p>
                            </div>

                            <div className="pt-2">
                                {/* Biometric Scanner Button */}
                                <button
                                    onClick={handleEditProfile}
                                    className="relative w-full overflow-hidden bg-brand-black border border-white/5 hover:border-brand-emerald/30 rounded-3xl p-5 flex items-center justify-between group transition-all active:scale-[0.98] shadow-sm"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-brand-emerald/5 to-transparent pointer-events-none" />

                                    {/* Biometric Visual */}
                                    <div className="relative w-16 h-20 flex-shrink-0 flex items-center justify-center bg-black/40 rounded-xl border border-white/5 overflow-hidden">
                                        {/* Tech Background Grid */}
                                        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '4px 4px' }} />

                                        <Fingerprint className="w-10 h-10 text-white/40 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]" strokeWidth={1} />

                                        {/* Scanning Laser Line */}
                                        <motion.div
                                            animate={{ top: ["0%", "100%", "0%"] }}
                                            transition={{ duration: 3, ease: "linear", repeat: Infinity }}
                                            className="absolute left-0 right-0 h-[2px] bg-brand-emerald shadow-[0_0_12px_rgba(52,211,153,1)] z-10"
                                        />
                                    </div>

                                    <div className="text-right z-10 flex-1 pl-4">
                                        <div className="flex items-center justify-end gap-1.5 mb-1.5 opacity-80">
                                            <Activity className="w-3 h-3 text-brand-emerald" />
                                            <span className="text-[9px] text-brand-emerald font-black uppercase tracking-[0.2em]">Biometric Sync</span>
                                        </div>
                                        <span className="text-lg font-bold text-white tracking-tight block leading-tight">Update Personal Metrics</span>
                                        <span className="text-xs text-muted-foreground mt-1 block group-hover:text-white/70 transition-colors">Recalibrate targets & BMR</span>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Whoop Integration */}
                        <div className="space-y-4 pt-4">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60">Connected Devices</h3>
                            <div className="bg-white/5 border border-white/5 rounded-3xl overflow-hidden">
                                {whoopConnected ? (
                                    <div className="p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-brand-emerald/10 flex items-center justify-center">
                                                    <HeartPulse className="w-4 h-4 text-brand-emerald" />
                                                </div>
                                                <div>
                                                    <span className="font-medium text-foreground/90 block">Whoop</span>
                                                    <div className="flex items-center gap-1">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-brand-emerald" />
                                                        <span className="text-[10px] text-brand-emerald font-bold">Connected</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Check className="w-5 h-5 text-brand-emerald" />
                                        </div>
                                        <button
                                            onClick={async () => {
                                                setWhoopSyncing(true);
                                                try {
                                                    const res = await fetch('/api/whoop/sync?days=90', { method: 'POST' });
                                                    const logData = await res.json();
                                                    if (res.ok) {
                                                        setWhoopLastSync(new Date().toLocaleTimeString());
                                                        if (logData.workout_error || logData.recovery_error) {
                                                            alert(`Sync finished but had errors: ${JSON.stringify(logData)}`);
                                                        }
                                                    } else {
                                                        alert(`Sync failed: ${JSON.stringify(logData)}`);
                                                    }
                                                } catch (e) {
                                                    console.error('Whoop sync failed:', e);
                                                } finally {
                                                    setWhoopSyncing(false);
                                                }
                                            }}
                                            disabled={whoopSyncing}
                                            className="w-full p-2.5 bg-brand-emerald/10 border border-brand-emerald/20 rounded-xl text-sm font-bold text-brand-emerald flex items-center justify-center gap-2 hover:bg-brand-emerald/20 transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            {whoopSyncing ? (
                                                <><Loader2 className="w-4 h-4 animate-spin" /> Syncing...</>
                                            ) : (
                                                <>Sync Now{whoopLastSync && <span className="text-[10px] font-normal text-muted-foreground ml-1">Last: {whoopLastSync}</span>}</>
                                            )}
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => window.location.href = '/api/whoop/auth'}
                                        className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors active:bg-white/5 group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                                                <HeartPulse className="w-4 h-4 text-muted-foreground group-hover:text-brand-emerald transition-colors" />
                                            </div>
                                            <div className="text-left">
                                                <span className="font-medium text-foreground/90 block">Connect Whoop</span>
                                                <span className="text-[10px] text-muted-foreground">Sync workouts, recovery & sleep</span>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-white/20" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Settings List */}
                        <div className="space-y-4 pt-4">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60">Settings</h3>
                            <div className="bg-white/5 border border-white/5 rounded-3xl overflow-hidden divide-y divide-white/5">
                                <SettingsRow icon={Bell} label="Push Notifications" value="On" />
                                <SettingsRow icon={Moon} label="App Theme" value="Dark" />
                                <SettingsRow icon={Shield} label="Privacy & Data" />
                                <SettingsRow icon={Smartphone} label="App Version" value="Beta v1.01" />
                            </div>
                        </div>

                        {/* Log Out */}
                        <div className="pt-8 pb-4">
                            <button
                                onClick={handleLogout}
                                className="w-full p-4 bg-red-500/10 text-red-400 font-bold rounded-2xl flex items-center justify-center gap-2 transition-all hover:bg-red-500/20 active:scale-95"
                            >
                                <LogOut className="w-5 h-5" />
                                Log Out
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* 28-day progress modal */}
            {showProgress && userId && (
                <ProfileProgressModal
                    userId={userId}
                    onClose={() => setShowProgress(false)}
                />
            )}

            <BottomTabBar />
        </div>
    );
}

function SettingsRow({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value?: string }) {
    return (
        <button className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-white-[0.02] transition-colors active:bg-white/5 group">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-muted-foreground group-hover:text-white transition-colors" />
                </div>
                <span className="font-medium text-foreground/90">{label}</span>
            </div>
            <div className="flex items-center gap-2">
                {value && <span className="text-xs font-semibold text-muted-foreground">{value}</span>}
                <ChevronRight className="w-4 h-4 text-white/20" />
            </div>
        </button>
    );
}

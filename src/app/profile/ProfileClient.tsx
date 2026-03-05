"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, LogOut, Bell, Moon, HeartPulse, Shield, Smartphone, User, Activity, Crown } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { BottomTabBar } from "@/components/ui/BottomTabBar";

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
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const loadProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/');
                return;
            }

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
                        {/* Prestige Badge (Classic Pill) */}
                        <div className="flex flex-col items-center mt-4 mb-10">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="relative w-full max-w-sm h-28 bg-white/5 rounded-3xl border border-white/10 overflow-hidden shadow-2xl flex items-center justify-between px-8"
                            >
                                {/* Glass shine effect */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
                                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-emerald/10 blur-3xl mix-blend-screen pointer-events-none" />

                                <div className="space-y-1 relative z-10">
                                    <h2 className="text-4xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-white to-white/50">
                                        {profile ? getInitials(profile.name) : "JD"}
                                    </h2>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                                        Since {profile ? formatDate(profile.created_at) : "Mar 2026"}
                                    </p>
                                </div>
                                <div className="text-right relative z-10 w-full flex flex-col items-end">
                                    {profile?.is_trak_plus ? (
                                        <div className="flex items-center gap-1 mb-1 text-brand-emerald">
                                            <Crown className="w-3 h-3 fill-current" />
                                            <p className="text-[10px] uppercase tracking-widest font-bold">Trak+ Pro</p>
                                        </div>
                                    ) : (
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Trak Free</p>
                                    )}
                                    <p className="text-2xl font-serif italic text-white/80 tracking-widest">
                                        No. {profile ? formatMemberNum(profile.member_number) : "0042"}
                                    </p>
                                </div>
                            </motion.div>
                        </div>

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

                            {/* Biometric Scanner Button */}
                            <button
                                onClick={handleEditProfile}
                                className="relative w-full overflow-hidden bg-white/5 border border-brand-emerald/20 rounded-3xl p-5 flex items-center justify-between group transition-all active:scale-[0.98] hover:bg-white/10 mt-2"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-brand-emerald/5 to-transparent pointer-events-none" />

                                {/* Biometric Visual */}
                                <div className="relative w-16 h-20 flex-shrink-0 flex items-center justify-center bg-black/40 rounded-xl border border-white/5 overflow-hidden">
                                    {/* Tech Background Grid */}
                                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '8px 8px' }} />

                                    <User className="w-10 h-10 text-white/50" strokeWidth={1} />

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
                                    <span className="text-xs text-muted-foreground mt-1 block">Recalibrate targets & BMR</span>
                                </div>
                            </button>
                        </div>

                        {/* Settings List */}
                        <div className="space-y-4 pt-4">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60">Settings (Placeholder)</h3>
                            <div className="bg-white/5 border border-white/5 rounded-3xl overflow-hidden divide-y divide-white/5">
                                <SettingsRow icon={Bell} label="Push Notifications" value="On" />
                                <SettingsRow icon={HeartPulse} label="Apple Health Sync" value="Connected" />
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

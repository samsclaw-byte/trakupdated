"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, LogOut, Bell, Moon, HeartPulse, Shield, Smartphone } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { BottomTabBar } from "@/components/ui/BottomTabBar";

interface UserProfile {
    name: string;
    email: string;
    member_number: number | null;
    created_at: string;
    daily_calories: number;
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
                .select('name, email, member_number, created_at, daily_calories')
                .eq('id', user.id)
                .single();

            setProfile({
                name: dbUser?.name || user.user_metadata?.full_name || 'User',
                email: dbUser?.email || user.email || '',
                member_number: dbUser?.member_number || null,
                created_at: dbUser?.created_at || user.created_at,
                daily_calories: dbUser?.daily_calories || 2400,
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
                    <div className="h-24 bg-white/5 rounded-3xl animate-pulse" />
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
                                <div className="text-right relative z-10">
                                    <p className="text-[10px] text-brand-emerald uppercase tracking-widest font-bold mb-1">trak Member</p>
                                    <p className="text-2xl font-serif italic text-white/80 tracking-widest">
                                        No. {profile ? formatMemberNum(profile.member_number) : "0042"}
                                    </p>
                                </div>
                            </motion.div>
                        </div>

                        {/* Stats & Goals */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60">Your Targets</h3>
                            <div className="p-6 bg-emerald-gradient rounded-3xl text-brand-black flex flex-col items-center justify-center text-center space-y-4">
                                <div className="space-y-1">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Daily Goal</h4>
                                    <p className="text-4xl font-bold tracking-tighter">
                                        {profile?.daily_calories.toLocaleString()} <span className="text-lg tracking-normal opacity-80">kcal</span>
                                    </p>
                                </div>
                                <button
                                    onClick={handleEditProfile}
                                    className="px-6 py-2.5 bg-brand-black text-brand-emerald font-bold rounded-2xl text-sm transition-transform active:scale-95 hover:bg-black w-full max-w-[200px]"
                                >
                                    Edit Body Profile
                                </button>
                            </div>
                        </div>

                        {/* Settings List */}
                        <div className="space-y-4 pt-4">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60">Settings</h3>
                            <div className="bg-white/5 border border-white/5 rounded-3xl overflow-hidden divide-y divide-white/5">
                                <SettingsRow icon={Bell} label="Push Notifications" value="On" />
                                <SettingsRow icon={HeartPulse} label="Apple Health Sync" value="Connected" />
                                <SettingsRow icon={Moon} label="App Theme" value="Dark" />
                                <SettingsRow icon={Shield} label="Privacy & Data" />
                                <SettingsRow icon={Smartphone} label="App Version" value="v1.0.4" />
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

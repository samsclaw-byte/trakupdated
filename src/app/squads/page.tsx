"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, Key, X, Loader2, Trophy, Activity } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { BottomTabBar } from "@/components/ui/BottomTabBar";
import { FeedCard, FeedItem } from "@/components/squads/FeedCard";

interface Squad {
    id: string;
    name: string;
    join_code: string;
    created_at: string;
}

interface LeaderboardMember {
    user_id: string;
    name: string;
    total_score: number;
    habit_completions: number;
    perfect_days: number;
    calorie_hits: number;
    reactions_given: number;
}

export default function SquadsPage() {
    const supabase = createClient();

    const [squads, setSquads] = useState<Squad[]>([]);
    const [isLoadingInit, setIsLoadingInit] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string>("");

    // Onboarding Modals
    const [showCreate, setShowCreate] = useState(false);
    const [showJoin, setShowJoin] = useState(false);
    const [squadName, setSquadName] = useState("");
    const [joinCode, setJoinCode] = useState("");
    const [isActionLoading, setIsActionLoading] = useState(false);

    // Dashboard State
    const [activeTab, setActiveTab] = useState<'feed' | 'leaderboard'>('feed');
    const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
    const [leaderboard, setLeaderboard] = useState<LeaderboardMember[]>([]);
    const [isDataLoading, setIsDataLoading] = useState(false);

    const fetchSquads = useCallback(async () => {
        setIsLoadingInit(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setCurrentUserId(user.id);

        const { data, error } = await supabase
            .from('squad_members')
            .select(`squads (id, name, join_code, created_at)`)
            .eq('user_id', user.id);

        if (!error && data) {
            const mappedSquads = data.map((d: { squads: unknown }) => d.squads as Squad);
            setSquads(mappedSquads);
        }
        setIsLoadingInit(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        fetchSquads();
    }, [fetchSquads]);

    // Fetch Feed or Leaderboard when tab or squad changes
    const fetchDashboardData = useCallback(async (squadId: string) => {
        setIsDataLoading(true);

        if (activeTab === 'feed') {
            const { data } = await supabase
                .from('squad_feed')
                .select(`
                    *,
                    users ( id, name ),
                    squad_reactions ( id, emoji, user_id )
                `)
                .eq('squad_id', squadId)
                .order('created_at', { ascending: false })
                .limit(50);

            if (data) setFeedItems(data as unknown as FeedItem[]);
        } else {
            // Leaderboard (Current week Mon-Sun)
            const today = new Date();
            const day = today.getDay();
            const diff = today.getDate() - day + (day === 0 ? -6 : 1);
            const startOfWeek = new Date(today.setDate(diff)).toISOString().split('T')[0];
            const endOfWeek = new Date(today.setDate(diff + 6)).toISOString().split('T')[0];

            const { data } = await supabase.rpc('calculate_squad_leaderboard', {
                target_squad_id: squadId,
                start_date: startOfWeek,
                end_date: endOfWeek
            });
            if (data) setLeaderboard(data);
        }
        setIsDataLoading(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    useEffect(() => {
        if (squads.length > 0) {
            fetchDashboardData(squads[0].id);
        }
    }, [squads, activeTab, fetchDashboardData]);


    const generateJoinCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

    const handleCreateSquad = async () => {
        if (!squadName.trim() || !currentUserId) return;
        setIsActionLoading(true);
        const code = generateJoinCode();

        const { data: newSquad, error: squadError } = await supabase
            .from('squads')
            .insert({ name: squadName.trim(), join_code: code, created_by: currentUserId })
            .select().single();

        if (newSquad && !squadError) {
            await supabase
                .from('squad_members')
                .insert({ squad_id: newSquad.id, user_id: currentUserId, role: 'admin' });

            setSquadName(""); setShowCreate(false);
            await fetchSquads();
        }
        setIsActionLoading(false);
    };

    const handleJoinSquad = async () => {
        if (!joinCode.trim() || !currentUserId) return;
        setIsActionLoading(true);

        const { data: foundSquad, error: findError } = await supabase
            .from('squads')
            .select('*')
            .eq('join_code', joinCode.trim().toUpperCase())
            .single();

        if (foundSquad && !findError) {
            await supabase
                .from('squad_members')
                .insert({ squad_id: foundSquad.id, user_id: currentUserId, role: 'member' });

            setJoinCode(""); setShowJoin(false);
            await fetchSquads();
        } else {
            alert("Invalid join code");
        }
        setIsActionLoading(false);
    };

    if (isLoadingInit && squads.length === 0) {
        return (
            <div className="flex flex-col min-h-screen bg-brand-black text-white items-center justify-center">
                <Loader2 className="w-8 h-8 text-brand-emerald animate-spin" />
                <BottomTabBar />
            </div>
        );
    }

    // --- RENDER ONBOARDING (No Squads) ---
    if (squads.length === 0) {
        return (
            <div className="flex flex-col min-h-screen bg-brand-black text-white pb-32">
                <div className="px-6 pt-12 pb-6 border-b border-white/5 sticky top-0 bg-brand-black/90 backdrop-blur-xl z-40">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Squads</h1>
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1">Beta Access</p>
                    </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center mt-12">
                    <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-xl">
                        <Users className="w-10 h-10 text-brand-emerald" />
                    </div>
                    <h2 className="text-2xl font-bold mb-3">Assemble Your Squad</h2>
                    <p className="text-muted-foreground text-sm max-w-[280px] leading-relaxed mb-10">
                        Invite friends or family to a private tracking squad. Share milestones, give kudos, and stay consistent together.
                    </p>

                    <div className="flex flex-col w-full gap-4 max-w-sm">
                        <button
                            onClick={() => setShowCreate(true)}
                            className="py-4 bg-brand-emerald text-brand-black font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            <Plus className="w-5 h-5" /> Create New Squad
                        </button>
                        <button
                            onClick={() => setShowJoin(true)}
                            className="py-4 bg-white/5 text-white font-bold rounded-xl border border-white/10 transition-all hover:bg-white/10 flex items-center justify-center gap-2"
                        >
                            <Key className="w-5 h-5" /> Join via Code
                        </button>
                    </div>
                </div>

                {/* Modals */}
                <AnimatePresence>
                    {showCreate && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                                className="bg-card w-full max-w-sm rounded-3xl p-6 border border-white/10"
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-bold">Create Squad</h3>
                                    <button onClick={() => setShowCreate(false)} className="p-2 bg-white/5 rounded-full"><X className="w-4 h-4" /></button>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Squad Name (e.g., Morning Crew)"
                                    required
                                    value={squadName}
                                    onChange={(e) => setSquadName(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 mb-6 focus:outline-none focus:border-brand-emerald transition-colors"
                                />
                                <button
                                    onClick={handleCreateSquad}
                                    disabled={isActionLoading || !squadName.trim()}
                                    className="w-full py-4 bg-brand-emerald text-brand-black font-bold rounded-xl disabled:opacity-50 flex items-center justify-center"
                                >
                                    {isActionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Deploy Squad"}
                                </button>
                            </motion.div>
                        </motion.div>
                    )}

                    {showJoin && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                                className="bg-card w-full max-w-sm rounded-3xl p-6 border border-white/10"
                            >
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-bold">Join Squad</h3>
                                    <button onClick={() => setShowJoin(false)} className="p-2 bg-white/5 rounded-full"><X className="w-4 h-4" /></button>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Enter 6-character Code"
                                    required
                                    value={joinCode}
                                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 mb-6 focus:outline-none focus:border-brand-emerald transition-colors font-mono text-center uppercase tracking-widest text-xl"
                                />
                                <button
                                    onClick={handleJoinSquad}
                                    disabled={isActionLoading || !joinCode.trim()}
                                    className="w-full py-4 bg-brand-emerald text-brand-black font-bold rounded-xl disabled:opacity-50 flex items-center justify-center"
                                >
                                    {isActionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & Join"}
                                </button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <BottomTabBar />
            </div>
        );
    }

    // --- RENDER SQUAD DASHBOARD ---
    const activeSquad = squads[0];

    return (
        <div className="flex flex-col min-h-screen bg-brand-black text-white pb-32">

            {/* Header */}
            <div className="px-6 pt-12 pb-4 border-b border-white/5 sticky top-0 bg-brand-black/90 backdrop-blur-xl z-40">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{activeSquad?.name}</h1>
                        <p className="text-xs font-bold font-mono tracking-widest text-brand-emerald mt-1">CODE: {activeSquad?.join_code}</p>
                    </div>
                </div>

                {/* Sub-navigation Toggles */}
                <div className="flex gap-2 bg-white/5 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('feed')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'feed' ? 'bg-white/10 text-white shadow-sm' : 'text-muted-foreground hover:text-white'}`}
                    >
                        <Activity className="w-4 h-4" /> Activity Feed
                    </button>
                    <button
                        onClick={() => setActiveTab('leaderboard')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'leaderboard' ? 'bg-white/10 text-white shadow-sm' : 'text-muted-foreground hover:text-white'}`}
                    >
                        <Trophy className="w-4 h-4" /> Leaderboard
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="p-6">
                {isDataLoading ? (
                    <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-emerald" /></div>
                ) : activeTab === 'feed' ? (
                    feedItems.length > 0 ? (
                        <div className="flex flex-col gap-4">
                            <AnimatePresence>
                                {feedItems.map(item => (
                                    <FeedCard key={item.id} item={item} currentUserId={currentUserId} />
                                ))}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                            <Activity className="w-12 h-12 mb-4" />
                            <p className="text-sm font-medium">It&apos;s quiet here. Complete a habit to start the feed!</p>
                        </div>
                    )
                ) : (
                    leaderboard.length > 0 ? (
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                <span>Member</span>
                                <span>Trak Score</span>
                            </div>
                            {leaderboard.map((member, index) => (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }}
                                    key={member.user_id}
                                    className={`flex items-center justify-between p-4 rounded-xl border ${index === 0 ? 'bg-amber-500/10 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'bg-white/5 border-white/5'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${index === 0 ? 'bg-amber-500 text-black' : 'bg-white/10 text-white'}`}>
                                            #{index + 1}
                                        </div>
                                        <div>
                                            <p className={`font-bold ${index === 0 ? 'text-amber-500' : 'text-white'}`}>{member.name}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {member.habit_completions} Habits · {member.perfect_days} Perfect
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-xl font-black font-mono tracking-tighter">
                                        {member.total_score}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                            <Trophy className="w-12 h-12 mb-4" />
                            <p className="text-sm font-medium">Leaderboard calculates at the end of the day.</p>
                        </div>
                    )
                )}
            </div>

            <BottomTabBar />
        </div>
    );
}

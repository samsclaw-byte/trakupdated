"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, Key, X, Loader2, Trophy, Activity, Share2, Crown } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { BottomTabBar } from "@/components/ui/BottomTabBar";
import { FeedCard, FeedItem } from "@/components/squads/FeedCard";
import { ProfileBadgeCard } from "@/components/ui/ProfileBadgeCard";

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

interface SquadMember {
    user_id: string;
    role: string;
    joined_at: string;
    users: {
        name: string;
        member_number: number | null;
        created_at: string;
        is_trak_plus: boolean;
    };
    habitsStreak: number;
    fitnessStreak: number;
}

function SquadsContent() {
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
    const searchParams = useSearchParams();

    // Dashboard State
    const [activeSquadIndex, setActiveSquadIndex] = useState(0);
    const [activeTab, setActiveTab] = useState<'feed' | 'leaderboard' | 'members'>('feed');
    const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
    const [leaderboard, setLeaderboard] = useState<LeaderboardMember[]>([]);
    const [squadMembers, setSquadMembers] = useState<SquadMember[]>([]);
    const [isDataLoading, setIsDataLoading] = useState(false);
    const [isTrakPlus, setIsTrakPlus] = useState(false);

    const fetchSquads = useCallback(async () => {
        setIsLoadingInit(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.warn('[Squads] No authenticated user found — page will show onboarding.');
            setIsLoadingInit(false);
            return;
        }
        console.log('[Squads] Authenticated as:', user.id, user.email);
        setCurrentUserId(user.id);

        // Check Trak+ status
        const { data: profile } = await supabase.from('users').select('is_trak_plus').eq('id', user.id).single();
        setIsTrakPlus(profile?.is_trak_plus || false);

        const { data, error } = await supabase
            .from('squad_members')
            .select(`squads (id, name, join_code, created_at)`)
            .eq('user_id', user.id);

        if (!error && data) {
            const mappedSquads = data.map((d: { squads: unknown }) => d.squads as Squad);
            setSquads(mappedSquads);
            console.log('[Squads] User is in', mappedSquads.length, 'squad(s)');
        }
        setIsLoadingInit(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        fetchSquads();
    }, [fetchSquads]);

    // Deep link: auto-join if ?code=XXXXXX in URL
    useEffect(() => {
        const code = searchParams.get('code');
        if (code && currentUserId && !isLoadingInit) {
            console.log('[Squads] Deep link detected, auto-joining with code:', code);
            setJoinCode(code.toUpperCase());
            handleJoinSquad(code);
            // Clean the URL
            window.history.replaceState({}, '', '/squads');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUserId, isLoadingInit, searchParams]);

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
        } else if (activeTab === 'leaderboard') {
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
        } else if (activeTab === 'members') {
            const { data } = await supabase
                .from('squad_members')
                .select(`
                    user_id, role, joined_at,
                    users ( name, member_number, created_at, is_trak_plus )
                `)
                .eq('squad_id', squadId)
                .order('role', { ascending: true })
                .order('joined_at', { ascending: true });

            if (data) {
                // For each member, fetch their best habit streak and workout streak
                const enriched = await Promise.all(
                    (data as unknown as Omit<SquadMember, 'habitsStreak' | 'fitnessStreak'>[]).map(async (member) => {
                        // Best habit streak
                        const { data: streaks } = await supabase
                            .from('habit_streaks')
                            .select('best_streak')
                            .eq('user_id', member.user_id)
                            .order('best_streak', { ascending: false })
                            .limit(1);
                        const habitsStreak = streaks?.[0]?.best_streak || 0;

                        // Workout streak (count distinct workout days)
                        const { data: workouts } = await supabase
                            .from('workouts')
                            .select('created_at')
                            .eq('user_id', member.user_id)
                            .order('created_at', { ascending: false })
                            .limit(100);

                        let fitnessStreak = 0;
                        if (workouts && workouts.length > 0) {
                            const days = [...new Set(workouts.map((w: { created_at: string }) =>
                                new Date(w.created_at).toISOString().split('T')[0]
                            ))];
                            let streak = 1;
                            let best = 1;
                            for (let i = 1; i < days.length; i++) {
                                const diff = (new Date(days[i - 1]).getTime() - new Date(days[i]).getTime()) / 86400000;
                                if (Math.round(diff) === 1) { streak++; best = Math.max(best, streak); }
                                else { streak = 1; }
                            }
                            fitnessStreak = best;
                        }

                        return { ...member, habitsStreak, fitnessStreak };
                    })
                );
                setSquadMembers(enriched as SquadMember[]);
            }
        }
        setIsDataLoading(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    useEffect(() => {
        if (squads.length > 0 && squads[activeSquadIndex]) {
            fetchDashboardData(squads[activeSquadIndex].id);
        }
    }, [squads, activeSquadIndex, activeTab, fetchDashboardData]);

    // Realtime Polling for the Feed
    useEffect(() => {
        const currentSquad = squads[activeSquadIndex];
        if (!currentSquad || activeTab !== 'feed') return;

        // Subscribe to feed inserts
        const channel = supabase.channel('squad-feed-changes')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'squad_feed', filter: `squad_id=eq.${currentSquad.id}` },
                (payload) => {
                    // Refetch neatly (could also manually inject into state, but refetch guarantees we get the joined user data + reactions)
                    fetchDashboardData(currentSquad.id);
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'squad_reactions' },
                (payload) => {
                    // We just refetch the feed to update reaction counts globally
                    fetchDashboardData(currentSquad.id);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [squads, activeSquadIndex, activeTab, fetchDashboardData, supabase]);

    const generateJoinCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

    const handleCreateSquad = async () => {
        if (!squadName.trim() || !currentUserId) return;
        if (squads.length >= maxSquads) {
            alert(isTrakPlus ? 'You have reached the maximum of 5 squads.' : 'Free accounts can join up to 2 squads. Upgrade to Trak+ for 5!');
            return;
        }
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

    const handleJoinSquad = async (codeOverride?: string) => {
        const code = (codeOverride || joinCode).trim().toUpperCase();
        if (!code || !currentUserId) {
            console.warn('[Squads] Join attempt with empty code or no user');
            return;
        }
        if (squads.length >= maxSquads) {
            alert(isTrakPlus ? 'You have reached the maximum of 5 squads.' : 'Free accounts can join up to 2 squads. Upgrade to Trak+ for 5!');
            return;
        }
        setIsActionLoading(true);
        console.log('[Squads] Attempting to join with code:', code, 'User:', currentUserId);

        // Step 1: Find the squad
        const { data: foundSquad, error: findError } = await supabase
            .from('squads')
            .select('*')
            .eq('join_code', code)
            .single();

        if (findError || !foundSquad) {
            console.error('[Squads] Code lookup failed:', findError?.message || 'No squad found for code: ' + code);
            alert(`No squad found with code "${code}". Please check the code and try again.`);
            setIsActionLoading(false);
            return;
        }

        console.log('[Squads] Found squad:', foundSquad.name, foundSquad.id);

        // Step 2: Check if already a member
        const { data: existingMember } = await supabase
            .from('squad_members')
            .select('id')
            .eq('squad_id', foundSquad.id)
            .eq('user_id', currentUserId)
            .maybeSingle();

        if (existingMember) {
            console.warn('[Squads] User already a member of this squad');
            alert(`You're already a member of "${foundSquad.name}"!`);
            setIsActionLoading(false);
            return;
        }

        // Step 3: Insert membership
        const { error: insertError } = await supabase
            .from('squad_members')
            .insert({ squad_id: foundSquad.id, user_id: currentUserId, role: 'member' });

        if (insertError) {
            console.error('[Squads] Failed to join squad:', insertError.message, insertError.details, insertError.hint);
            alert(`Failed to join squad: ${insertError.message}. Please try again or contact support.`);
            setIsActionLoading(false);
            return;
        }

        // Step 4: Post "joined" event to feed
        await supabase.from('squad_feed').insert({
            squad_id: foundSquad.id,
            user_id: currentUserId,
            event_type: 'joined',
            metadata: {},
        });

        console.log('[Squads] Successfully joined squad:', foundSquad.name);
        setJoinCode(""); setShowJoin(false);
        await fetchSquads();
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
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-lg font-bold">Join Squad</h3>
                                    <button onClick={() => setShowJoin(false)} className="p-2 bg-white/5 rounded-full"><X className="w-4 h-4" /></button>
                                </div>
                                <p className="text-xs text-muted-foreground mb-6">Ask the squad admin for their 6-character invite code.</p>

                                {/* OTP-style 6-box input */}
                                <div className="flex gap-2 justify-center mb-6">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <input
                                            key={i}
                                            id={`otp-${i}`}
                                            type="text"
                                            maxLength={1}
                                            value={joinCode[i] || ''}
                                            onChange={(e) => {
                                                const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                                                const newCode = joinCode.split('');
                                                newCode[i] = val;
                                                const combined = newCode.join('').substring(0, 6);
                                                setJoinCode(combined);
                                                // Auto-focus next box
                                                if (val && i < 5) {
                                                    document.getElementById(`otp-${i + 1}`)?.focus();
                                                }
                                            }}
                                            onKeyDown={(e) => {
                                                // Allow backspace to go to previous box
                                                if (e.key === 'Backspace' && !joinCode[i] && i > 0) {
                                                    document.getElementById(`otp-${i - 1}`)?.focus();
                                                }
                                            }}
                                            onPaste={(e) => {
                                                e.preventDefault();
                                                const pasted = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 6);
                                                setJoinCode(pasted);
                                                const focusIdx = Math.min(pasted.length, 5);
                                                document.getElementById(`otp-${focusIdx}`)?.focus();
                                            }}
                                            className="w-11 h-14 bg-white/5 border border-white/10 rounded-xl text-center text-xl font-mono font-bold uppercase focus:outline-none focus:border-brand-emerald focus:bg-brand-emerald/5 transition-all"
                                        />
                                    ))}
                                </div>

                                <button
                                    onClick={() => handleJoinSquad()}
                                    disabled={isActionLoading || joinCode.length < 6}
                                    className="w-full py-4 bg-brand-emerald text-brand-black font-bold rounded-xl disabled:opacity-50 flex items-center justify-center transition-all"
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
    const activeSquad = squads[activeSquadIndex] || squads[0];
    const maxSquads = isTrakPlus ? 5 : 2;

    const handleShareInvite = async () => {
        const url = `${window.location.origin}/squads?code=${activeSquad.join_code}`;
        const text = `Join my Trak squad '${activeSquad.name}'! Use code: ${activeSquad.join_code}\n${url}`;
        if (navigator.share) {
            try {
                await navigator.share({ title: 'Join my Trak Squad', text, url });
            } catch { /* user cancelled */ }
        } else {
            await navigator.clipboard.writeText(url);
            alert('Invite link copied to clipboard!');
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-brand-black text-white pb-32">
            {/* Header */}
            <div className="px-6 pt-12 pb-4 border-b border-white/5 sticky top-0 bg-brand-black/90 backdrop-blur-xl z-40">
                {/* Multi-squad pill switcher */}
                {squads.length > 1 && (
                    <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar">
                        {squads.map((s, i) => (
                            <button
                                key={s.id}
                                onClick={() => setActiveSquadIndex(i)}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${i === activeSquadIndex ? 'bg-brand-emerald text-brand-black' : 'bg-white/5 text-muted-foreground hover:bg-white/10'}`}
                            >
                                {s.name}
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{activeSquad?.name}</h1>
                        <p className="text-xs font-bold font-mono tracking-widest text-brand-emerald mt-1">CODE: {activeSquad?.join_code}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleShareInvite}
                            className="p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all"
                            title="Share invite code"
                        >
                            <Share2 className="w-4 h-4 text-brand-emerald" />
                        </button>
                        {squads.length < maxSquads && (
                            <div className="flex gap-1.5">
                                <button
                                    onClick={() => setShowCreate(true)}
                                    className="p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all"
                                    title="Create new squad"
                                >
                                    <Plus className="w-4 h-4 text-brand-emerald" />
                                </button>
                                <button
                                    onClick={() => setShowJoin(true)}
                                    className="p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all"
                                    title="Join a squad"
                                >
                                    <Key className="w-4 h-4 text-brand-emerald" />
                                </button>
                            </div>
                        )}
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
                    <button
                        onClick={() => setActiveTab('members')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'members' ? 'bg-white/10 text-white shadow-sm' : 'text-muted-foreground hover:text-white'}`}
                    >
                        <Users className="w-4 h-4" /> Members
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
                ) : activeTab === 'leaderboard' ? (
                    leaderboard.length > 0 ? (
                        <div className="flex flex-col gap-4">
                            {/* Weekly Season Header */}
                            <div className="flex items-center justify-between px-1 mb-2">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">This Week&apos;s Season</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{(() => {
                                        const today = new Date();
                                        const day = today.getDay();
                                        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
                                        const mon = new Date(today); mon.setDate(diff);
                                        const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
                                        const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                        return `${fmt(mon)} – ${fmt(sun)}`;
                                    })()}</p>
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                                    <Trophy className="w-3.5 h-3.5 text-amber-500" /> Trak Score
                                </div>
                            </div>

                            {/* Podium Cards */}
                            {leaderboard.map((member, index) => {
                                const medals = ['🥇', '🥈', '🥉'];
                                const medalColors = [
                                    'bg-gradient-to-r from-amber-500/15 to-amber-600/5 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.15)]',
                                    'bg-gradient-to-r from-slate-300/10 to-slate-400/5 border-slate-400/20 shadow-[0_0_15px_rgba(148,163,184,0.1)]',
                                    'bg-gradient-to-r from-orange-700/10 to-orange-800/5 border-orange-700/20 shadow-[0_0_12px_rgba(194,65,12,0.1)]',
                                ];
                                const rankBgColors = ['bg-amber-500 text-black', 'bg-slate-400 text-black', 'bg-orange-700 text-white'];
                                const nameColors = ['text-amber-400', 'text-slate-300', 'text-orange-400'];
                                const isTopThree = index < 3;
                                const scoreColors = ['text-amber-400', 'text-slate-300', 'text-orange-400'];

                                return (
                                    <motion.div
                                        initial={{ opacity: 0, x: -15 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.08, type: "spring", bounce: 0.3 }}
                                        key={member.user_id}
                                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isTopThree ? medalColors[index] : 'bg-white/[0.02] border-white/5'}`}
                                    >
                                        <div className="flex items-center gap-3.5">
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${isTopThree ? rankBgColors[index] : 'bg-white/10 text-muted-foreground'}`}>
                                                {isTopThree ? medals[index] : `#${index + 1}`}
                                            </div>
                                            <div>
                                                <p className={`font-bold text-sm ${isTopThree ? nameColors[index] : 'text-white/80'}`}>
                                                    {member.name}
                                                    {index === 0 && <span className="ml-1.5 text-[9px] font-black uppercase tracking-widest text-amber-500/70">Leader</span>}
                                                </p>
                                                <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                                                    <span>{member.habit_completions} habits</span>
                                                    <span className="text-white/10">·</span>
                                                    <span>{member.perfect_days} perfect</span>
                                                    {member.calorie_hits > 0 && (
                                                        <>
                                                            <span className="text-white/10">·</span>
                                                            <span>{member.calorie_hits} cal hits</span>
                                                        </>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`text-xl font-black font-mono tracking-tighter ${isTopThree ? scoreColors[index] : 'text-white/60'}`}>
                                            {member.total_score}
                                        </div>
                                    </motion.div>
                                );
                            })}

                            {/* Scoring Legend */}
                            <div className="mt-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3">Scoring System</p>
                                <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                                    <span>✅ Habit Completion</span><span className="text-right font-mono font-bold text-white/50">+5 pts</span>
                                    <span>🏋️ Workout Logged</span><span className="text-right font-mono font-bold text-white/50">+50 pts</span>
                                    <span>🎯 Calorie Target Hit</span><span className="text-right font-mono font-bold text-white/50">+50 pts</span>
                                    <span>⭐ Perfect Habit Day</span><span className="text-right font-mono font-bold text-white/50">+25 pts</span>
                                    <span>🔱 Trifecta Bonus</span><span className="text-right font-mono font-bold text-white/50">+10 pts</span>
                                    <span>🔥 Reaction Given</span><span className="text-right font-mono font-bold text-white/50">+2 pts</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                            <Trophy className="w-12 h-12 mb-4" />
                            <p className="text-sm font-medium">Leaderboard calculates at the end of the day.</p>
                        </div>
                    )
                ) : (
                    <div className="flex flex-col gap-4">
                        {squadMembers.map((member, index) => {
                            const name = member.users?.name || 'User';
                            const initials = name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
                            const joinedDate = new Date(member.users?.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                            const memberNum = member.users?.member_number?.toString().padStart(4, '0') || '0001';
                            const isTrakPlus = member.users?.is_trak_plus || false;

                            return (
                                <motion.div
                                    key={member.user_id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    {member.role === 'admin' && (
                                        <p className="text-[9px] uppercase tracking-widest font-black text-amber-500 mb-1.5 pl-1">👑 Admin</p>
                                    )}
                                    <ProfileBadgeCard
                                        initials={initials}
                                        sinceDate={`Since ${joinedDate}`}
                                        memberNumber={memberNum}
                                        isTrakPlus={isTrakPlus}
                                        nutritionStreak={0}
                                        habitsStreak={member.habitsStreak}
                                        fitnessStreak={member.fitnessStreak}
                                        tappable={true}
                                        name={name}
                                    />
                                    <p className="text-[10px] text-muted-foreground text-center mt-1.5">{name}</p>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Create/Join Modals (available from dashboard) */}
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
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-lg font-bold">Join Squad</h3>
                                <button onClick={() => setShowJoin(false)} className="p-2 bg-white/5 rounded-full"><X className="w-4 h-4" /></button>
                            </div>
                            <p className="text-xs text-muted-foreground mb-6">Ask the squad admin for their 6-character invite code.</p>
                            <div className="flex gap-2 justify-center mb-6">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <input
                                        key={i}
                                        id={`otp-dash-${i}`}
                                        type="text"
                                        maxLength={1}
                                        value={joinCode[i] || ''}
                                        onChange={(e) => {
                                            const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                                            const newCode = joinCode.split('');
                                            newCode[i] = val;
                                            const combined = newCode.join('').substring(0, 6);
                                            setJoinCode(combined);
                                            if (val && i < 5) {
                                                document.getElementById(`otp-dash-${i + 1}`)?.focus();
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Backspace' && !joinCode[i] && i > 0) {
                                                document.getElementById(`otp-dash-${i - 1}`)?.focus();
                                            }
                                        }}
                                        onPaste={(e) => {
                                            e.preventDefault();
                                            const pasted = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 6);
                                            setJoinCode(pasted);
                                            const focusIdx = Math.min(pasted.length, 5);
                                            document.getElementById(`otp-dash-${focusIdx}`)?.focus();
                                        }}
                                        className="w-11 h-14 bg-white/5 border border-white/10 rounded-xl text-center text-xl font-mono font-bold uppercase focus:outline-none focus:border-brand-emerald focus:bg-brand-emerald/5 transition-all"
                                    />
                                ))}
                            </div>
                            <button
                                onClick={() => handleJoinSquad()}
                                disabled={isActionLoading || joinCode.length < 6}
                                className="w-full py-4 bg-brand-emerald text-brand-black font-bold rounded-xl disabled:opacity-50 flex items-center justify-center transition-all"
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

export default function SquadsPage() {
    return (
        <Suspense fallback={<div className="flex flex-col min-h-screen bg-brand-black text-white items-center justify-center"><div className="w-8 h-8 border-2 border-brand-emerald border-t-transparent rounded-full animate-spin" /></div>}>
            <SquadsContent />
        </Suspense>
    );
}

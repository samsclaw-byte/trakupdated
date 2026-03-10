import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, Sparkles, Calendar, ChevronRight } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import NutritionistReportModal from "./NutritionistReportModal";

export interface NutritionistReport {
    id: string;
    user_id: string;
    week_start_date: string;
    week_end_date: string;
    macro_summary: any;
    micro_summary: any;
    generated_advice: string;
    created_at: string;
}

export default function NutritionReports() {
    const [reports, setReports] = useState<NutritionistReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState<NutritionistReport | null>(null);
    const supabaseRef = useRef(createClient());

    useEffect(() => {
        const fetchReports = async () => {
            const supabase = supabaseRef.current;
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from("nutritionist_reports")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (!error && data) {
                setReports(data as NutritionistReport[]);
            }
            setIsLoading(false);
        };

        fetchReports();
    }, []);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <div className="px-6 py-8 space-y-6 pb-24">
            <NutritionistReportModal
                isOpen={!!selectedReport}
                onClose={() => setSelectedReport(null)}
                report={selectedReport}
            />
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">AI Insights</h2>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-brand-emerald mt-1">Weekly Check-ins</p>
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 bg-white/5 animate-pulse rounded-3xl" />
                    ))}
                </div>
            ) : reports.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                    <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                        <Sparkles className="w-8 h-8 text-brand-emerald" />
                    </div>
                    <p className="font-bold">No reports yet</p>
                    <p className="text-sm text-muted-foreground mt-2 max-w-[250px]">
                        Track your nutrition for 7 days to generate your first AI assessment. Check back on Sunday!
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    <AnimatePresence>
                        {reports.map((report, index) => (
                            <motion.button
                                key={report.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                onClick={() => {/* TODO: Open Modal */ }}
                                className="w-full relative overflow-hidden rounded-3xl p-5 border border-white/10 bg-white/5 hover:bg-white/[0.08] transition-all text-left flex items-center justify-between group"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-brand-emerald/5 to-transparent pointer-events-none" />
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="w-12 h-12 rounded-2xl bg-brand-emerald/10 flex items-center justify-center">
                                        <Calendar className="w-5 h-5 text-brand-emerald" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm">Weekly Assessment</h4>
                                        <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
                                            {formatDate(report.week_start_date)} - {formatDate(report.week_end_date)}
                                        </p>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-white transition-colors relative z-10" />
                            </motion.button>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}

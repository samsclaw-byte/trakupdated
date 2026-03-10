import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, TrendingUp, AlertCircle, Apple } from "lucide-react";
import { NutritionistReport, MacroSummary, MicroSummary, MicroDeficiency } from "./NutritionReports";

interface NutritionistReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    report: NutritionistReport | null;
}

export default function NutritionistReportModal({ isOpen, onClose, report }: NutritionistReportModalProps) {
    if (!report) return null;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const macro = (report.macro_summary || {}) as MacroSummary;
    const micro = (report.micro_summary || {}) as MicroSummary;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-4 pb-0 sm:pb-4">
                    <motion.div
                        initial={{ opacity: 0, y: "100%" }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="w-full max-w-lg bg-brand-black border-t border-x sm:border border-white/10 rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 sm:p-8 relative shadow-2xl h-[90vh] sm:h-[85vh] flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6 flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-brand-emerald/10 flex items-center justify-center border border-brand-emerald/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                                    <Sparkles className="w-6 h-6 text-brand-emerald" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black">AI Assessment</h3>
                                    <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mt-0.5">
                                        {formatDate(report.week_start_date)} - {formatDate(report.week_end_date)}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors text-white/50 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto pr-2 pb-8 space-y-8 scrollbar-hide">
                            {/* AI Advice Box */}
                            <div className="relative p-6 bg-brand-emerald/[0.03] border border-brand-emerald/20 rounded-3xl">
                                <div className="absolute top-0 left-6 -translate-y-1/2 bg-brand-black border border-brand-emerald/20 px-3 py-1 rounded-full text-[9px] uppercase tracking-widest font-bold text-brand-emerald flex items-center gap-1.5">
                                    <Sparkles className="w-3 h-3" /> Core Advice
                                </div>
                                <p className="text-sm font-medium leading-relaxed text-white/90 whitespace-pre-wrap mt-2">
                                    {report.generated_advice}
                                </p>
                            </div>

                            {/* Macro Analysis */}
                            <div className="space-y-4">
                                <h4 className="text-xs uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-2">
                                    <Apple className="w-4 h-4 text-orange-400" /> Macro Consistency
                                </h4>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {['protein', 'carbs', 'fat', 'fibre'].map((macroKey) => {
                                        const stat = macro[macroKey as keyof MacroSummary];
                                        if (!stat) return null;
                                        const isLow = stat.avg < stat.target * 0.8;
                                        const isHigh = stat.avg > stat.target * 1.2;
                                        return (
                                            <div key={macroKey} className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col justify-between">
                                                <div>
                                                    <span className="text-[10px] uppercase font-bold text-white/40 mb-1 block">{macroKey}</span>
                                                    <p className="text-xl font-black">
                                                        {Math.round(stat.avg)}g
                                                    </p>
                                                </div>
                                                <div className="mt-3">
                                                    <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-sm ${isLow ? "bg-red-400/20 text-red-400" :
                                                        isHigh ? "bg-amber-400/20 text-amber-400" :
                                                            "bg-brand-emerald/20 text-brand-emerald"
                                                        }`}>
                                                        {isLow ? "Low" : isHigh ? "High" : "Optimal"}
                                                    </span>
                                                    <p className="text-[9px] text-muted-foreground mt-1">Goal: {stat.target}g</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Micro Deficiencies Alert (if any) */}
                            {micro.deficiencies && micro.deficiencies.length > 0 && (
                                <div className="space-y-4">
                                    <h4 className="text-xs uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 text-red-400" /> Micronutrient Deficiencies
                                    </h4>
                                    <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-5 space-y-3">
                                        {micro.deficiencies.map((def: MicroDeficiency, i: number) => (
                                            <div key={i} className="flex items-center justify-between border-b border-red-500/10 pb-3 last:border-0 last:pb-0">
                                                <div>
                                                    <h5 className="font-bold text-red-400 capitalize">{def.nutrient}</h5>
                                                    <p className="text-xs text-red-400/70 mt-0.5">Average: {def.avg}{def.unit}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded-md">
                                                        {Math.round((def.avg / def.target) * 100)}% of Goal
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Strengths / Wins */}
                            {micro.strengths && micro.strengths.length > 0 && (
                                <div className="space-y-4">
                                    <h4 className="text-xs uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-brand-emerald" /> Key Strengths
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {micro.strengths.map((s: string, i: number) => (
                                            <span key={i} className="px-3 py-1.5 rounded-full bg-brand-emerald/10 border border-brand-emerald/20 text-brand-emerald text-xs font-bold capitalize">
                                                {s}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* Sticky Action Button */}
                        <div className="pt-4 border-t border-white/5 flex-shrink-0 bg-brand-black">
                            <button
                                onClick={onClose}
                                className="w-full py-4 rounded-2xl font-bold bg-white text-brand-black active:scale-95 transition-transform"
                            >
                                Got it
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

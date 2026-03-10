"use client";

import { useState, useRef } from "react";
import { X, Camera, Loader2, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface ParsedMeal {
    title: string;
    description: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fibre: number;
    sugar: number;
    micronutrients?: {
        sodium: number;
        potassium: number;
        calcium: number;
        magnesium: number;
        iron: number;
        zinc: number;
        vitamin_c: number;
        vitamin_d: number;
        vitamin_b12: number;
        folate: number;
    } | null;
}

interface SnapToTrakModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLogMeal: (meal: ParsedMeal, imageBase64: string) => Promise<void>;
}

export default function SnapToTrakModal({ isOpen, onClose, onLogMeal }: SnapToTrakModalProps) {
    const [step, setStep] = useState<"upload" | "scanning" | "results">("upload");
    const [imageBase64, setImageBase64] = useState<string | null>(null);
    const [isLogging, setIsLogging] = useState(false);

    // Editable inputs for the results view
    const [editData, setEditData] = useState<ParsedMeal | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = reader.result as string;
            setImageBase64(base64);
            setStep("scanning");
            await parseImage(base64);
        };
        reader.readAsDataURL(file);
    };

    const parseImage = async (base64: string) => {
        try {
            const res = await fetch("/api/parse-meal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    imageBase64: base64,
                    previewOnly: true,
                    // Sending a dummy mealType, the API handles the image
                    mealType: "Breakfast"
                })
            });

            if (!res.ok) throw new Error("Failed to parse image");

            const data: ParsedMeal = await res.json();

            // Normalize defaults in case the AI hallucinates missing fields
            const normalizedData = {
                title: data.title || "Unknown Meal",
                description: data.description || "No description provided.",
                calories: Number(data.calories) || 0,
                protein: Number(data.protein) || 0,
                carbs: Number(data.carbs) || 0,
                fat: Number(data.fat) || 0,
                fibre: Number(data.fibre) || 0,
                sugar: Number(data.sugar) || 0,
                micronutrients: data.micronutrients || null,
            };

            setEditData(normalizedData);
            setStep("results");
        } catch (error) {
            console.error("Scanning Error:", error);
            alert("Sorry, we couldn't analyze that photo. Please try again.");
            setStep("upload");
            setImageBase64(null);
        }
    };

    const handleLogConfirm = async () => {
        if (!editData || !imageBase64) return;
        setIsLogging(true);
        try {
            await onLogMeal(editData, imageBase64);
            // Reset for next time
            setTimeout(() => {
                setStep("upload");
                setImageBase64(null);
                setEditData(null);
                setIsLogging(false);
                onClose();
            }, 500);
        } catch (error) {
            console.error("Error logging meal:", error);
            setIsLogging(false);
            alert("There was an issue saving this meal.");
        }
    };

    const resetFlow = () => {
        setStep("upload");
        setImageBase64(null);
        setEditData(null);
    };

    const closeHandler = () => {
        if (step === "scanning") return; // Prevent closing while API is calling
        resetFlow();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    className="w-full max-w-md bg-brand-black border border-white/10 rounded-[40px] overflow-hidden flex flex-col relative h-[85vh] max-h-[800px] shadow-2xl"
                >
                    {/* Header */}
                    <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10 w-full">
                        <button
                            onClick={closeHandler}
                            disabled={step === "scanning"}
                            className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center transition-colors hover:bg-white/10 disabled:opacity-50"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>
                        <div className="px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                            Trak+ Pro
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto w-full flex flex-col pt-24 pb-32 px-6">
                        {/* Step 1: Upload */}
                        {step === "upload" && (
                            <div className="flex-1 flex flex-col items-center justify-center text-center">
                                <div className="w-20 h-20 rounded-full bg-brand-emerald/10 flex items-center justify-center mb-6">
                                    <Camera className="w-10 h-10 text-brand-emerald" />
                                </div>
                                <h2 className="text-3xl font-bold tracking-tight mb-3">Snap to Trak</h2>
                                <p className="text-muted-foreground text-sm max-w-[280px] mb-10 leading-relaxed">
                                    Snap a photo of your meal. Our Vision AI will automatically estimate calories and macros.
                                </p>

                                <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full py-5 bg-white/5 border border-white/10 rounded-3xl flex flex-col items-center justify-center gap-3 transition-colors hover:bg-white/10 hover:border-brand-emerald/50 group"
                                >
                                    <div className="p-4 rounded-full bg-brand-emerald text-brand-black group-hover:scale-110 transition-transform">
                                        <Camera className="w-6 h-6" />
                                    </div>
                                    <span className="font-bold text-white tracking-wide">Open Camera / Gallery</span>
                                </button>
                            </div>
                        )}

                        {/* Step 2: Scanning */}
                        {step === "scanning" && imageBase64 && (
                            <div className="flex-1 flex flex-col items-center justify-center w-full">
                                <div className="w-full aspect-square rounded-[40px] overflow-hidden relative border-2 border-brand-emerald shadow-[0_0_50px_rgba(16,185,129,0.15)] mb-8">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={imageBase64} alt="Meal" className="w-full h-full object-cover filter brightness-50 contrast-125" />

                                    {/* Overlay Grid */}
                                    <div
                                        className="absolute inset-0 pointer-events-none opacity-20"
                                        style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }}
                                    />

                                    {/* Laser Line */}
                                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                                        <motion.div
                                            className="w-full h-[150px]"
                                            animate={{ y: ["-100%", "300%"] }}
                                            transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatType: "reverse" }}
                                        >
                                            <div className="w-full h-full bg-gradient-to-b from-transparent to-brand-emerald/30"></div>
                                            <div className="w-full h-1 bg-brand-emerald shadow-[0_0_15px_#10B981,0_0_30px_#10B981]"></div>
                                        </motion.div>
                                    </div>

                                    {/* Focus Reticles */}
                                    <div className="absolute top-6 left-6 w-8 h-8 border-t-[3px] border-l-[3px] border-brand-emerald rounded-tl-lg"></div>
                                    <div className="absolute top-6 right-6 w-8 h-8 border-t-[3px] border-r-[3px] border-brand-emerald rounded-tr-lg"></div>
                                    <div className="absolute bottom-6 left-6 w-8 h-8 border-b-[3px] border-l-[3px] border-brand-emerald rounded-bl-lg"></div>
                                    <div className="absolute bottom-6 right-6 w-8 h-8 border-b-[3px] border-r-[3px] border-brand-emerald rounded-br-lg"></div>
                                </div>

                                <div className="flex flex-col items-center">
                                    <Loader2 className="w-8 h-8 text-brand-emerald animate-spin mb-4" />
                                    <h2 className="text-xl font-bold uppercase tracking-widest text-brand-emerald mb-2">Analyzing Macros...</h2>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Results & Editing */}
                        {step === "results" && editData && (
                            <div className="flex-1 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex flex-col items-center mb-6">
                                    <div className="w-16 h-16 rounded-full bg-brand-emerald/20 flex items-center justify-center mb-3">
                                        <Check className="w-8 h-8 text-brand-emerald" strokeWidth={3} />
                                    </div>
                                    <h1 className="text-3xl font-bold tracking-tight mb-2">Scan Complete</h1>
                                    <p className="text-muted-foreground text-sm text-center px-4">Review and adjust any fields before saving.</p>
                                </div>

                                {/* Thumbnail */}
                                {imageBase64 && (
                                    <div className="w-full h-32 rounded-3xl overflow-hidden relative border border-white/10 mb-6 flex-shrink-0">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={imageBase64} alt="Meal" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-brand-black/80 via-transparent to-transparent"></div>
                                    </div>
                                )}

                                {/* Title & Description Edit */}
                                <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-5 mb-6 text-left transition-colors focus-within:border-brand-emerald/50">
                                    <label className="text-[10px] uppercase font-bold tracking-widest text-brand-emerald mb-1 block">Dish Title</label>
                                    <input
                                        type="text"
                                        value={editData.title}
                                        onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                                        className="w-full bg-transparent text-xl font-bold text-white outline-none mb-4 placeholder:text-white/20"
                                        placeholder="E.g., Grilled Chicken Salad"
                                    />

                                    <label className="text-[10px] uppercase font-bold tracking-widest text-brand-emerald mb-1 block">AI Description</label>
                                    <textarea
                                        value={editData.description}
                                        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                                        className="w-full bg-transparent text-sm text-slate-300 outline-none resize-none min-h-[60px] placeholder:text-white/20"
                                        placeholder="What did we find?"
                                        spellCheck={false}
                                    />
                                </div>

                                {/* Macros Edit Grid */}
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 flex flex-col text-center relative transition-colors focus-within:border-brand-emerald/50 focus-within:bg-brand-emerald/5">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Calories</span>
                                        <div className="flex items-baseline justify-center gap-1">
                                            <input
                                                type="number"
                                                value={editData.calories || ''}
                                                onChange={(e) => setEditData({ ...editData, calories: parseInt(e.target.value) || 0 })}
                                                className="text-3xl font-black text-white bg-transparent outline-none w-20 text-center"
                                            />
                                        </div>
                                        <span className="text-[10px] text-muted-foreground font-medium mt-1 uppercase tracking-widest">Kcal</span>
                                    </div>

                                    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 flex flex-col text-center relative transition-colors focus-within:border-blue-400/50 focus-within:bg-blue-400/5">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-1">Protein</span>
                                        <div className="flex items-baseline justify-center gap-1">
                                            <input
                                                type="number"
                                                value={editData.protein || ''}
                                                onChange={(e) => setEditData({ ...editData, protein: parseInt(e.target.value) || 0 })}
                                                className="text-3xl font-black text-white bg-transparent outline-none w-16 text-center"
                                            />
                                        </div>
                                        <span className="text-[10px] text-muted-foreground font-medium mt-1 uppercase tracking-widest">Grams</span>
                                    </div>

                                    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 flex flex-col text-center relative transition-colors focus-within:border-orange-400/50 focus-within:bg-orange-400/5">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-orange-400 mb-1">Carbs</span>
                                        <div className="flex items-baseline justify-center gap-1">
                                            <input
                                                type="number"
                                                value={editData.carbs || ''}
                                                onChange={(e) => setEditData({ ...editData, carbs: parseInt(e.target.value) || 0 })}
                                                className="text-3xl font-black text-white bg-transparent outline-none w-16 text-center"
                                            />
                                        </div>
                                        <span className="text-[10px] text-muted-foreground font-medium mt-1 uppercase tracking-widest">Grams</span>
                                    </div>

                                    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 flex flex-col text-center relative transition-colors focus-within:border-purple-400/50 focus-within:bg-purple-400/5">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400 mb-1">Fat</span>
                                        <div className="flex items-baseline justify-center gap-1">
                                            <input
                                                type="number"
                                                value={editData.fat || ''}
                                                onChange={(e) => setEditData({ ...editData, fat: parseInt(e.target.value) || 0 })}
                                                className="text-3xl font-black text-white bg-transparent outline-none w-16 text-center"
                                            />
                                        </div>
                                        <span className="text-[10px] text-muted-foreground font-medium mt-1 uppercase tracking-widest">Grams</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bottom Sticky Action Area */}
                    {step === "results" && (
                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-brand-black via-brand-black to-transparent pt-12 pb-6">
                            <button
                                onClick={handleLogConfirm}
                                disabled={isLogging}
                                className="w-full py-4 bg-brand-emerald text-brand-black font-black text-lg rounded-2xl transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest disabled:opacity-50"
                            >
                                {isLogging ? <Loader2 className="w-5 h-5 animate-spin" /> : "Log Validated Meal"}
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

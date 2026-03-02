"use client";

import { motion } from "framer-motion";
import { Logo } from "@/components/ui/logo";


export default function LandingPage() {


  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12 overflow-hidden bg-background">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-96 bg-brand-emerald/10 blur-[120px] rounded-full -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center space-y-8 w-full max-w-md text-center"
      >
        {/* Rive Logo Animation */}
        <div className="w-full max-w-[400px] aspect-square flex items-center justify-center -mb-8 overflow-hidden rounded-full">
          <video
            src="/traklogo.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        </div>

        <Logo className="text-6xl md:text-7xl hidden" /> {/* Hidden if Rive replaces it, otherwise we can keep it */}

        <div className="space-y-4">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-2xl md:text-3xl font-medium tracking-tight text-foreground/90 font-sans"
          >
            Simple tracking for busy people <br />
            <span className="italic font-serif text-foreground">who want to win.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 1 }}
            className="text-muted-foreground text-sm md:text-base max-w-[280px] mx-auto"
          >
            A premium experience designed for high-performance living.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="flex flex-col w-full space-y-4 pt-8"
        >
          <button
            onClick={async () => {
              const { createClient } = await import('@/utils/supabase/client');
              const supabase = createClient();
              await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                  redirectTo: `${window.location.origin}/auth/callback`,
                },
              });
            }}
            className="px-8 py-4 bg-transparent border border-border text-foreground/70 font-medium rounded-2xl transition-all hover:bg-white/5 active:scale-[0.98]"
          >
            Sign in with Google
          </button>
        </motion.div>
      </motion.div>

      {/* Footer Quote */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 1 }}
        className="absolute bottom-12 left-0 right-0 text-center"
      >
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/40 font-medium">
          Dubai Modern • High Performance
        </p>
      </motion.div>
    </div>
  );
}

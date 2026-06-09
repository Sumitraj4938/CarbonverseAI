import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Brain, Cpu, Database, ChevronRight } from 'lucide-react';

interface MultiStageSkeletonProps {
  stages?: string[];
  durationMs?: number;
}

const DEFAULT_STAGES = [
  "Analyzing environmental footprints...",
  "Calculating carbon offset indices...",
  "Estimating lifecycle emission models...",
  "Re-weighting local public transit coordinates...",
  "Cross-referencing global GHG databases...",
  "Aggregating secondary carbon twin metadata..."
];

export default function MultiStageSkeleton({ stages = DEFAULT_STAGES, durationMs = 2500 }: MultiStageSkeletonProps) {
  const [currentStage, setCurrentStage] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStage((prev) => (prev + 1) % stages.length);
    }, durationMs);
    return () => clearInterval(timer);
  }, [stages, durationMs]);

  return (
    <div className="w-full bg-[#0B130E]/65 border border-emerald-500/15 rounded-2xl p-6 shadow-xl relative overflow-hidden backdrop-blur-md">
      {/* Light-catching borders & mesh gradients */}
      <div className="absolute inset-0 bg-gradient-to-tr from-emerald-950/10 via-[#0B130E]/20 to-teal-950/15 pointer-events-none" />
      <div className="absolute -top-12 -left-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
        {/* Animated Custom Spinner with glowing outline */}
        <div className="relative w-16 h-16 flex-shrink-0">
          <div className="absolute inset-0 rounded-full border-4 border-emerald-500/10" />
          <motion.div 
            className="absolute inset-0 rounded-full border-4 border-t-emerald-500 border-r-teal-400 border-b-transparent border-l-transparent" 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
          />
          <div className="absolute inset-2 bg-emerald-950/40 rounded-full flex items-center justify-center border border-emerald-500/20">
            <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
          </div>
        </div>

        {/* Informative scientific processes list */}
        <div className="flex-1 w-full text-left space-y-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 rounded text-[9px] font-mono font-bold uppercase tracking-wider">
              SCOPE AUDITING
            </span>
            <div className="h-[1px] flex-1 bg-gradient-to-r from-emerald-500/20 to-transparent" />
          </div>

          <div className="min-h-[50px] flex flex-col justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="flex items-start gap-2.5"
              >
                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <div>
                  <h4 className="text-sm font-semibold text-white tracking-wide">
                    {stages[currentStage]}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                    System thread ID: 0x{((currentStage + 1) * 239).toString(16).toUpperCase()} • Active carbon metrics query
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Stepper indicators */}
          <div className="flex items-center gap-1.5 pt-1">
            {stages.map((_, idx) => (
              <div 
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentStage 
                    ? 'w-6 bg-emerald-500' 
                    : idx < currentStage 
                      ? 'w-2 bg-emerald-800' 
                      : 'w-2 bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

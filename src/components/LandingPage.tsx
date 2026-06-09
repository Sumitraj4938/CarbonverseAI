import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Award, Play, Globe, Shield, Activity, 
  ArrowRight, Users, Flame, ExternalLink, Leaf, FolderOpen, Cloud, User
} from 'lucide-react';
import Logo from './Logo';
import { LeaderboardUser } from '../types';

interface LandingPageProps {
  onStart: () => void;
  leaderboard: LeaderboardUser[];
  onOpenExtraDrawer?: () => void;
  onOpenCloudIdentity?: () => void;
  userEmail?: string | null;
}

export default function LandingPage({ onStart, leaderboard, onOpenExtraDrawer, onOpenCloudIdentity, userEmail }: LandingPageProps) {
  // Dynamic Global Carbon emissions added since loading
  const [globalCO2, setGlobalCO2] = useState(145020.4);

  useEffect(() => {
    const timer = setInterval(() => {
      // average global CO2 emission is about 1,100 tons per second
      setGlobalCO2(prev => prev + 1.15);
    }, 100);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Decorative aurora glow layers matching the design theme */}
      <div className="aurora" />

      {/* Top Header Controls bar */}
      <div className="absolute left-6 right-6 top-6 z-[60] flex justify-between items-center">
        <div>
          <Logo size="sm" showSlogan={true} className="!items-start" />
        </div>

        {onOpenCloudIdentity && (
          <button
            id="landing-cloud-auth-btn"
            onClick={onOpenCloudIdentity}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900/90 hover:bg-slate-950 border border-indigo-500/40 hover:border-indigo-400 rounded-xl text-indigo-300 font-mono text-xs font-bold shadow-2xl shadow-indigo-500/10 cursor-pointer transition-all hover:scale-105 active:scale-95 group"
            title="Access Cloud Authentication Account"
          >
            <Cloud className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
            {userEmail ? (
              <span className="text-emerald-400 max-w-[120px] sm:max-w-none truncate">
                SYNCED: {userEmail.split('@')[0]}
              </span>
            ) : (
              <span>CREATE ACCOUNT / LOGIN</span>
            )}
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${userEmail ? 'bg-emerald-400' : 'bg-indigo-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${userEmail ? 'bg-emerald-500' : 'bg-indigo-500'}`}></span>
            </span>
          </button>
        )}
      </div>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-16 px-4 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12">
        <div className="flex-1 text-left space-y-6">
          {/* Hero text */}

          <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight leading-none text-white">
            Your lifestyle has <br />
            <span className="bg-gradient-to-r from-carbon-primary via-carbon-secondary to-carbon-accent bg-clip-text text-transparent">
              a carbon story.
            </span> <br />
            Let's reveal it.
          </h1>

          <p className="text-slate-400 text-lg md:text-xl max-w-xl font-light">
            AI-powered platform that builds your interactive digital carbon twin, tracks real-time lifestyle emissions, and predicts environmental consequences.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <button
              onClick={onStart}
              className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-carbon-primary to-carbon-secondary hover:brightness-110 text-carbon-dark rounded-xl font-bold font-display text-base transition-all shadow-lg shadow-carbon-primary/35 cursor-pointer group"
            >
              Start Carbon Journey
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <a
              href="#analyze"
              onClick={(e) => {
                e.preventDefault();
                onStart();
              }}
              className="flex items-center justify-center gap-2 px-8 py-4 border border-slate-800 bg-slate-900/45 hover:bg-slate-800 text-slate-200 hover:text-white rounded-xl font-medium transition-all"
            >
              <Play className="w-4 h-4 fill-current text-carbon-secondary" />
              Watch Technical Demo
            </a>
          </div>
        </div>

        {/* Hero Image / Animated Earth Virtual Globe Component */}
        <div className="flex-1 w-full max-w-sm lg:max-w-none flex justify-center items-center relative h-[380px] lg:h-[450px]">
          {/* Ambient Outer rings */}
          <div className="absolute w-[360px] h-[360px] md:w-[420px] md:h-[420px] border border-dashed border-carbon-primary/10 rounded-full animate-[spin_60s_linear_infinite]" />
          <div className="absolute w-[300px] h-[300px] md:w-[340px] md:h-[340px] border border-dashed border-carbon-secondary/20 rounded-full animate-[spin_40s_linear_infinite_reverse]" />

          {/* Glowing Backdrops */}
          <div className="absolute w-[220px] h-[220px] rounded-full bg-gradient-to-r from-carbon-primary to-carbon-accent blur-3xl opacity-20" />

          {/* Virtual CSS Rotating Earth Sphere */}
          <div className="relative w-56 h-56 md:w-64 md:h-64 rounded-full bg-gradient-to-b from-[#0e274a] to-[#040C1A] overflow-hidden border border-white/20 shadow-2xl flex items-center justify-center">
            {/* Soft internal gradient mapping shadow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(0,230,118,0.25)_0%,transparent_60%)] z-10" />
            <div className="absolute inset-0 shadow-[inset_-25px_-25px_50px_rgba(0,0,0,0.9)] z-10" />

            {/* Earth Continents Abstract Mesh */}
            <div className="absolute inset-0 flex items-center justify-center opacity-70 animate-[pulse_5s_infinite]">
              <Globe className="w-36 h-36 md:w-44 md:h-44 text-carbon-primary" />
            </div>

            {/* Orbiting carbon particle */}
            <div className="absolute w-2 h-2 rounded-full bg-amber-400 blur-[1px] animate-[ping_3s_infinite] top-12 left-16 z-20" />
            <div className="absolute w-1.5 h-1.5 rounded-full bg-carbon-secondary blur-[1px] animate-[ping_4s_infinite] bottom-16 right-16 z-20" />
          </div>

          {/* Global Emissions live ticker badge */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 glass-panel rounded-xl px-4 py-2.5 flex items-center gap-3 backdrop-blur-md">
            <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
            <div>
              <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-mono">Global CO₂ Added Today</span>
              <span className="text-sm font-bold font-mono text-white">
                {globalCO2.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} <span className="text-slate-400 text-[10px]">tons</span>
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

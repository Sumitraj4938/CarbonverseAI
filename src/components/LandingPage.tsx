import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Award, Play, Globe, Shield, Activity, 
  ArrowRight, Users, Flame, ExternalLink, Leaf, FolderOpen, Cloud, User
} from 'lucide-react';
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
        {onOpenExtraDrawer && (
          <button
            id="landing-explorer-btn"
            onClick={onOpenExtraDrawer}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900/90 hover:bg-slate-950 border border-emerald-500/40 hover:border-emerald-400 rounded-xl text-emerald-400 font-mono text-xs font-bold shadow-2xl shadow-emerald-500/10 cursor-pointer transition-all hover:scale-105 active:scale-95 group"
            title="Open System Explorer Folders"
          >
            <FolderOpen className="w-4 h-4 text-emerald-400 group-hover:rotate-12 transition-transform" />
            <span className="hidden sm:inline">SYSTEM EXPLORER</span>
            <span className="sm:hidden">EXPLORER</span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </button>
        )}

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
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-carbon-primary font-mono select-none">
            <Sparkles className="w-3.5 h-3.5" />
            <span>HEURISTIC AI CLIMATE PLATFORM FOR HACKATHONS</span>
          </div>

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
              href="#how-it-works"
              className="flex items-center justify-center gap-2 px-8 py-4 border border-slate-800 bg-slate-900/45 hover:bg-slate-800 text-slate-200 hover:text-white rounded-xl font-medium transition-all"
            >
              <Play className="w-4 h-4 fill-current text-carbon-secondary" />
              Watch Technical Demo
            </a>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-800/60 max-w-md">
            <div>
              <span className="text-2xl font-bold font-mono text-white">418.5</span>
              <span className="text-[10px] text-slate-500 block uppercase tracking-wider mt-1">Global CO₂ PPM</span>
            </div>
            <div>
              <span className="text-2xl font-bold font-mono text-white">12.5k</span>
              <span className="text-[10px] text-slate-500 block uppercase tracking-wider mt-1">Quests Resolved</span>
            </div>
            <div>
              <span className="text-2xl font-bold font-mono text-carbon-primary text-glow-green">94%</span>
              <span className="text-[10px] text-slate-500 block uppercase tracking-wider mt-1">Target Reduction</span>
            </div>
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

      {/* Feature Pillar Grid */}
      <section id="how-it-works" className="py-20 bg-slate-950/40 relative border-y border-slate-900">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto space-y-3 mb-16">
            <span className="text-xs text-carbon-secondary font-mono uppercase tracking-widest font-semibold">The Core Architecture</span>
            <h2 className="text-3xl md:text-4xl font-display font-medium text-white">Engineering Sustainable Habits by Design</h2>
            <p className="text-slate-400 text-sm">
              We look past typical surveys to generate an ongoing digital representation of your carbon footprint.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                icon: Leaf,
                title: 'Carbon Twin',
                desc: 'An AI-simulated digital reflection of you that tests eco switches, anticipating trends, values, and carbon budgets.'
              },
              {
                icon: Shield,
                title: 'GHG Audit Rules',
                desc: 'Every calculation adheres directly to the Greenhouse Gas Protocol guidelines, avoiding generic assumptions.'
              },
              {
                icon: Activity,
                title: 'Live Scanner',
                desc: 'Scan receipts or shop lists to extract embedded supply-chain emissions with intelligent offset matching.'
              },
              {
                icon: Users,
                title: 'Gamified Leagues',
                desc: 'Collaborate with friends, rank across cities, and unlock levels of sustainability progression from Seed to Earth Hero.'
              }
            ].map((f, idx) => {
              const IconComp = f.icon;
              return (
                <div key={idx} className="glass-panel p-6 rounded-2xl text-left hover:border-carbon-primary/30 transition-all hover:translate-y-[-4px]">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                    <IconComp className="w-5 h-5 text-carbon-primary" />
                  </div>
                  <h4 className="text-lg font-medium text-white mb-2 font-display">{f.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-light">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Leaderboards and Social Competition Preview */}
      <section className="py-20 max-w-7xl mx-auto px-4 text-center">
        <div className="max-w-3xl mx-auto space-y-3 mb-12">
          <span className="text-xs text-carbon-accent font-mono uppercase tracking-widest font-semibold">Active Competition</span>
          <h2 className="text-3xl md:text-4xl font-semibold text-white font-display">Sustainability Leaderboard</h2>
          <p className="text-slate-400 text-sm">
            Compete to secure the lowest carbon intensity. Complete daily quests to earn badges and XP.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
          {/* Top Rankers List */}
          <div className="lg:col-span-2 glass-panel rounded-2xl overflow-hidden p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 font-display">
              <Award className="w-5 h-5 text-yellow-400" />
              Global Elite Pods
            </h3>
            <div className="divide-y divide-slate-900">
              {leaderboard.map((user, idx) => (
                <div key={idx} className={`flex items-center justify-between py-3.5 transition-all ${user.isCurrentUser ? 'bg-carbon-primary/5 px-3 rounded-lg border-x border-carbon-primary' : ''}`}>
                  <div className="flex items-center gap-4">
                    <span className={`w-6 text-center font-mono font-bold text-sm ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-amber-600' : 'text-slate-500'}`}>
                      #{user.rank}
                    </span>
                    <div>
                      <span className="font-semibold text-white block text-sm">{user.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono tracking-wider bg-slate-900 border border-slate-800 rounded px-2 py-0.5 mt-0.5 inline-block">
                        LEVEL: {user.level}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-8 text-right">
                    <div>
                      <span className="text-[11px] text-slate-500 block">Carbon Intensity</span>
                      <span className="text-sm font-bold font-mono text-white">{user.score}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block font-mono">Emissions</span>
                      <span className="text-sm font-bold font-mono text-carbon-secondary">{user.emissions} tons/yr</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gamification Level progressions */}
          <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2 font-display">
                <Flame className="w-5 h-5 text-orange-500" />
                Carbon Badges & Quests
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                As your carbon footprint shrinks, your Digital Twin grows from a tender Seed into a mighty Earth Hero, granting badges.
              </p>

              <div className="space-y-3 pt-2">
                {[
                  { title: 'Sapling', lvl: 'Level 2', desc: 'Lower emissions than standard district', color: 'from-green-500 to-teal-500', active: true },
                  { title: 'Tree', lvl: 'Level 3', desc: 'Achieve net-carbon parity threshold', color: 'from-teal-400 to-carbon-primary', active: true },
                  { title: 'Forest Guardian', lvl: 'Level 4', desc: 'Maintain carbon-negative routines', color: 'from-carbon-primary to-emerald-600', active: false },
                  { title: 'Earth Hero', lvl: 'Level 5', desc: 'Purity standard of active GHG protocols', color: 'from-[#7C4DFF] to-blue-500', active: false }
                ].map((l, id) => (
                  <div key={id} className={`flex items-center gap-3 p-2.5 rounded-xl border ${l.active ? 'border-carbon-border bg-white/5' : 'border-slate-900 opacity-50 bg-slate-950/20'}`}>
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${l.color} flex items-center justify-center text-xs font-bold text-carbon-dark shadow-inner`}>
                      L{id+2}
                    </div>
                    <div>
                      <span className="font-semibold text-sm text-white block leading-tight">{l.title} <span className="text-[9px] text-slate-500 font-mono">({l.lvl})</span></span>
                      <span className="text-[10px] text-slate-400 block leading-tight">{l.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={onStart}
              className="mt-6 w-full py-3 bg-gradient-to-r from-carbon-accent to-blue-600 rounded-xl hover:brightness-110 font-bold text-xs font-sans tracking-wide uppercase shadow-lg shadow-purple-500/15 cursor-pointer text-center"
            >
              Analyze Your Footprint Now
            </button>
          </div>
        </div>
      </section>

      {/* Sustainable product banner */}
      <section id="marketplace-banner" className="bg-slate-950/80 border-t border-slate-900 py-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-left space-y-1.5">
            <span className="text-[10px] text-slate-500 font-mono tracking-widest block">INTEGRATED COMMERCE</span>
            <h3 className="text-xl md:text-2xl font-bold font-display text-white">Join the Green Marketplace & Explore Carbon Offsets</h3>
            <p className="text-slate-400 text-xs">Access carbon-neutral alternatives and verified offset projects globally.</p>
          </div>
          <button
            onClick={onStart}
            className="px-6 py-3 border border-carbon-primary/30 hover:border-carbon-primary text-carbon-primary text-xs font-bold tracking-wider uppercase rounded-xl transition-all hover:bg-carbon-primary/5 select-none"
          >
            Access Marketplace
          </button>
        </div>
      </section>
    </div>
  );
}

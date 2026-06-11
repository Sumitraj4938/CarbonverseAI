import React, { useState } from 'react';
import { 
  Sparkles, Leaf, Activity, Star, Eye, HelpCircle, ArrowUpRight
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { EmissionBreakdown } from '../types';
import DailyCarbonGoal from './DailyCarbonGoal';

import { Session } from '@supabase/supabase-js';

interface TwinSectionProps {
  userBreakdown?: EmissionBreakdown;
  onSessionChange: (session: Session | null) => void;
  supabaseUserId: string | null;
  onSyncRequest: () => void;
  syncing: boolean;
}

export default function TwinSection({ 
  userBreakdown,
  onSessionChange,
  supabaseUserId,
  onSyncRequest,
  syncing
}: TwinSectionProps) {
  // Configured mitigations in simulator
  const [switches, setSwitches] = useState({
    activeTransit: false, // saves ~150kg/month
    offsetElectricity: false, // saves ~120kg/month
    plantBasedEveryday: false, // saves ~140kg/month
    dryLineLaundry: false, // saves ~40kg/month
    zeroShoppingWaste: false // saves ~60kg/month
  });

  const baseAnnual = userBreakdown ? userBreakdown.total : 4800; // default kg CO2

  // Carbon twin avatar visual status based on score
  const score = userBreakdown ? userBreakdown.carbonScore : 55;
  const getAvatarMood = () => {
    if (score > 85) return { mood: 'Atmospheric Guardian', glow: 'shadow-carbon-primary/40 border-carbon-primary', icon: '🌳', desc: 'Your Digital Twin is breathing zero carbon air. Ambient levels perfectly optimized.' };
    if (score > 70) return { mood: 'Resilient Sapling', glow: 'shadow-carbon-secondary/35 border-carbon-secondary', icon: '🌿', desc: 'Highly efficient Commuter and balanced diet profiles active.' };
    if (score > 55) return { mood: 'Deciduous Seedling', glow: 'shadow-blue-500/25 border-blue-500', icon: '🌱', desc: 'Balanced lifestyle but with potential electricity grid & flight mitigation room.' };
    return { mood: 'Carbon Scorched', glow: 'shadow-red-500/20 border-red-500/40', icon: '🔥', desc: 'Heavy conventional transit and carbon intense shopping configurations detected.' };
  };

  const currentAvatar = getAvatarMood();

  // Aggregate monthly savings
  const calculateSavings = () => {
    let monthlyS = 0;
    if (switches.activeTransit) monthlyS += 140;
    if (switches.offsetElectricity) monthlyS += 110;
    if (switches.plantBasedEveryday) monthlyS += 130;
    if (switches.dryLineLaundry) monthlyS += 35;
    if (switches.zeroShoppingWaste) monthlyS += 55;
    return monthlyS;
  };

  const monthlySavings = calculateSavings();
  const yearlySavings = monthlySavings * 12;

  // Build predictions graph dataset
  const generateChartData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let currentCumulativeBase = 0;
    let currentCumulativeEco = 0;

    const baseMonthlyAverage = baseAnnual / 12;
    const ecoMonthlyAverage = Math.max(80, baseMonthlyAverage - monthlySavings);

    return months.map(m => {
      currentCumulativeBase += baseMonthlyAverage;
      currentCumulativeEco += ecoMonthlyAverage;

      return {
        name: m,
        'Conventional Path (kg)': Math.round(currentCumulativeBase),
        'Your Eco Forecast (kg)': Math.round(currentCumulativeEco),
        monthlySaving: Math.round(baseMonthlyAverage - ecoMonthlyAverage)
      };
    });
  };

  const chartData = generateChartData();

  return (
    <div id="carbon-twin-section" className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Carbon twin interactive metadata visualization card */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col items-center text-center relative overflow-hidden">
        {/* Animated background waves */}
        <div className="absolute top-0 left-0 w-32 h-32 rounded-full blur-3xl opacity-10 bg-carbon-primary animate-[spin_10s_linear_infinite]" />
        
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#00BFA5]/20 text-[#00BFA5] rounded-full text-[10px] font-mono font-semibold tracking-wider uppercase mb-4">
          <Activity className="w-3.5 h-3.5 animate-pulse" />
          Twin Connected & Synced
        </div>

        {/* Dynamic Holographic Avatar element from Theme */}
        <div className="avatar-container w-full h-44 flex items-center justify-center relative mt-2 mb-2">
          <div className="avatar-glow" />
          <svg viewBox="0 0 200 200" className="w-40 h-40 relative z-10 filter drop-shadow-[0_0_20px_rgba(0,230,118,0.2)]">
            <defs>
              <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#00E676', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#7C4DFF', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <circle cx="100" cy="70" r="35" fill="url(#g1)" opacity="0.9" />
            <path d="M100 115 C140 115 165 140 165 180 L35 180 C35 140 60 115 100 115" fill="url(#g1)" opacity="0.6" />
            <circle cx="100" cy="100" r="80" stroke="rgba(255,255,255,0.1)" fill="none" strokeWidth="1" strokeDasharray="4 4" />
            {/* Animated emoji overlaid inside the holographic center */}
            <text x="82" y="82" fontSize="36" className="select-none animate-[bounce_4s_infinite_ease-in-out]">{currentAvatar.icon}</text>
          </svg>
        </div>

        <h3 className="text-xl font-display font-medium text-white tracking-tight leading-none mt-2">{currentAvatar.mood}</h3>
        
        {/* Dynamic score circular progress gauge matching the mockups */}
        <div className="score-gauge w-36 h-36 mt-4 relative flex items-center justify-center scale-90">
          <div className="score-progress" style={{ borderTopColor: '#00E676', borderRightColor: '#00E676', transform: `rotate(${Math.round(45 + (score / 100) * 270)}deg)` }} />
          <div className="score-circle bg-[#0B1020]/80 backdrop-blur-md flex flex-col items-center justify-center border border-white/5 shadow-2xl">
            <span className="text-3xl font-bold font-mono text-white text-glow-green">{score}</span>
            <span className="text-[9px] uppercase tracking-widest text-slate-500 font-semibold font-mono">Carbon score</span>
          </div>
        </div>

        <p className="text-slate-400 text-xs leading-relaxed max-w-xs mt-2 flex-1">
          {currentAvatar.desc}
        </p>

        {/* Simulated Environmental stats panel in bottom */}
        {userBreakdown && (
          <div className="w-full grid grid-cols-3 gap-2 border-t border-slate-900 pt-4 mt-6">
            <div>
              <span className="text-[10px] text-slate-500 block">Baseline tons</span>
              <span className="text-sm font-bold font-mono text-white">{(baseAnnual / 1000).toFixed(1)}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Eco Limit</span>
              <span className="text-sm font-bold font-mono text-carbon-primary">2.0</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Commuted</span>
              <span className="text-xs font-bold font-mono text-carbon-secondary truncate block">#{Math.round(score * 1.5)}</span>
            </div>
          </div>
        )}

        {/* Daily Carbon Goal Tracker Component */}
        <DailyCarbonGoal baseAnnual={baseAnnual} monthlySavings={monthlySavings} />
      </div>

      {/* Habits simulator middle panel */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
        <div>
          <h4 className="text-lg font-display font-medium text-white mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-carbon-secondary" />
            Habit Transition Simulator
          </h4>
          <p className="text-slate-400 text-xs mb-6">Activate or toggle prospective eco-switches to run predictions on future timelines.</p>

          <div className="space-y-3.5">
            {[
              { id: 'activeTransit', label: 'Use public transit & cycle', impact: '140kg CO₂ / mo saved', desc: 'Swap 50% weekly gasoline travel.' },
              { id: 'offsetElectricity', label: 'Toggle 100% green power mix', impact: '110kg CO₂ / mo saved', desc: 'Sign up to a verified community tariff.' },
              { id: 'plantBasedEveryday', label: 'Opt for meatless ingredients', impact: '130kg CO₂ / mo saved', desc: 'Shift red meat out of routine snacks.' },
              { id: 'dryLineLaundry', label: 'Dry dry linen over rack line', impact: '35kg CO₂ / mo saved', desc: 'Cut heavy heat dry washer cycles.' },
              { id: 'zeroShoppingWaste', label: 'Repurpose electronics spending', impact: '55kg CO₂ / mo saved', desc: 'Buy refurb, minimize rapid replacement.' }
            ].map((sw) => (
              <label 
                key={sw.id} 
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                  switches[sw.id as keyof typeof switches] 
                    ? 'bg-carbon-primary/5 border-carbon-primary/30' 
                    : 'bg-slate-900/30 border-slate-900/80 hover:border-slate-800'
                }`}
              >
                <input 
                  type="checkbox"
                  checked={switches[sw.id as keyof typeof switches]}
                  onChange={() => setSwitches({
                    ...switches,
                    [sw.id]: !switches[sw.id as keyof typeof switches]
                  })}
                  className="mt-1 w-4 h-4 rounded border-slate-800 text-carbon-primary accent-carbon-primary focus:ring-0"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-xs text-white block">{sw.label}</span>
                    <span className="text-[9px] font-mono text-carbon-primary block whitespace-nowrap">{sw.impact}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">{sw.desc}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Live Savings Readouts */}
        <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-900 flex justify-between items-center text-xs mt-4">
          <div>
            <span className="text-slate-400 block text-[9px] uppercase font-mono">Combined Annual Offsets</span>
            <span className="text-base font-bold font-mono text-carbon-primary text-glow-green">
              {yearlySavings.toLocaleString()} <span className="text-[10px] font-sans text-slate-400 font-normal">kg CO₂</span>
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[9px] uppercase font-mono">Simulated Cash Savings</span>
            <span className="text-base font-bold font-mono text-white text-right block">
              ${Math.round(yearlySavings * 0.45)} <span className="text-[10px] font-sans text-slate-400 font-normal">/yr</span>
            </span>
          </div>
        </div>
      </div>

      {/* Area chart future predictions right - expanded full layout */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between min-h-[420px]">
        <div>
          <h4 className="text-lg font-display font-medium text-white mb-1 flex items-center justify-between">
            <span>Projection Curve (12mo)</span>
            <span className="text-[10px] font-mono bg-[#7C4DFF]/10 text-[#7C4DFF] px-2 py-0.5 border border-[#7C4DFF]/20 rounded uppercase">PREDICTIVE</span>
          </h4>
          <p className="text-slate-400 text-xs mb-6">Compare business-as-usual conventional trends against optimized eco transitions.</p>
        </div>

        <div className="flex-1 w-full min-h-[220px] max-h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorBase" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C4DFF" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#7C4DFF" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorEco" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00E676" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00E676" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.05} />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                itemStyle={{ fontSize: 12 }}
              />
              <Area type="monotone" dataKey="Conventional Path (kg)" stroke="#7C4DFF" fillOpacity={1} fill="url(#colorBase)" strokeWidth={2} />
              <Area type="monotone" dataKey="Your Eco Forecast (kg)" stroke="#00E676" fillOpacity={1} fill="url(#colorEco)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="pt-4 border-t border-slate-900 mt-4">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Cumulative Dec-31 Metric:</span>
            <span className="text-[#00E676]">-{Math.round((yearlySavings / baseAnnual) * 100)}% emissions</span>
          </div>
        </div>
      </div>
    </div>
  );
}

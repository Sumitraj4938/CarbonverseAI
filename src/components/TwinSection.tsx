import React, { useState } from 'react';
import { 
  Sparkles, Leaf, Activity, Star, Eye, HelpCircle, ArrowUpRight
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { EmissionBreakdown } from '../types';

interface TwinSectionProps {
  userBreakdown?: EmissionBreakdown;
}

export default function TwinSection({ userBreakdown }: TwinSectionProps) {
  // Configured mitigations in simulator
  const [switches, setSwitches] = useState({
    activeTransit: false, // saves ~150kg/month
    offsetElectricity: false, // saves ~120kg/month
    plantBasedEveryday: false, // saves ~140kg/month
    dryLineLaundry: false, // saves ~40kg/month
    zeroShoppingWaste: false // saves ~60kg/month
  });

  // Daily goal tracker custom interactive actions
  const [dailyActions, setDailyActions] = useState({
    tookTrain: false,       // saves 4.5 kg CO2
    veggieDiet: false,      // saves 3.0 kg CO2
    shortShower: false,     // saves 1.2 kg CO2
    unpluggedElectronics: false // saves 0.8 kg CO2
  });

  const [dailyTarget, setDailyTarget] = useState(12.0); // Daily emission target in kg CO2

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

  const baseDaily = Math.round((baseAnnual / 365) * 10) / 10;
  const simulatedDailySavings = Math.round((monthlySavings / 30) * 10) / 10;
  
  // Extra interactive daily actions
  let extraDailySavings = 0;
  if (dailyActions.tookTrain) extraDailySavings += 4.5;
  if (dailyActions.veggieDiet) extraDailySavings += 3.0;
  if (dailyActions.shortShower) extraDailySavings += 1.2;
  if (dailyActions.unpluggedElectronics) extraDailySavings += 0.8;

  const finalDailyFootprint = Math.max(1.0, Math.round((baseDaily - simulatedDailySavings - extraDailySavings) * 10) / 10);
  const goalProgressPercentage = Math.min(100, Math.round((finalDailyFootprint / dailyTarget) * 100));
  const isWithinBudget = finalDailyFootprint <= dailyTarget;

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
        <div className="w-full border-t border-slate-900 pt-4 mt-4 text-left">
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-xs font-semibold text-white tracking-wide uppercase flex items-center gap-1.5">
              <Leaf className="w-3.5 h-3.5 text-carbon-primary" />
              Daily Carbon Goal
            </span>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setDailyTarget(prev => Math.max(4, prev - 1))}
                className="w-5 h-5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-xs text-slate-400 cursor-pointer transition-colors"
                title="Decrease Goal"
              >
                -
              </button>
              <span className="text-[10px] font-mono text-slate-300 font-bold px-1">{dailyTarget.toFixed(0)} kg</span>
              <button 
                onClick={() => setDailyTarget(prev => Math.min(30, prev + 1))}
                className="w-5 h-5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-xs text-slate-400 cursor-pointer transition-colors"
                title="Increase Goal"
              >
                +
              </button>
            </div>
          </div>

          <div className="bg-slate-950/40 border border-slate-900/60 rounded-xl p-3 space-y-3">
            <div>
              <div className="flex justify-between items-center text-[11px] mb-1">
                <span className="text-slate-400">Emission: <span className="font-bold text-white font-mono">{finalDailyFootprint} kg</span></span>
                <span className={`font-semibold text-[10px] px-1.5 py-0.5 rounded ${isWithinBudget ? 'bg-carbon-primary/10 text-carbon-primary' : 'bg-red-500/10 text-red-400'}`}>
                  {isWithinBudget ? 'Under Target Budget' : 'Target Exceeded'}
                </span>
              </div>
              <div className="w-full bg-slate-900/80 rounded-full h-2 border border-slate-800 relative overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    isWithinBudget ? 'bg-gradient-to-r from-carbon-primary to-emerald-400' : 'bg-gradient-to-r from-red-500 to-red-400'
                  }`}
                  style={{ width: `${goalProgressPercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-1">
                <span>Progress: {goalProgressPercentage}%</span>
                <span>Goal Target Limit: {dailyTarget} kg</span>
              </div>
            </div>

            {/* Micro Toggles for Daily Activities */}
            <div className="space-y-1.5 pt-1.5 border-t border-slate-900/40">
              <span className="text-[9px] text-slate-500 uppercase font-mono tracking-wider block">Logged Actions Today:</span>
              
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'tookTrain', label: 'Commute Rail', value: '4.5' },
                  { id: 'veggieDiet', label: 'Vegan Lunch', value: '3.0' },
                  { id: 'shortShower', label: '5-min Shower', value: '1.2' },
                  { id: 'unpluggedElectronics', label: 'Off Standby', value: '0.8' }
                ].map((act) => (
                  <button
                    key={act.id}
                    onClick={() => setDailyActions(prev => ({
                      ...prev,
                      [act.id]: !(prev as any)[act.id]
                    }))}
                    className={`px-2 py-1.5 rounded-lg border text-[10px] transition-all text-left flex justify-between items-center ${
                      (dailyActions as any)[act.id]
                        ? 'border-carbon-primary/30 bg-carbon-primary/10 text-carbon-primary font-bold'
                        : 'border-slate-800 bg-slate-900/30 text-slate-400 hover:text-slate-300 hover:bg-slate-900/60'
                    }`}
                  >
                    <span className="truncate">{act.label}</span>
                    <span className="text-[8px] font-mono opacity-80">-{act.value} kg</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
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
                  (switches as any)[sw.id] 
                    ? 'bg-carbon-primary/5 border-carbon-primary/30' 
                    : 'bg-slate-900/30 border-slate-900/80 hover:border-slate-800'
                }`}
              >
                <input 
                  type="checkbox"
                  checked={(switches as any)[sw.id]}
                  onChange={() => setSwitches({
                    ...switches,
                    [sw.id]: !(switches as any)[sw.id]
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

      {/* Area chart future predictions right */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
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

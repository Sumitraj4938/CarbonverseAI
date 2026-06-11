import React, { useState } from 'react';
import { Leaf, Calendar, History, TrendingDown, Target, HelpCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';

interface DailyCarbonGoalProps {
  baseAnnual: number;
  monthlySavings: number;
}

export default function DailyCarbonGoal({ baseAnnual, monthlySavings }: DailyCarbonGoalProps) {
  const [activeTab, setActiveTab] = useState<'today' | 'history'>('today');

  // Daily goal tracker custom interactive actions
  const [dailyActions, setDailyActions] = useState({
    tookTrain: false,       // saves 4.5 kg CO2
    veggieDiet: false,      // saves 3.0 kg CO2
    shortShower: false,     // saves 1.2 kg CO2
    unpluggedElectronics: false // saves 0.8 kg CO2
  });

  const [dailyTarget, setDailyTarget] = useState(12.0); // Daily emission target in kg CO2

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

  // Generate historical data where today's value adapts in REALTIME to what is being checked
  const generate7DayHistory = () => {
    const days = ['Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Today'];
    const offsets = [-1.4, 2.5, -3.1, -0.8, 1.2, -1.8, 0]; // static offsets relative to base
    
    return days.map((day, idx) => {
      let emissions = 0;
      if (day === 'Today') {
        emissions = finalDailyFootprint;
      } else {
        // approximate historical points
        emissions = Math.max(3.0, Math.round((baseDaily - simulatedDailySavings + offsets[idx]) * 10) / 10);
      }
      return {
        day,
        'Emissions (kg)': emissions,
        'Emissions Limit': dailyTarget,
        status: emissions <= dailyTarget ? 'Under Budget' : 'Exceeded'
      };
    });
  };

  const historyData = generate7DayHistory();
  const successfulDaysCount = historyData.filter(d => d['Emissions (kg)'] <= dailyTarget).length;

  return (
    <div id="daily-carbon-goal-tracker" className="w-full border-t border-slate-900 pt-4 mt-4 text-left">
      <div className="flex justify-between items-center mb-3" id="daily-goal-header">
        <span className="text-xs font-semibold text-white tracking-wide uppercase flex items-center gap-1.5" id="daily-goal-title">
          <Leaf className="w-3.5 h-3.5 text-carbon-primary animate-pulse" id="daily-goal-leaf-icon" />
          Daily Carbon Limits
        </span>

        {/* Tab Selector */}
        <div className="flex p-0.5 bg-slate-900/80 rounded-lg border border-slate-800" id="goal-tab-selector">
          <button
            id="tab-btn-today"
            onClick={() => setActiveTab('today')}
            className={`px-2 py-0.7 text-[9px] font-mono rounded font-medium transition-colors cursor-pointer ${
              activeTab === 'today' 
                ? 'bg-carbon-primary/10 text-carbon-primary' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Today
          </button>
          <button
            id="tab-btn-history"
            onClick={() => setActiveTab('history')}
            className={`px-2 py-0.7 text-[9px] font-mono rounded font-medium transition-colors cursor-pointer ${
              activeTab === 'history' 
                ? 'bg-carbon-primary/10 text-carbon-primary' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            7D Trend
          </button>
        </div>
      </div>

      <div className="bg-slate-950/40 border border-slate-900/60 rounded-xl p-3.5 space-y-3.5" id="daily-goal-progress-card">
        {/* Common limit target header slider */}
        <div className="flex justify-between items-center text-[11px]" id="target-slider-header">
          <span className="text-slate-400 flex items-center gap-1 font-mono text-[10px]">
            <Target className="w-3 h-3 text-carbon-primary" />
            TARGET UPPER LIMIT
          </span>
          <div className="flex items-center gap-1" id="daily-goal-controls">
            <button 
              id="btn-decrease-daily-target"
              aria-label="Decrease Target"
              onClick={() => setDailyTarget(prev => Math.max(4, prev - 1))}
              className="w-5 h-5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-xs text-slate-400 cursor-pointer transition-colors"
              title="Decrease Goal"
            >
              -
            </button>
            <span className="text-[10px] font-mono text-slate-200 font-bold px-1.5" id="daily-target-display">{dailyTarget.toFixed(0)} kg CO₂</span>
            <button 
              id="btn-increase-daily-target"
              aria-label="Increase Target"
              onClick={() => setDailyTarget(prev => Math.min(30, prev + 1))}
              className="w-5 h-5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-xs text-slate-400 cursor-pointer transition-colors"
              title="Increase Goal"
            >
              +
            </button>
          </div>
        </div>

        {activeTab === 'today' ? (
          <div id="today-logging-view" className="space-y-3.5">
            <div>
              <div className="flex justify-between items-center text-[11px] mb-1.5" id="daily-goal-status-row">
                <span className="text-slate-400" id="daily-emission-text">Today's Footprint: <span className="font-bold text-white font-mono">{finalDailyFootprint} kg</span></span>
                <span 
                  id="daily-budget-badge"
                  className={`font-semibold text-[10px] px-1.5 py-0.5 rounded ${isWithinBudget ? 'bg-carbon-primary/10 text-carbon-primary' : 'bg-red-500/10 text-red-400'}`}
                >
                  {isWithinBudget ? 'Within Budget' : 'Limit Exceeded'}
                </span>
              </div>
              <div className="w-full bg-slate-900/80 rounded-full h-2 border border-slate-800/80 relative overflow-hidden" id="daily-progress-bar-container">
                <div 
                  id="daily-progress-bar-fill"
                  className={`h-full rounded-full transition-all duration-500 ${
                    isWithinBudget ? 'bg-gradient-to-r from-carbon-primary to-emerald-400' : 'bg-gradient-to-r from-red-500 to-red-400'
                  }`}
                  style={{ width: `${goalProgressPercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-1" id="daily-stats-footer">
                <span id="daily-percentage-label">Budget Occupied: {goalProgressPercentage}%</span>
                <span id="daily-target-limit-label">Global Target: {dailyTarget} kg</span>
              </div>
            </div>

            {/* Micro Toggles for Daily Activities */}
            <div className="space-y-1.5 pt-2.5 border-t border-slate-900/40" id="daily-actions-section">
              <span className="text-[9px] text-slate-500 uppercase font-mono tracking-wider block" id="daily-actions-title">Micro Actions Logged Today:</span>
              
              <div className="grid grid-cols-2 gap-1.5" id="daily-actions-grid">
                {[
                  { id: 'tookTrain', label: 'Commute Rail', value: '4.5' },
                  { id: 'veggieDiet', label: 'Vegan Lunch', value: '3.0' },
                  { id: 'shortShower', label: '5-min Shower', value: '1.2' },
                  { id: 'unpluggedElectronics', label: 'Off Standby', value: '0.8' }
                ].map((act) => (
                  <button
                    key={act.id}
                    id={`btn-daily-action-${act.id}`}
                    onClick={() => setDailyActions(prev => ({
                      ...prev,
                      [act.id]: !(prev as any)[act.id]
                    }))}
                    className={`px-2 py-1.5 rounded-lg border text-[10px] transition-all text-left flex justify-between items-center ${
                      (dailyActions as any)[act.id]
                        ? 'border-carbon-primary/30 bg-carbon-primary/10 text-carbon-primary font-bold shadow-sm shadow-carbon-primary/5'
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
        ) : (
          <div id="history-trend-view" className="space-y-3">
            <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono" id="history-trend-stats">
              <span className="flex items-center gap-1">
                <History className="w-3 h-3 text-slate-400" />
                7D Carbon Record
              </span>
              <span className="text-emerald-400 font-bold">
                {successfulDaysCount}/7 Days Successful
              </span>
            </div>

            {/* Recharts history visual component */}
            <div className="h-28 w-full" id="history-chart-wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historyData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="historyColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00E676" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#00E676" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.03} vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 8 }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', padding: '6px' }}
                    labelStyle={{ color: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                    itemStyle={{ fontSize: 9 }}
                  />
                  {/* Reference line showing current daily target limit */}
                  <ReferenceLine y={dailyTarget} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={1} label={{ value: 'Limit', fill: '#ef4444', fontSize: 8, position: 'insideRight' }} />
                  <Area 
                    type="monotone" 
                    dataKey="Emissions (kg)" 
                    stroke="#00E676" 
                    fillOpacity={1} 
                    fill="url(#historyColor)" 
                    strokeWidth={1.5} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-slate-900/40 p-2.5 rounded-lg border border-slate-900 flex items-center gap-2" id="history-insight">
              <TrendingDown className="w-3.5 h-3.5 text-carbon-primary flex-shrink-0" />
              <p className="text-[9px] text-slate-400 leading-normal">
                Your actions logged today (<span className="text-white font-semibold">{finalDailyFootprint} kg</span>) directly scale the final column on the trend above. Continue logger swaps to improve index!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


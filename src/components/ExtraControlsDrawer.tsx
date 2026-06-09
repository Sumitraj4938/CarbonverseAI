import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Cpu, Folder, FolderOpen, ChevronRight, Award, 
  Terminal, Users, Database, Sparkles, Zap, Server,
  ShieldCheck, HelpCircle, Flame, CheckCircle2, ShoppingBag, 
  Trees, Coins, ArrowLeft, RefreshCw, BadgePercent, Trash2, ShieldAlert
} from 'lucide-react';
import SupabaseAuth from './SupabaseAuth';
import { LeaderboardUser } from '../types';

export type FolderID = 'root' | 'architecture' | 'competitions' | 'badges_quests' | 'commerce' | 'cloud_sync';

interface ExtraControlsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  leaderboard: LeaderboardUser[];
  onSessionChange: (session: any) => void;
  supabaseUserId: string | null;
  onSyncRequest: () => void;
  syncing: boolean;
  defaultFolder?: FolderID;
}

export default function ExtraControlsDrawer({
  isOpen,
  onClose,
  leaderboard,
  onSessionChange,
  supabaseUserId,
  onSyncRequest,
  syncing,
  defaultFolder = 'root'
}: ExtraControlsDrawerProps) {
  // Folder navigation state
  const [currentFolder, setCurrentFolder] = useState<FolderID>('root');

  // Sync folder path on open
  useEffect(() => {
    if (isOpen) {
      setCurrentFolder(defaultFolder);
    }
  }, [isOpen, defaultFolder]);
  
  // Dummy dynamic values for interactions
  const [gpWallet, setGpWallet] = useState<number>(350);
  const [purchasedCredits, setPurchasedCredits] = useState<Array<{ id: string; name: string; qty: number }>>([]);
  const [joinedCompetition, setJoinedCompetition] = useState<boolean>(false);

  const handleRedeem = (id: string, name: string, cost: number) => {
    if (gpWallet >= cost) {
      setGpWallet(prev => prev - cost);
      setPurchasedCredits(prev => {
        const exist = prev.find(item => item.id === id);
        if (exist) {
          return prev.map(item => item.id === id ? { ...item, qty: item.qty + 1 } : item);
        }
        return [...prev, { id, name, qty: 1 }];
      });
    } else {
      alert("Insufficient Green Points (GP)! Please complete goals or log actions to acquire more points.");
    }
  };

  // Folders list metadata
  const folders = [
    {
      id: 'architecture' as FolderID,
      name: 'Core_Architecture_Specs',
      description: 'ISO-14064 criteria & calculation coefficients',
      itemCount: 4,
      color: 'text-amber-400'
    },
    {
      id: 'competitions' as FolderID,
      name: 'Active_Competitions_League',
      description: 'Sustainable leaderboard & cohort challenges',
      itemCount: leaderboard.length,
      color: 'text-emerald-400'
    },
    {
      id: 'badges_quests' as FolderID,
      name: 'Carbon_Badges_Quests',
      description: 'Eco certifications, level ranks & active quests',
      itemCount: 6,
      color: 'text-sky-400'
    },
    {
      id: 'commerce' as FolderID,
      name: 'Integrated_Eco_Commerce',
      description: 'Redeem carbon credits, trees & verified offsets',
      itemCount: 3,
      color: 'text-purple-400'
    },
    {
      id: 'cloud_sync' as FolderID,
      name: 'Cloud_Database_Sync',
      description: 'Secure Supabase Auth & persistent state sync',
      itemCount: 1,
      color: 'text-pink-400'
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            id="extra-drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 z-50 backdrop-blur-sm cursor-pointer"
          />

          {/* Sizable Slideout Drawer Panel */}
          <motion.div
            id="extra-drawer-panel"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed top-0 left-0 h-full w-full max-w-[480px] bg-slate-950 border-r border-slate-900 shadow-2xl z-50 flex flex-col focus:outline-none text-left"
          >
            {/* Header portion */}
            <div className="p-5 border-b border-white/[0.04] bg-slate-950 flex justify-between items-center" id="drawer-header">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-emerald-400/5 flex items-center justify-center border border-emerald-500/25">
                  <Cpu className="w-5 h-5 text-emerald-400 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white tracking-wider uppercase font-mono">Expert System Folders</h3>
                  <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">ECOSYSTEM DIAGNOSTICS LAB</p>
                </div>
              </div>
              
              <button 
                id="btn-close-extra-drawer"
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-slate-900/60 hover:bg-slate-800 border border-slate-800/80 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Close Explorer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Breadcrumb Path Banner */}
            <div className="bg-slate-900/45 border-b border-white/[0.03] px-5 py-2.5 flex items-center justify-between text-[11px] font-mono text-slate-400 flex-shrink-0" id="explorer-breadcrumbs">
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-emerald-500 font-semibold">carbonverse@system:</span>
                <span className="text-slate-500">~</span>
                <ChevronRight className="w-3 h-3 text-slate-600" />
                <button 
                  onClick={() => setCurrentFolder('root')}
                  className={`hover:text-white cursor-pointer ${currentFolder === 'root' ? 'text-white font-bold' : ''}`}
                >
                  root
                </button>
                {currentFolder !== 'root' && (
                  <>
                    <ChevronRight className="w-3 h-3 text-slate-600" />
                    <span className="text-emerald-400 font-bold truncate">
                      {folders.find(f => f.id === currentFolder)?.name}
                    </span>
                  </>
                )}
              </div>
              
              {currentFolder !== 'root' && (
                <button 
                  id="btn-back-to-root"
                  onClick={() => setCurrentFolder('root')}
                  className="flex items-center gap-1 text-slate-400 hover:text-white text-[10px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800 cursor-pointer"
                >
                  <ArrowLeft className="w-3 h-3" />
                  Back
                </button>
              )}
            </div>

            {/* Main Interactive Directories Panel */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar" id="drawer-scroll-body">
              {currentFolder === 'root' ? (
                // Root folders view
                <div id="explorer-root-grid" className="space-y-4">
                  <div className="bg-slate-900/30 p-4 rounded-xl border border-white/[0.03]">
                    <span className="text-[10px] font-mono font-bold text-slate-500 block uppercase tracking-widest mb-1">DIRECTORY TREE</span>
                    <h4 className="text-sm font-semibold text-white mb-1">Ecosystem Catalog Explorer</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Select any subdirectory below to configure database parameters, view competition states, inspect algorithm constants, or purchase verified carbon offsets.
                    </p>
                  </div>

                  <div className="space-y-2.5" id="folders-list">
                    {folders.map((f) => {
                      const isTargetOpen = currentFolder === f.id;
                      return (
                        <button
                          key={f.id}
                          id={`dir-folder-row-${f.id}`}
                          onClick={() => setCurrentFolder(f.id)}
                          className="w-full text-left bg-gradient-to-r from-slate-950 to-slate-900 hover:from-slate-900 hover:to-slate-900/60 p-4 rounded-xl border border-white/[0.04] hover:border-slate-800 transition-all flex items-center justify-between group cursor-pointer"
                        >
                          <div className="flex items-start gap-3.5">
                            <span className="mt-0.5 flex-shrink-0">
                              <Folder className={`w-5.5 h-5.5 ${f.color} group-hover:scale-110 transition-transform`} />
                            </span>
                            <div>
                              <span className="font-mono text-xs font-bold text-white group-hover:text-emerald-400 transition-colors block">
                                {f.name}/
                              </span>
                              <span className="text-[10px] text-slate-400 block mt-0.5 leading-normal">
                                {f.description}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono bg-slate-950 px-2 py-0.5 border border-slate-900 rounded text-slate-500">
                              {f.itemCount} items
                            </span>
                            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* GP points wallet mini display */}
                  <div className="bg-[#050C1C]/40 border border-[#112240] p-4 rounded-xl flex items-center justify-between" id="quick-status-block">
                    <div className="flex items-center gap-2.5">
                      <Coins className="w-4.5 h-4.5 text-amber-400 animate-spin" />
                      <div>
                        <span className="text-[9px] font-mono text-slate-500 uppercase block">My Green Balance:</span>
                        <span className="text-sm font-extrabold text-amber-300 font-mono">{gpWallet} GP</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-slate-500 block font-mono">Offset Holdings:</span>
                      <span className="text-xs font-bold text-teal-400 font-mono">
                        {purchasedCredits.reduce((acc, curr) => acc + curr.qty, 0)} Units Verified
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                // Folder sub-contents views
                <div id="explorer-contents-panel" className="space-y-4">
                  {currentFolder === 'architecture' && (
                    <div id="dir-architecture-spec" className="space-y-4">
                      <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-900">
                        <div className="flex items-center gap-2 mb-2">
                          <Terminal className="w-4 h-4 text-amber-400" />
                          <h4 className="text-xs font-bold font-mono text-white uppercase tracking-wider">Core_Architecture_Specs</h4>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          This carbon accountancy portal uses the global standardized values governed under the greenhouse gas protocol. Below are our environmental algorithms.
                        </p>
                      </div>

                      <div className="space-y-2" id="spec-variables">
                        <div className="p-3 bg-slate-950 border border-white/[0.03] rounded-lg">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[11px] text-white font-mono font-bold">GRID_COEFFICIENT_ELECTRICITY</span>
                            <span className="text-[10px] font-mono text-emerald-400">0.385 kg/kWh</span>
                          </div>
                          <p className="text-[10.5px] text-slate-500">
                            Derived in real-time mapping state utility resource mixes (EPA eGRID framework).
                          </p>
                        </div>

                        <div className="p-3 bg-slate-950 border border-white/[0.03] rounded-lg">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[11px] text-white font-mono font-bold">TRANSPORT_CO2_METRIC_CAR</span>
                            <span className="text-[10px] font-mono text-red-400">0.210 kg/km</span>
                          </div>
                          <p className="text-[10.5px] text-slate-500">
                            Standard internal combustion engine average. Railway travel reduces this dynamically to <strong>0.041 kg/km</strong> (Scope 3 saving).
                          </p>
                        </div>

                        <div className="p-3 bg-slate-950 border border-white/[0.03] rounded-lg">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[11px] text-white font-mono font-bold">AGRICULTURE_BEEF_INTENSIVE</span>
                            <span className="text-[10px] font-mono text-red-400">27.0 kg CO2/kg</span>
                          </div>
                          <p className="text-[10.5px] text-slate-500">
                            Includes land-use changes, enteric fermentation, transport logistics. Vegan substitutes map at <strong>2.1 kg CO2/kg</strong>.
                          </p>
                        </div>

                        <div className="p-3 bg-slate-950 border border-white/[0.03] rounded-lg">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[11px] text-white font-mono font-bold">ISO-14064 Compliance</span>
                            <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5" /> VERIFIED
                            </span>
                          </div>
                          <p className="text-[10.5px] text-slate-500">
                            Audit compliance ledger tracks all historical state operations to prevent carbon double-counting.
                          </p>
                        </div>
                      </div>

                      {/* Port metadata visual */}
                      <div className="p-3 bg-slate-950 border border-amber-500/10 rounded-lg flex items-center justify-between text-[10px] font-mono">
                        <span className="text-slate-500">DEVELOPMENT INTEGRATION ENGINE:</span>
                        <span className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/25 uppercase font-bold text-[9px]">
                          Port 3000 Ingress SSL
                        </span>
                      </div>
                    </div>
                  )}

                  {currentFolder === 'competitions' && (
                    <div id="dir-competitions" className="space-y-4">
                      <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-900 flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-emerald-400" />
                            <h4 className="text-xs font-bold font-mono text-white uppercase tracking-wider">Active_Competitions_League</h4>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            Compete against community pioneers. Verify daily goals on client timeline to upgrade score index.
                          </p>
                        </div>
                        <div className="bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded text-right flex-shrink-0">
                          <span className="text-[8px] text-slate-500 block font-mono">WEEKLY ROUND</span>
                          <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase">6D LOCAL</span>
                        </div>
                      </div>

                      {/* Interactive Button to sign up / participate in active league */}
                      <div className="bg-slate-900 p-3.5 rounded-xl border border-white/[0.03] space-y-2.5">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-300 font-medium">Eco Pioneer League Challenge</span>
                          <span className="text-[9px] font-mono text-slate-500 uppercase">STATUS</span>
                        </div>
                        <button
                          id="btn-join-league"
                          onClick={() => setJoinedCompetition(true)}
                          disabled={joinedCompetition}
                          className={`w-full py-2 rounded-lg text-xs font-semibold font-display tracking-wide transition-all cursor-pointer ${
                            joinedCompetition 
                              ? 'bg-slate-950 border border-emerald-500/25 text-emerald-400 cursor-not-allowed flex items-center justify-center gap-1.5' 
                              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20'
                          }`}
                        >
                          {joinedCompetition ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              COMMITTED TO LEAGUE
                            </>
                          ) : (
                            'Enter Global Energy Challenge (+50 GP)'
                          )}
                        </button>
                      </div>

                      {/* Traditional Competitors List */}
                      <div className="space-y-2" id="leaderboard-competitors">
                        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">SUSTAINABLE LEADERBOARD DIRECTORY:</span>
                        
                        <div className="bg-slate-950/60 p-3 rounded-xl border border-white/[0.02] space-y-2">
                          {leaderboard.map((user, idx) => (
                            <div 
                              key={idx}
                              id={`dir-leader-row-${idx}`}
                              className={`flex justify-between items-center py-2 px-2.5 rounded-lg text-xs ${
                                user.isCurrentUser ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-slate-950/40'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-mono text-[10px] text-slate-400">0{user.rank}</span>
                                <span className="font-medium text-white truncate max-w-[130px]">{user.name}</span>
                                {user.isCurrentUser && (
                                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] font-mono font-bold px-1 py-0.2 rounded">YOU</span>
                                )}
                              </div>
                              <div className="flex gap-4 font-mono text-[11px] text-slate-400">
                                <span>{user.score} pts</span>
                                <span className="text-white font-semibold">{user.emissions} t</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {currentFolder === 'badges_quests' && (
                    <div id="dir-badges-quests" className="space-y-4 text-left">
                      <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-900">
                        <div className="flex items-center gap-2 mb-2">
                          <Award className="w-4 h-4 text-sky-400" />
                          <h4 className="text-xs font-bold font-mono text-white uppercase tracking-wider">Carbon_Badges_Quests</h4>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Inspect your environmental certifications and complete weekly micro quests to generate carbon credits and multiplier rates.
                        </p>
                      </div>

                      {/* Carbon badges cabinet */}
                      <div className="space-y-2" id="badges-cabinet">
                        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">MY CARBON BADGES:</span>
                        
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { name: 'Low Carbon Hero', level: 'Tier 1', status: 'Completed', color: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5' },
                            { name: 'Micro-Transit Pioneer', level: 'Tier 2', status: 'In Progress', color: 'border-sky-500/30 text-sky-400 bg-sky-500/5' },
                            { name: 'Eco Nutritionist', level: 'Tier 3', status: 'Completed', color: 'border-purple-500/30 text-purple-400 bg-purple-500/5' },
                            { name: 'Net-Zero Ambassador', level: 'Alpha', status: 'Locked', color: 'border-slate-800 text-slate-500 bg-slate-950/20' }
                          ].map((b, idx) => (
                            <div key={idx} className={`p-3 border rounded-xl flex flex-col justify-between h-24 text-left ${b.color}`}>
                              <div>
                                <span className="text-[11px] font-bold block leading-snug">{b.name}</span>
                                <span className="text-[8px] opacity-70 uppercase font-mono">{b.level} Limit</span>
                              </div>
                              <span className="text-[9px] font-mono tracking-wider text-right uppercase mt-2 font-bold block">
                                {b.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* System simulated Quests */}
                      <div className="space-y-2" id="quests-list">
                        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">ACTIVE WEEKLY QUESTS:</span>
                        
                        <div className="space-y-2 font-mono text-[11px]">
                          {[
                            { name: 'Train Swap', desc: 'Avoid using vehicle for transit once', pts: '+40 GP', done: true },
                            { name: 'Vegan Meal Choice', desc: 'Sustain lunch using vegan products', pts: '+30 GP', done: true },
                            { name: 'Sync with Cloud Server', desc: 'Create your digital identity', pts: '+100 GP', done: supabaseUserId !== null }
                          ].map((q, idx) => (
                            <div key={idx} className="p-2.5 bg-slate-950 border border-white/[0.02] rounded-lg flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className={q.done ? 'text-emerald-400' : 'text-slate-600'}>
                                  {q.done ? '✓' : '●'}
                                </span>
                                <div>
                                  <span className={`block font-bold ${q.done ? 'text-slate-400 line-through' : 'text-white'}`}>{q.name}</span>
                                  <span className="text-[9px] text-slate-500">{q.desc}</span>
                                </div>
                              </div>
                              <span className="text-[10px] text-amber-400 font-bold">{q.pts}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {currentFolder === 'commerce' && (
                    <div id="dir-commerce" className="space-y-4">
                      <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-900 flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <ShoppingBag className="w-4 h-4 text-purple-400 animate-bounce" />
                            <h4 className="text-xs font-bold font-mono text-white uppercase tracking-wider">Integrated_Eco_Commerce</h4>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            Spend earned Green Points (GP) to acquire verified UN certificates or plant real native trees.
                          </p>
                        </div>
                      </div>

                      {/* Store offerings */}
                      <div className="space-y-2.5" id="commerce-catalog">
                        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">ECOYSTEM REDEMPTIONS CATALOG:</span>
                        
                        {[
                          { id: 'tree_native', name: 'Plant 1 Native Oak Tree', desc: 'Provides real lifetime carbon absorption', gp: 50, icon: Trees },
                          { id: 'solar_cert', name: 'Verified renewable credit (1 MWh)', desc: 'Offset local household scope-2 limits', gp: 120, icon: Zap },
                          { id: 'biodiversity', name: 'Trust Forest Ecosystem purchase', desc: 'Secure 100 sq ft wilderness preserve', gp: 180, icon: Sparkles }
                        ].map((item) => {
                          const ItemIcon = item.icon;
                          const ownedCount = purchasedCredits.find(p => p.id === item.id)?.qty || 0;
                          return (
                            <div key={item.id} className="p-3.5 bg-slate-950 border border-white/[0.03] rounded-xl text-left space-y-3">
                              <div className="flex justify-between items-start gap-3">
                                <div className="flex items-start gap-2.5">
                                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0 mt-0.5">
                                    <ItemIcon className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <span className="text-xs font-bold text-white block">{item.name}</span>
                                    <span className="text-[10px] text-slate-400 mt-0.5 block leading-tight">{item.desc}</span>
                                  </div>
                                </div>
                                <div className="bg-slate-900 border border-slate-800 text-[10px] font-mono px-2 py-0.5 rounded text-amber-300">
                                  {item.gp} GP
                                </div>
                              </div>

                              <div className="flex justify-between items-center bg-slate-900/40 p-2 rounded-lg text-[10px] font-mono">
                                <span className="text-slate-500">
                                  Owned Inventory: <strong className="text-teal-400 font-bold">{ownedCount} units</strong>
                                </span>
                                
                                <button
                                  id={`btn-purchase-${item.id}`}
                                  onClick={() => handleRedeem(item.id, item.name, item.gp)}
                                  className="px-2.5 py-1 bg-purple-500/20 hover:bg-purple-500/35 border border-purple-500/40 rounded text-purple-300 hover:text-white transition-all cursor-pointer font-bold uppercase text-[9px]"
                                >
                                  REDEEM UNIT
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Purchases history catalog if any */}
                      {purchasedCredits.length > 0 && (
                        <div className="p-3 bg-slate-950 rounded-lg border border-slate-900" id="purchase-invoice-tracker">
                          <span className="text-[9px] font-mono text-slate-500 block uppercase mb-1.5">REDEEMED LEDGER STATUS:</span>
                          <div className="space-y-1 text-[10px] font-mono text-emerald-400">
                            {purchasedCredits.map((item, idx) => (
                              <div key={idx} className="flex justify-between">
                                <span className="truncate">↳ {item.name}</span>
                                <span className="font-bold">x{item.qty} Successfully Procured</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {currentFolder === 'cloud_sync' && (
                    <div id="dir-cloud-sync" className="space-y-4">
                      <SupabaseAuth 
                        onSessionChange={onSessionChange} 
                        userId={supabaseUserId} 
                        onSyncRequest={onSyncRequest} 
                        syncing={syncing} 
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer status line */}
            <div className="p-4 border-t border-slate-900 bg-slate-950 text-center text-[10px] text-slate-600 font-mono flex-shrink-0 flex justify-between items-center">
              <span>SYSTEM ENGINE ACTIVE v1.8.4</span>
              <span className="text-emerald-500/60 font-semibold uppercase tracking-wider">ISO-14064 Compliant</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, Leaf, Activity, Star, Users, Navigation, 
  Camera, ShoppingBag, ShieldAlert, Cpu, Heart, AlertCircle, LogIn, LogOut, Cloud
} from 'lucide-react';
import LandingPage from './components/LandingPage';
import CalculatorWizard from './components/CalculatorWizard';
import CoachSection from './components/CoachSection';
import TwinSection from './components/TwinSection';
import ReceiptScannerSection from './components/ReceiptScannerSection';
import RoutePlannerSection from './components/RoutePlannerSection';
import QuestsSection from './components/QuestsSection';
import MarketplaceSection from './components/MarketplaceSection';
import ExtraControlsDrawer from './components/ExtraControlsDrawer';
import Logo from './components/Logo';
import LoginLogo from './components/LoginLogo';
import { CarbonProfile, CarbonCalculatorData, EmissionBreakdown, LeaderboardUser } from './types';
import { loadUserCarbonData, saveUserCarbonData } from './lib/supabase';

// Preset leaderboard profiles representing standard cohorts
const INITIAL_LEADERBOARD: LeaderboardUser[] = [
  { rank: 1, name: "Marcus Aero (Norway Grid)", score: 92, emissions: 1.4, level: "Earth Hero" },
  { rank: 2, name: "Sofia Green (solar Tariff)", score: 86, emissions: 2.2, level: "Forest Guardian" },
  { rank: 3, name: "Eco Champion (You)", score: 72, emissions: 4.8, level: "Tree", isCurrentUser: true },
  { rank: 4, name: "Lucas Transit Commuter", score: 62, emissions: 6.1, level: "Tree" },
  { rank: 5, name: "Avery Standard Diet", score: 45, emissions: 9.2, level: "Sapling" },
  { rank: 6, name: "Jessica Red Meat Heavy", score: 28, emissions: 14.5, level: "Seed" }
];

export default function App() {
  const [inPortal, setInPortal] = useState(false);
  const [activeTab, setActiveTab] = useState<'twin' | 'calculator' | 'coach' | 'quests' | 'receipt' | 'routes' | 'marketplace'>('twin');
  
  // App unified state
  const [profile, setProfile] = useState<CarbonProfile>({
    id: "carbon_usr_1",
    name: "Eco Champion",
    level: "Tree",
    xp: 380,
    greenPoints: 460,
    streak: 4
  });

  const [calculatorData, setCalculatorData] = useState<CarbonCalculatorData>({
    transportation: { carMiles: 140, carType: "hybrid", publicTransitHours: 5, flightsCount: 2 },
    electricity: { monthlyKwh: 380, renewableRatio: 0.3 },
    food: { dietType: "omnivore", wasteRatio: 3 },
    shopping: { clothingSpend: 100, electronicsSpend: 150, miscSpend: 80 },
    water: { dailyShowers: 12, appliancesWeekly: 6 }
  });

  const [breakdown, setBreakdown] = useState<EmissionBreakdown>({
    transportation: 1950,
    electricity: 1420,
    food: 2150,
    shopping: 1120,
    water: 480,
    total: 7120,
    carbonScore: 72
  });

  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>(INITIAL_LEADERBOARD);

  // Supabase Integration States
  const [supabaseSession, setSupabaseSession] = useState<any>(null);
  const [supabaseUserId, setSupabaseUserId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [isExtraDrawerOpen, setIsExtraDrawerOpen] = useState(false);

  // Authenticated state handler - loads user accounts or clones local metrics to Postgres
  const handleSessionChange = async (session: any) => {
    setSupabaseSession(session);
    if (session?.user) {
      const uId = session.user.id;
      setSupabaseUserId(uId);
      
      setSyncing(true);
      const cloudData = await loadUserCarbonData(uId);
      if (cloudData) {
        if (cloudData.name) {
          setProfile(prev => ({
            ...prev,
            id: cloudData.id,
            name: cloudData.name,
            level: cloudData.level as any,
            xp: cloudData.xp,
            greenPoints: cloudData.green_points,
            streak: cloudData.streak
          }));
        }
        if (cloudData.calculator_data) {
          setCalculatorData(cloudData.calculator_data);
        }
        if (cloudData.breakdown) {
          setBreakdown(cloudData.breakdown);
          
          setLeaderboard(prev => prev.map(u => 
            u.isCurrentUser 
              ? { 
                  ...u, 
                  name: `${cloudData.name || 'You'} (Cloud)`,
                  score: cloudData.breakdown!.carbonScore, 
                  emissions: parseFloat((cloudData.breakdown!.total / 1000).toFixed(1)), 
                  level: cloudData.level 
                } 
              : u
          ).sort((a,b) => b.score - a.score).map((item, index) => ({...item, rank: index + 1})));
        }
      } else {
        const displayName = session.user.user_metadata?.display_name || 'Carbon Pioneer';
        setProfile(prev => ({ ...prev, name: displayName, id: uId }));
        await saveUserCarbonData(uId, displayName, profile, calculatorData, breakdown);
      }
      setSyncing(false);
    } else {
      setSupabaseUserId(null);
      setProfile(prev => ({
        ...prev,
        id: "carbon_usr_1",
        name: "Eco Champion"
      }));
    }
  };

  const handleSyncRequest = async () => {
    if (!supabaseUserId) return;
    setSyncing(true);
    await saveUserCarbonData(supabaseUserId, profile.name, profile, calculatorData, breakdown);
    setSyncing(false);
  };

  // Synchronize current profile state from backend on mount
  useEffect(() => {
    const fetchBaseline = async () => {
      try {
        const response = await fetch('/api/carbon/metrics');
        if (response.ok) {
          const result = await response.json();
          if (!supabaseUserId) {
            setProfile(result.profile);
            setCalculatorData(result.calculatorData);
            setBreakdown(result.breakdown);
          }
        }
      } catch (err) {
        console.warn("Express endpoint booting, operating on local model baseline.");
      }
    };
    fetchBaseline();
  }, [supabaseUserId]);

  // Update cumulative parameters when local calculator finishes computing
  const handleCalculationComplete = (data: { breakdown: EmissionBreakdown; calculatorData: CarbonCalculatorData }) => {
    setBreakdown(data.breakdown);
    setCalculatorData(data.calculatorData);
    
    // Smooth level up rules
    let nextLvl = profile.level;
    if (data.breakdown.carbonScore > 85) nextLvl = "Earth Hero";
    else if (data.breakdown.carbonScore > 70) nextLvl = "Forest Guardian";
    else if (data.breakdown.carbonScore > 45) nextLvl = "Tree";

    const updatedProfile = {
      ...profile,
      level: nextLvl,
      xp: profile.xp + 40 // award calculator completed XP
    };

    setProfile(updatedProfile);

    // Sync leaderboard positions
    setLeaderboard(prev => prev.map(u => 
      u.isCurrentUser 
        ? { ...u, score: data.breakdown.carbonScore, emissions: parseFloat((data.breakdown.total / 1000).toFixed(1)), level: nextLvl } 
        : u
    ).sort((a,b) => b.score - a.score).map((item, index) => ({...item, rank: index + 1})));

    // Auto sync to database if user is premium connected
    if (supabaseUserId) {
      saveUserCarbonData(supabaseUserId, updatedProfile.name, updatedProfile, data.calculatorData, data.breakdown);
    }

    setActiveTab('twin'); // transition automatically to see twin avatar update
  };

  const handleQuestCompleted = (updatedProfile: CarbonProfile) => {
    setProfile(updatedProfile);
    
    // update current user statistics on leaderboard
    setLeaderboard(prev => prev.map(u => 
      u.isCurrentUser 
        ? { ...u, level: updatedProfile.level } 
        : u
    ));

    // Auto sync to database if user is premium connected
    if (supabaseUserId) {
      saveUserCarbonData(supabaseUserId, updatedProfile.name, updatedProfile, calculatorData, breakdown);
    }
  };

  // Convert total to tons
  const totalTons = (breakdown.total / 1000).toFixed(1);

  if (!inPortal) {
    return (
      <div className="min-h-screen bg-carbon-dark text-white relative">
        <LandingPage 
          onStart={() => setInPortal(true)} 
          leaderboard={leaderboard} 
          onOpenExtraDrawer={() => setIsExtraDrawerOpen(true)} 
          onOpenCloudIdentity={() => setIsExtraDrawerOpen(true)}
          userEmail={supabaseSession?.user?.email || null}
        />
        {/* Extra Controls Drawer */}
        <ExtraControlsDrawer
          isOpen={isExtraDrawerOpen}
          onClose={() => setIsExtraDrawerOpen(false)}
          onSessionChange={handleSessionChange}
          supabaseUserId={supabaseUserId}
          onSyncRequest={handleSyncRequest}
          syncing={syncing}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-carbon-dark text-white relative">
      {/* Visual background aurora elements matching design theme */}
      <div className="aurora" />

      {/* Floating Left Side Expert Workspace Handle */}
      <div className="fixed left-0 top-[40%] z-[45] transform -translate-y-1/2 hidden md:block">
        <button
          onClick={() => setIsExtraDrawerOpen(true)}
          className="bg-slate-900/95 hover:bg-slate-950 text-white border-y border-r border-[#00E676]/30 flex flex-col items-center gap-2 pl-3 pr-3.5 py-4 rounded-r-2xl shadow-xl shadow-slate-950/50 hover:border-[#00E676]/80 transition-all cursor-pointer group active:scale-95 text-[10px] font-mono font-bold uppercase tracking-widest"
          title="Open Expert Workspace & Leaderboard"
        >
          <Cpu className="w-4 h-4 text-[#00E676] group-hover:rotate-12 transition-transform" />
          <div className="h-28 flex items-center justify-center">
            <span style={{ writingMode: 'vertical-lr', textOrientation: 'mixed' }} className="text-slate-300 group-hover:text-white transition-colors">
              EXPERT WORKSPACE
            </span>
          </div>
          <div className="relative flex h-2 w-2 mt-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </div>
        </button>
      </div>

      {/* Mobile-Friendly Floating Button representation as well */}
      <div className="fixed bottom-4 left-4 z-[45] md:hidden">
        <button
          onClick={() => setIsExtraDrawerOpen(true)}
          className="bg-slate-900 hover:bg-slate-950 text-white border border-[#00E676]/30 px-3.5 py-2.5 rounded-full shadow-2xl flex items-center gap-2 text-xs font-mono font-bold tracking-wider"
        >
          <Cpu className="w-4 h-4 text-[#00E676]" />
          <span>EXPERT LAB</span>
        </button>
      </div>

      {/* Extra Controls Drawer */}
      <ExtraControlsDrawer
        isOpen={isExtraDrawerOpen}
        onClose={() => setIsExtraDrawerOpen(false)}
        onSessionChange={handleSessionChange}
        supabaseUserId={supabaseUserId}
        onSyncRequest={handleSyncRequest}
        syncing={syncing}
      />

      {/* Main Header bar */}
      <header className="border-b border-slate-900 bg-slate-950/45 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            {/* Top Left Menu Button to open Folders Workspace */}
            <button
              id="top-left-system-btn"
              onClick={() => setIsExtraDrawerOpen(true)}
              className="px-3.5 py-2 border border-emerald-500/30 hover:border-emerald-400 bg-slate-900/80 hover:bg-slate-950 rounded-xl text-emerald-400 flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 group font-mono text-[11px] font-bold"
              title="Open System Explorer & Folders"
            >
              <Cpu className="w-4 h-4 text-emerald-400 group-hover:rotate-12 transition-transform" />
              <span>EXPLORE</span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </button>

            <div className="flex items-center gap-2.5">
              <div className="flex flex-col items-start justify-center">
                <Logo size="sm" showSlogan={false} className="!items-start" />
                <span className="text-[8px] sm:text-[9px] text-slate-500 font-mono block mt-0.5 tracking-wider">GHG ACCREDITED ENVIRONMENTAL SCIENCE INDEX</span>
              </div>
            </div>
          </div>

          {/* Quick HUD Metrics */}
          <div className="flex items-center gap-4 text-xs">
            <div className="hidden md:flex gap-4 border-r border-slate-800/80 pr-4">
              <div>
                <span className="text-slate-500 block text-[9px] uppercase font-mono">My Baseline</span>
                <span className="font-mono font-bold text-white text-right block">{totalTons} tons CO₂/yr</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px] uppercase font-mono">Carbon Class</span>
                <span className="font-mono font-bold text-carbon-primary block text-right">Tier {profile.level}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px] uppercase font-mono">Streak</span>
                <span className="font-mono font-bold text-amber-400 block text-right">{profile.streak} Days</span>
              </div>
            </div>

            {/* Cloud Storage Account Connector button */}
            <button
               id="top-header-cloud-btn"
               onClick={() => setIsExtraDrawerOpen(true)}
               className={`flex items-center gap-2 px-3.5 py-1.5 border rounded-lg font-medium transition-all cursor-pointer ${
                 supabaseUserId 
                   ? 'border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-400' 
                   : 'border-indigo-500/30 bg-indigo-500/15 hover:bg-indigo-500/30 text-indigo-300 shadow-lg shadow-indigo-500/5 animate-pulse'
               }`}
             >
               <LoginLogo size="16" />
               {supabaseUserId ? (
                 <span className="hidden sm:inline">Synced Profile</span>
               ) : (
                 <span className="hidden sm:inline">Create Account / Login</span>
               )}
             </button>

            <button
              id="top-header-workspace-btn"
              onClick={() => {
                setIsExtraDrawerOpen(true);
              }}
              className="flex items-center gap-2 px-3.5 py-1.5 border border-slate-800 bg-white/5 hover:bg-white/10 rounded-lg text-slate-300 font-medium transition-all cursor-pointer"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">System Explorer</span>
            </button>

            <button
              onClick={() => setInPortal(false)}
              className="flex items-center gap-2 px-3.5 py-1.5 border border-slate-800 bg-white/5 hover:bg-white/10 rounded-lg text-slate-300 font-medium transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Exit Portal
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Command Bar tabs */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-1.5 bg-slate-950/65 p-1 rounded-xl border border-slate-900/80 overflow-x-auto no-scrollbar mb-8 select-none">
          {[
            { id: 'twin', label: 'AI Carbon Twin', icon: Activity },
            { id: 'calculator', label: 'Carbon Calculator', icon: Leaf },
            { id: 'coach', label: 'Climate Coach', icon: Sparkles },
            { id: 'receipt', label: 'Receipt Scanner', icon: Camera },
            { id: 'routes', label: 'Transit Planner', icon: Navigation },
            { id: 'quests', label: 'Progress Quests', icon: Star },
            { id: 'marketplace', label: 'Offsets Marketplace', icon: ShoppingBag }
          ].map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide font-display transition-all whitespace-nowrap cursor-pointer ${
                  isActive 
                    ? 'bg-gradient-to-r from-carbon-primary to-carbon-secondary text-carbon-dark shadow-md shadow-carbon-primary/10 font-bold' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <TabIcon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Selected Hub Render */}
        <div className="min-h-[480px]">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="w-full"
          >
            {activeTab === 'twin' && (
              <TwinSection 
                userBreakdown={breakdown} 
                onSessionChange={handleSessionChange}
                supabaseUserId={supabaseUserId}
                onSyncRequest={handleSyncRequest}
                syncing={syncing}
              />
            )}
            {activeTab === 'calculator' && <CalculatorWizard onCalculationComplete={handleCalculationComplete} currentData={calculatorData} />}
            {activeTab === 'coach' && <CoachSection userBreakdown={breakdown} />}
            {activeTab === 'receipt' && <ReceiptScannerSection />}
            {activeTab === 'routes' && <RoutePlannerSection />}
            {activeTab === 'quests' && <QuestsSection userProfile={profile} onQuestCompleted={handleQuestCompleted} />}
            {activeTab === 'marketplace' && <MarketplaceSection />}
          </motion.div>
        </div>
      </div>

      {/* Small design credit floating index */}
      <footer className="border-t border-slate-900 mt-20 bg-slate-950/30 py-6 text-center text-slate-600 text-xs font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>CarbonSteps Dashboard / ISO 14064 Standard Environmental Compliances</span>
          <span className="flex items-center gap-1">Created for Environmental Hackathon <Sparkles className="w-3 h-3 text-carbon-primary" /></span>
        </div>
      </footer>
    </div>
  );
}

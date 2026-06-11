import React, { useState, useEffect, lazy, Suspense } from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, Leaf, Activity, Star, Users, Navigation, 
  Camera, ShoppingBag, ShieldAlert, Cpu, Heart, AlertCircle, LogIn, LogOut, Cloud
} from 'lucide-react';
import LandingPage from './components/LandingPage';
import TwinSection from './components/TwinSection';
import Logo from './components/Logo';
import LoginLogo from './components/LoginLogo';
import { CarbonProfile, CarbonCalculatorData, EmissionBreakdown, LeaderboardUser } from './types';
import { loadUserCarbonData, saveUserCarbonData, supabase } from './lib/supabase';
import FloatingAIHelper from './components/FloatingAIHelper';
import ErrorBoundary from './components/ErrorBoundary';
import { Session } from '@supabase/supabase-js';
import MultiStageSkeleton from './components/MultiStageSkeleton';

// Code splitting and lazy loading of section components (Lighthouse 95+)
const CalculatorWizard = lazy(() => import('./components/CalculatorWizard'));
const CoachSection = lazy(() => import('./components/CoachSection'));
const ReceiptScannerSection = lazy(() => import('./components/ReceiptScannerSection'));
const RoutePlannerSection = lazy(() => import('./components/RoutePlannerSection'));
const QuestsSection = lazy(() => import('./components/QuestsSection'));
const MarketplaceSection = lazy(() => import('./components/MarketplaceSection'));
const LoginPage = lazy(() => import('./components/LoginPage'));
const ExtraControlsDrawer = lazy(() => import('./components/ExtraControlsDrawer'));

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
  const [supabaseSession, setSupabaseSession] = useState<Session | null>(null);
  const [supabaseUserId, setSupabaseUserId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [isExtraDrawerOpen, setIsExtraDrawerOpen] = useState(false);

  // Helper load function that fetches from live Supabase profile
  const loadData = async (uId: string) => {
    return await loadUserCarbonData(uId);
  };

  // Helper save function that upserts live Supabase profile
  const saveData = async (uId: string, name: string, prof: CarbonProfile, calc: CarbonCalculatorData, breakd: EmissionBreakdown) => {
    return await saveUserCarbonData(uId, name, prof, calc, breakd);
  };

  // Authenticated state handler - loads user accounts or clones local metrics to Postgres
  const handleSessionChange = async (session: Session | null) => {
    setSupabaseSession(session);
    if (session?.user) {
      const uId = session.user.id;
      setSupabaseUserId(uId);
      
      setSyncing(true);
      const cloudData = await loadData(uId);
      if (cloudData) {
        if (cloudData.name) {
          setProfile(prev => ({
            ...prev,
            id: cloudData.id,
            name: cloudData.name,
            level: cloudData.level as CarbonProfile['level'],
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
                  name: `${cloudData.name || 'You'}`,
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
        await saveData(uId, displayName, profile, calculatorData, breakdown);
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
    await saveData(supabaseUserId, profile.name, profile, calculatorData, breakdown);
    setSyncing(false);
  };

  const handleSignOut = async () => {
    setSyncing(true);
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn("Supabase auth engine logout warning:", err);
      }
    }
    setSupabaseSession(null);
    setSupabaseUserId(null);
    setSyncing(false);
  };

  // Check for auto-login on component boot up
  useEffect(() => {
    const checkActiveSession = async () => {
      // Try real Supabase auth session if configured
      if (supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            handleSessionChange(session);
            return;
          }
        } catch (e) {
          console.warn("Failed checking Supabase baseline session on boot.");
        }
      }
    };
    checkActiveSession();
  }, []);

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
      saveData(supabaseUserId, updatedProfile.name, updatedProfile, data.calculatorData, data.breakdown);
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
      saveData(supabaseUserId, updatedProfile.name, updatedProfile, calculatorData, breakdown);
    }
  };

  // Convert total to tons
  const totalTons = (breakdown.total / 1000).toFixed(1);

  if (!supabaseUserId) {
    return (
      <ErrorBoundary>
        <Suspense fallback={<MultiStageSkeleton stages={["Securing authentication context...", "Resolving local portal key..."]} />}>
          <LoginPage onLoginSuccess={handleSessionChange} />
        </Suspense>
      </ErrorBoundary>
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
          className="bg-slate-900/95 hover:bg-slate-950 text-white border-y border-r border-[#10B981]/30 flex flex-col items-center gap-2 pl-3 pr-3.5 py-4 rounded-r-2xl shadow-xl shadow-slate-950/50 hover:border-[#10B981]/85 transition-all cursor-pointer group active:scale-95 text-[10px] font-mono font-bold uppercase tracking-widest"
          title="Open Expert Workspace & Leaderboard"
        >
          <Cpu className="w-4 h-4 text-[#10B981] group-hover:rotate-12 transition-transform" />
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
          className="bg-slate-900 hover:bg-slate-950 text-white border border-[#10B981]/30 px-3.5 py-2.5 rounded-full shadow-2xl flex items-center gap-2 text-xs font-mono font-bold tracking-wider animate-pulse hover:animate-none"
        >
          <Cpu className="w-4 h-4 text-[#10B981]" />
          <span>EXPERT LAB</span>
        </button>
      </div>

      {/* Extra Controls Drawer */}
      <Suspense fallback={null}>
        <ExtraControlsDrawer
          isOpen={isExtraDrawerOpen}
          onClose={() => setIsExtraDrawerOpen(false)}
          onSessionChange={handleSessionChange}
          supabaseUserId={supabaseUserId}
          onSyncRequest={handleSyncRequest}
          syncing={syncing}
        />
      </Suspense>

      {/* Main Header bar */}
      <header className="border-b border-emerald-500/10 bg-[#0B130E]/85 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2.5">
              <div className="flex flex-col items-start justify-center">
                <Logo size="sm" showSlogan={false} className="!items-start" />
                <span className="text-[8px] sm:text-[9px] text-slate-500 font-mono block mt-0.5 tracking-wider uppercase">GHG ACCREDITED SCIENCE INDEX</span>
              </div>
            </div>
            
            {/* Action Explore Button */}
            <button
              id="top-left-system-btn"
              onClick={() => setIsExtraDrawerOpen(true)}
              className="px-3 py-1.5 border border-emerald-500/25 hover:border-emerald-400 bg-slate-950 rounded-xl text-emerald-400 flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105 active:scale-95 group font-mono text-[10px] font-bold"
              title="Open System Explorer & Folders"
            >
              <Cpu className="w-3.5 h-3.5 text-emerald-400 group-hover:rotate-12 transition-transform" />
              <span>EXPLORE</span>
            </button>
          </div>

          {/* Quick HUD Metrics */}
          <div className="flex items-center gap-3.5 text-xs w-full sm:w-auto justify-end">
            <div className="flex items-center gap-4 border-r border-[#10B981]/15 pr-4">
              <div>
                <span className="text-slate-500 block text-[8px] uppercase font-mono leading-none mb-0.5">My Baseline</span>
                <span className="font-mono font-bold text-white text-right block text-[11.5px]">{totalTons} t CO₂/yr</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[8px] uppercase font-mono leading-none mb-0.5">Tier Carbon</span>
                <span className="font-mono font-bold text-carbon-primary block text-right text-[11.5px]">{profile.level}</span>
              </div>
              <div className="hidden xs:block">
                <span className="text-slate-500 block text-[8px] uppercase font-mono leading-none mb-0.5">Streak</span>
                <span className="font-mono font-bold text-amber-400 block text-right text-[11.5px]">{profile.streak} Days</span>
              </div>
            </div>

            {/* Cloud Storage Account Indicator */}
            <div className="flex items-center gap-1.5 bg-slate-950/45 border border-[#10B981]/15 rounded-xl px-3 py-1.5 font-mono text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-450 animate-pulse" />
              <span className="font-bold text-white max-w-[120px] truncate">{profile.name}</span>
            </div>

            {/* Logout Trigger */}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-red-300 font-mono text-[11px] font-bold transition-all cursor-pointer select-none active:scale-95"
              title="Secure Log Out"
            >
              <LogOut className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden sm:inline">Log Out</span>
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
                onClick={() => setActiveTab(tab.id as 'twin' | 'calculator' | 'coach' | 'receipt' | 'routes' | 'quests' | 'marketplace')}
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
          <ErrorBoundary>
            <Suspense fallback={<MultiStageSkeleton />}>
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
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>

      {/* Small design credit floating index */}
      <footer className="border-t border-slate-900 mt-20 bg-slate-950/30 py-6 text-center text-slate-600 text-xs font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>CarbonSteps Dashboard / ISO 14064 Standard Environmental Compliances / Developer: <strong className="text-[#10B981] font-bold">Sumit Raj (IITian)</strong></span>
          <span className="flex items-center gap-1">Created for Environmental Hackathon <Sparkles className="w-3 h-3 text-carbon-primary" /></span>
        </div>
      </footer>

      {/* Persistent Direct Access AI Helper Widget */}
      <FloatingAIHelper userBreakdown={breakdown} />
    </div>
  );
}

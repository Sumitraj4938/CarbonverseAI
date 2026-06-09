import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Leaf, Activity, Star, Users, Navigation, 
  Camera, ShoppingBag, ShieldAlert, Cpu, Heart, AlertCircle, LogIn, LogOut
} from 'lucide-react';
import LandingPage from './components/LandingPage';
import CalculatorWizard from './components/CalculatorWizard';
import CoachSection from './components/CoachSection';
import TwinSection from './components/TwinSection';
import ReceiptScannerSection from './components/ReceiptScannerSection';
import RoutePlannerSection from './components/RoutePlannerSection';
import QuestsSection from './components/QuestsSection';
import MarketplaceSection from './components/MarketplaceSection';
import { CarbonProfile, CarbonCalculatorData, EmissionBreakdown, LeaderboardUser } from './types';

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

  // Synchronize current profile state from backend on mount
  useEffect(() => {
    const fetchBaseline = async () => {
      try {
        const response = await fetch('/api/carbon/metrics');
        if (response.ok) {
          const result = await response.json();
          setProfile(result.profile);
          setCalculatorData(result.calculatorData);
          setBreakdown(result.breakdown);
        }
      } catch (err) {
        console.warn("Express endpoint booting, operating on local model baseline.");
      }
    };
    fetchBaseline();
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
  };

  // Convert total to tons
  const totalTons = (breakdown.total / 1000).toFixed(1);

  if (!inPortal) {
    return <LandingPage onStart={() => setInPortal(true)} leaderboard={leaderboard} />;
  }

  return (
    <div className="min-h-screen bg-carbon-dark text-white relative">
      {/* Visual background aurora elements matching design theme */}
      <div className="aurora" />

      {/* Main Header bar */}
      <header className="border-b border-slate-900 bg-slate-950/45 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-carbon-primary to-carbon-secondary flex items-center justify-center shadow-lg shadow-carbon-primary/10 select-none">
              <Leaf className="w-5 h-5 text-carbon-dark" />
            </div>
            <div>
              <h1 className="text-xl font-display font-medium text-white tracking-tight">CarbonVerse <span className="text-carbon-primary text-glow-green">AI</span></h1>
              <span className="text-[10px] text-slate-500 font-mono block">GHG ACCREDITED ENVIRONMENTAL SCIENCE INDEX</span>
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

            <button
              onClick={() => setInPortal(false)}
              className="flex items-center gap-2 px-3.5 py-1.5 border border-slate-800 bg-white/5 hover:bg-white/10 rounded-lg text-slate-300 font-medium transition-all"
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
        <div className="min-h-[480px] transition-all duration-300">
          {activeTab === 'twin' && <TwinSection userBreakdown={breakdown} />}
          {activeTab === 'calculator' && <CalculatorWizard onCalculationComplete={handleCalculationComplete} currentData={calculatorData} />}
          {activeTab === 'coach' && <CoachSection userBreakdown={breakdown} />}
          {activeTab === 'receipt' && <ReceiptScannerSection />}
          {activeTab === 'routes' && <RoutePlannerSection />}
          {activeTab === 'quests' && <QuestsSection userProfile={profile} onQuestCompleted={handleQuestCompleted} />}
          {activeTab === 'marketplace' && <MarketplaceSection />}
        </div>
      </div>

      {/* Small design credit floating index */}
      <footer className="border-t border-slate-900 mt-20 bg-slate-950/30 py-6 text-center text-slate-600 text-xs font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>CarbonVerse AI Dashboard / ISO 14064 Standard Environmental Compliances</span>
          <span className="flex items-center gap-1">Created for Environmental Hackathon <Sparkles className="w-3 h-3 text-carbon-primary" /></span>
        </div>
      </footer>
    </div>
  );
}

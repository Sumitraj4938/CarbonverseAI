import React, { useState } from 'react';
import { 
  Award, Check, Flame, Star, Zap, Leaf, CheckCircle, Plus, Sparkles
} from 'lucide-react';
import { Quest, CarbonProfile } from '../types';

interface QuestsSectionProps {
  userProfile: CarbonProfile;
  onQuestCompleted: (profile: CarbonProfile) => void;
}

export default function QuestsSection({ userProfile, onQuestCompleted }: QuestsSectionProps) {
  const [quests, setQuests] = useState<Quest[]>([
    { id: 'q1', title: 'Walk or Cycle instead of drive', description: 'Swap any fuel travel under 5 miles with active pacing today.', category: 'transportation', xpReward: 25, pointsReward: 40, completed: false, recurring: 'daily' },
    { id: 'q2', title: 'Unplug standby electronics overnight', description: 'Prevent ghost electric leaks by switching off smart strip hubs.', category: 'electricity', xpReward: 15, pointsReward: 25, completed: false, recurring: 'daily' },
    { id: 'q3', title: 'Opt for delicious vegan lunch nutrition', description: 'Introduce locally sourced plant-based ingredients instead of beef.', category: 'food', xpReward: 20, pointsReward: 35, completed: false, recurring: 'daily' },
    { id: 'q4', title: 'Dim household shower run to 5 minutes', description: 'Scale down hot water boilers and save precious gallons.', category: 'water', xpReward: 15, pointsReward: 20, completed: false, recurring: 'daily' },
    { id: 'q5', title: 'Rent or buy a refurbished book or device', description: 'Avoid fast-apparel or material shopping outlays this week.', category: 'shopping', xpReward: 30, pointsReward: 50, completed: false, recurring: 'weekly' }
  ]);

  const [activeTab, setActiveTab] = useState<'daily' | 'badges'>('daily');

  const handleComplete = async (questId: string, xp: number, points: number) => {
    // Optimistically finish quest
    setQuests(prev => prev.map(q => q.id === questId ? { ...q, completed: true } : q));

    try {
      const response = await fetch('/api/quests/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xp, points })
      });
      if (!response.ok) {
        throw new Error("Quest compilation error");
      }
      const data = await response.json();
      onQuestCompleted(data.profile);
    } catch (err) {
      console.error(err);
      // Localized fast backup profile compilation if server-post is lagging or offline
      const mockProfile: CarbonProfile = {
        ...userProfile,
        xp: userProfile.xp + xp,
        greenPoints: userProfile.greenPoints + points,
        streak: userProfile.streak + 1,
        level: userProfile.xp + xp > 1000 ? 'Forest Guardian' : userProfile.xp + xp > 500 ? 'Tree' : userProfile.xp + xp > 250 ? 'Sapling' : 'Seed'
      };
      onQuestCompleted(mockProfile);
    }
  };

  const badges = [
    { name: 'Pioneer Seed', desc: 'Calibrated your live Carbon Twin first time.', unlocked: true, icon: '🌱', levelReq: 'Level 1' },
    { name: 'Solar Voyager', desc: 'Triggered 100% renewable grid mixing.', unlocked: userProfile.xp > 200, icon: '☀️', levelReq: 'Level 2' },
    { name: 'Botanical Knight', desc: 'Maintained a 5-day streak of vegan meals.', unlocked: userProfile.xp > 450, icon: '🥬', levelReq: 'Level 3' },
    { name: 'Forest Sentinel', desc: 'Prevented over 50kg of total receipts carbon.', unlocked: userProfile.xp > 900, icon: '🛡️', levelReq: 'Level 4' }
  ];

  return (
    <div id="gamified-quests" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Profile summary stats card left */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden h-max">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl opacity-10 bg-carbon-primary" />
        
        <div className="space-y-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-carbon-primary/10 text-carbon-primary rounded border border-carbon-primary/20 text-[10px] font-mono">
            <Star className="w-3.5 h-3.5" />
            LIVE PROGRESS JOURNAL
          </div>
          <h3 className="text-xl font-display font-medium text-white">{userProfile.name} Carbon Profile</h3>

          <div className="space-y-3.5 pt-2">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Current Rank Tier:</span>
                <span className="font-bold text-[#00E676]">{userProfile.level}</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-1.5 border border-slate-800">
                <div 
                  className="bg-gradient-to-r from-carbon-primary to-carbon-secondary h-1.2 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, Math.max(10, (userProfile.xp % 350) / 3.5))}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>XP Progress</span>
                <span>{userProfile.xp % 350} / 350 XP</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-white/5 border border-white/5 rounded-xl p-3">
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block mb-1">XP Gathered</span>
                <span className="text-base font-bold font-mono text-white">{userProfile.xp} XP</span>
              </div>

              <div className="bg-white/5 border border-white/5 rounded-xl p-3">
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block mb-1">Green Points</span>
                <span className="text-base font-bold font-mono text-[#00E676]">{userProfile.greenPoints} GPT</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-900 mt-6 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
            <span className="text-slate-300 font-medium">{userProfile.streak}-day eco-streak active!</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">{userProfile.streak > 3 ? 'Hot streak multiplier' : 'Gain multiplier'}</span>
        </div>
      </div>

      {/* Interactive Tabs Panel right */}
      <div className="lg:col-span-2 glass-panel p-6 rounded-2xl flex flex-col justify-between h-[480px]">
        <div>
          {/* Header selectors */}
          <div className="flex border-b border-slate-900 pb-3 mb-4 justify-between items-center">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('daily')}
                className={`text-sm font-semibold tracking-wide font-display transition-all pb-1 ${
                  activeTab === 'daily' ? 'text-[#00E676] border-b-2 border-carbon-primary' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Incentive Quests
              </button>
              <button
                onClick={() => setActiveTab('badges')}
                className={`text-sm font-semibold tracking-wide font-display transition-all pb-1 ${
                  activeTab === 'badges' ? 'text-[#00E676] border-b-2 border-carbon-primary' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Carbon Badges
              </button>
            </div>
            <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-900">SEASON 1</span>
          </div>

          {activeTab === 'daily' ? (
            <div className="space-y-2.5 overflow-y-auto max-h-[340px] pr-1">
              {quests.map((q) => (
                <div 
                  key={q.id} 
                  className={`border rounded-xl p-3.5 flex items-center justify-between gap-3 transition-all ${
                    q.completed 
                      ? 'border-slate-900 bg-slate-950/20 opacity-60' 
                      : 'border-slate-800 bg-white/5 hover:border-carbon-primary/30'
                  }`}
                >
                  <div className="text-left flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-semibold font-mono ${
                        q.recurring === 'daily' ? 'bg-carbon-secondary/15 text-carbon-secondary' : 'bg-carbon-accent/15 text-[#7C4DFF]'
                      }`}>
                        {q.recurring}
                      </span>
                      <h4 className={`font-semibold text-xs truncate ${q.completed ? 'text-slate-500 line-through' : 'text-white'}`}>
                        {q.title}
                      </h4>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 leading-tight truncate">{q.description}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right whitespace-nowrap">
                      <span className="text-[10px] font-mono text-carbon-primary block">+{q.xpReward} XP</span>
                      <span className="text-[9px] font-mono text-slate-500 block">+{q.pointsReward} GPT</span>
                    </div>

                    <button
                      onClick={() => handleComplete(q.id, q.xpReward, q.pointsReward)}
                      disabled={q.completed}
                      className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                        q.completed 
                          ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' 
                          : 'border-slate-800 bg-slate-950 hover:border-carbon-primary hover:text-carbon-primary cursor-pointer'
                      }`}
                    >
                      {q.completed ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 overflow-y-auto max-h-[340px] pr-1">
              {badges.map((b, idx) => (
                <div 
                  key={idx} 
                  className={`border rounded-xl p-4 flex flex-col justify-between text-left transition-all ${
                    b.unlocked 
                      ? 'border-carbon-primary/20 bg-carbon-primary/5' 
                      : 'border-slate-900 bg-slate-950/20 opacity-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-3xl filter drop-shadow selection:bg-transparent">{b.icon}</span>
                    <span className="text-[9px] font-mono text-slate-500 px-1.5 py-0.5 rounded border border-slate-800 uppercase bg-slate-950">
                      {b.levelReq}
                    </span>
                  </div>
                  <div className="mt-3">
                    <h5 className="font-semibold text-xs text-white leading-tight">{b.name}</h5>
                    <p className="text-[10px] text-slate-500 mt-1 leading-tight">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-slate-900 text-slate-500 text-[10px] font-mono text-left flex justify-between">
          <span>Complete quests daily to extend streak bonuses</span>
          <span className="text-carbon-secondary">Green Tokens minting active</span>
        </div>
      </div>
    </div>
  );
}

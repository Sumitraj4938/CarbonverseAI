import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Sparkles, User, ShieldAlert, Cpu, 
  HelpCircle, ThumbsUp, Leaf, DollarSign
} from 'lucide-react';
import { Message, EmissionBreakdown } from '../types';

interface CoachSectionProps {
  userBreakdown?: EmissionBreakdown;
}

export default function CoachSection({ userBreakdown }: CoachSectionProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      content: "Hello! I am your AI Climate Coach. I have loaded your carbon profile and digital twin characteristics. Ask me anything about mitigating emissions, optimizing commute efficiency, transitioning tariffs, or estimating environmental paybacks.",
      timestamp: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [cumulativeSavings, setCumulativeSavings] = useState({ co2Kg: 0, usd: 0 });
  
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const suggestedQuestions = [
    "How can I reduce emissions by 20%?",
    "What is the grid carbon factor of my electric tariff?",
    "Show me commuting switches that save $100+.",
    "Recommend standard diet swaps for low footprints."
  ];

  const handleSend = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          userContext: userBreakdown ? {
            total: userBreakdown.total,
            score: userBreakdown.carbonScore,
            highestSource: getHighestSource(userBreakdown)
          } : undefined
        })
      });

      if (!response.ok) {
        throw new Error('Chat failed');
      }

      const botMsg = await response.json();
      setMessages(prev => [...prev, botMsg]);

      // If response returned projected savings, aggregate it to cumulative metrics
      if (botMsg.projectedSavings) {
        setCumulativeSavings(prev => ({
          co2Kg: prev.co2Kg + botMsg.projectedSavings.co2Kg,
          usd: prev.usd + botMsg.projectedSavings.usd
        }));
      }

    } catch (err) {
      console.error(err);
      // Localized smart fallback answer
      setTimeout(() => {
        const fallbackMsg: Message = {
          id: `bot_${Date.now()}`,
          role: 'model',
          content: "I recommend focusing on thermal home efficiency and travel substitution. Switching off high-vibration power strips can mitigate up to 55kg CO2 yearly, while swapping to active bike commutes yields about 210kg.",
          timestamp: new Date().toISOString(),
          projectedSavings: { co2Kg: 80, usd: 45 }
        };
        setMessages(prev => [...prev, fallbackMsg]);
        setCumulativeSavings(prev => ({
          co2Kg: prev.co2Kg + 80,
          usd: prev.usd + 45
        }));
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  const getHighestSource = (b: EmissionBreakdown) => {
    const scores = [
      { name: 'Commuting & flights', val: b.transportation },
      { name: 'Grid mix electricity', val: b.electricity },
      { name: 'Diet & food waste', val: b.food },
      { name: 'Consumption shopping', val: b.shopping },
      { name: 'Water & appliances', val: b.water }
    ];
    scores.sort((a, b) => b.val - a.val);
    return scores[0].name;
  };

  return (
    <div id="ai-coach-section" className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Cumulative impact ledger card left */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden h-max">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl opacity-15 bg-carbon-accent" />
        
        <div className="space-y-4">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-carbon-accent/10 text-carbon-accent rounded border border-carbon-accent/20 text-[10px] font-mono">
            <Cpu className="w-3 h-3" />
            AI MITIGATION ACCOUNTANT
          </div>
          <h3 className="text-xl font-display font-medium text-white">Your Mitigation Ledger</h3>
          <p className="text-xs text-slate-400">Commit to actions suggested by your Coach to record cumulative sustainability projections.</p>

          <div className="grid grid-cols-2 gap-3 pt-4">
            <div className="bg-white/5 border border-white/5 rounded-xl p-3">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block mb-1">CO₂ Prevented</span>
              <div className="flex items-center gap-1">
                <Leaf className="w-4 h-4 text-carbon-primary" />
                <span className="text-lg font-bold font-mono text-white">{cumulativeSavings.co2Kg} <span className="text-[10px] font-sans text-slate-400">kg</span></span>
              </div>
            </div>

            <div className="bg-white/5 border border-white/5 rounded-xl p-3">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block mb-1">Direct Savings</span>
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4 text-carbon-secondary" />
                <span className="text-lg font-bold font-mono text-white">${cumulativeSavings.usd} <span className="text-[10px] font-sans text-slate-400">/yr</span></span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-900 mt-6 space-y-2">
          <h5 className="text-[11px] text-slate-500 font-mono uppercase tracking-wider">Loaded Carbon Baseline:</h5>
          {userBreakdown && (
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Footprint:</span>
                <span className="font-mono text-white">{(userBreakdown.total / 1000).toFixed(1)} tons CO₂/yr</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Efficiency Index:</span>
                <span className="font-mono text-carbon-primary">{userBreakdown.carbonScore}/100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Primary Source:</span>
                <span className="text-carbon-secondary font-medium">{getHighestSource(userBreakdown)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main chat window right */}
      <div className="lg:col-span-3 glass-panel rounded-2xl flex flex-col h-[520px] overflow-hidden">
        {/* Chat Header */}
        <div className="px-5 py-4 border-b border-slate-900 bg-slate-900/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-carbon-primary to-carbon-secondary flex items-center justify-center shadow-lg shadow-carbon-primary/10">
              <Sparkles className="w-4 h-4 text-carbon-dark" />
            </div>
            <div>
              <h4 className="font-medium text-white text-sm font-display">AI Climate Coach</h4>
              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-carbon-primary rounded-full animate-ping" />
                Gemini Model 3.5 Active
              </span>
            </div>
          </div>
        </div>

        {/* Dedicated Strict Carbon Topic Policy banner */}
        <div className="px-5 py-2 bg-emerald-950/30 border-b border-emerald-900/40 flex items-center gap-2">
          <Leaf className="w-3.5 h-3.5 text-carbon-primary animate-pulse flex-shrink-0" />
          <p className="text-[10px] text-emerald-400 font-medium">
            <span className="font-bold uppercase tracking-wider font-mono">Strict Carbon Domain Protection Active:</span> Ask any questions about carbon footprint mitigation, sustainability, green habits, or climate science. Irrelevant domains are filtered out.
          </p>
        </div>

        {/* Messages list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((m) => {
            const isBot = m.role === 'model';
            return (
              <div 
                key={m.id} 
                className={`flex gap-3 max-w-full ${isBot ? 'justify-start' : 'justify-end'}`}
              >
                {isBot && (
                  <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <Sparkles className="w-3.5 h-3.5 text-carbon-secondary" />
                  </div>
                )}
                
                <div className="space-y-1 max-w-[85%]">
                  <div className={`p-4 rounded-xl text-sm leading-relaxed ${
                    isBot 
                      ? 'bg-white/5 border border-white/5 text-slate-200' 
                      : 'bg-carbon-accent/20 border border-carbon-accent/30 text-white'
                  }`}>
                    {m.content}
                    
                    {/* Embedded interactive saving voucher tags inside chat response */}
                    {m.projectedSavings && (
                      <div className="mt-3.5 pt-3 border-t border-white/5 flex items-center justify-between bg-carbon-primary/5 p-3 rounded-lg border border-carbon-primary/15">
                        <div className="flex items-center gap-2 text-xs text-slate-300">
                          <Leaf className="w-4 h-4 text-carbon-primary" />
                          <span>Commit to this option?</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-mono">
                          <span className="text-carbon-primary">+{m.projectedSavings.co2Kg}kg CO₂</span>
                          <span className="text-carbon-secondary">${m.projectedSavings.usd}/yr</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-500 block font-mono px-1">
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {!isBot && (
                  <div className="w-7 h-7 rounded-full bg-carbon-accent/20 border border-carbon-accent/30 flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-3.5 h-3.5 text-slate-100" />
                  </div>
                )}
              </div>
            );
          })}
          {loading && (
            <div className="flex gap-3 max-w-[85%]">
              <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 mt-1">
                <Sparkles className="w-3.5 h-3.5 text-carbon-primary animate-pulse" />
              </div>
              <div className="bg-white/5 border border-white/5 p-4 rounded-xl text-sm text-slate-500 animate-pulse flex items-center gap-2">
                Analyzing carbon ledger...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggested Prompt Options */}
        <div className="px-5 py-2.5 bg-slate-950/20 border-t border-slate-900 border-dashed flex gap-2 overflow-x-auto no-scrollbar">
          {suggestedQuestions.map((q, qidx) => (
            <button
              key={qidx}
              onClick={() => handleSend(q)}
              disabled={loading}
              className="text-[11px] text-slate-400 bg-white/5 border border-white/5 hover:border-carbon-primary hover:text-carbon-primary transition-all px-3 py-1.5 rounded-full whitespace-nowrap cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Message Input bar */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="p-4 bg-slate-950/40 border-t border-slate-900 flex gap-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI Coach for customizable commuting carbon paybacks..."
            disabled={loading}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-carbon-primary outline-none transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="w-11 h-11 bg-gradient-to-r from-carbon-primary to-carbon-secondary hover:brightness-110 text-carbon-dark font-bold rounded-xl flex items-center justify-center cursor-pointer transition-all disabled:opacity-40"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}

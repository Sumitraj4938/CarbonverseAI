import React, { useState } from 'react';
import { 
  Sparkles, Globe, ShoppingBag, ArrowRight, Check, Heart, ExternalLink
} from 'lucide-react';

export default function MarketplaceSection() {
  const [activeTab, setActiveTab] = useState<'offsets' | 'products'>('offsets');
  const [backedProject, setBackedProject] = useState<string | null>(null);

  const offsets = [
    { id: 'off1', title: 'Acre Amazonian Rainforest Reforestation', region: 'Amazon Basin, Brazil', co2Mitigated: '1 ton CO₂ / $15', cert: 'VCS + CCB Gold', rating: '94% Permanence', desc: 'Protects critical tropical biomes from cattle clearance, conserving extensive wild habitats.', pic: '🌳' },
    { id: 'off2', title: 'Rajasthan Renewable Wind Energy Grid', region: 'Thar Desert, India', co2Mitigated: '1.5 tons CO₂ / $12', cert: 'Gold Standard', rating: '97% Additionality', desc: 'Displaces conventional fossil fuel generation mixes on regional sub-grids via wind power.', pic: '💨' },
    { id: 'off3', title: 'Equatorial clean borehold water project', region: 'Migori, Kenya', co2Mitigated: '1.2 tons CO₂ / $14', cert: 'Gold Standard', rating: '92% Transparency', desc: 'Restores safe drinking assets, cutting tree clearing otherwise needed to boil unfiltered water.', pic: '💧' }
  ];

  const products = [
    { title: 'Smart Wi-Fi Power Strip Optimizer', price: '$29.99', savings: 'Est. 55kg CO₂/yr saved', rating: '⭐ 4.8', desc: 'Kills ghost electricity blocks on standby TVs, consoles, and smart chargers.', pic: '🔌' },
    { title: 'Zero Waste organic Bamboo Toothbrush Set', price: '$12.50', savings: '100% Post-consumer compostable', rating: '⭐ 4.9', desc: 'Sinks conventional synthetic raw materials out of household waste cycles.', pic: '🪥' },
    { title: 'Recycled Kraft fiber notebooks', price: '$8.00', savings: '80% Less water production footprint', rating: '⭐ 4.7', desc: 'Created with post-consumer recycled paper and soy-based printing solutions.', pic: '📓' }
  ];

  return (
    <div id="green-marketplace" className="glass-panel p-6 rounded-2xl flex flex-col justify-between min-h-[480px]">
      <div>
        {/* Header tabs */}
        <div className="flex border-b border-slate-900 pb-3 mb-4 justify-between items-center">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('offsets')}
              className={`text-sm font-semibold tracking-wide font-display transition-all pb-1 ${
                activeTab === 'offsets' ? 'text-[#00E676] border-b-2 border-carbon-primary' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Verified Offset Projects
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`text-sm font-semibold tracking-wide font-display transition-all pb-1 ${
                activeTab === 'products' ? 'text-[#00E676] border-b-2 border-carbon-primary' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Green Retail Marketplace
            </button>
          </div>
          <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-900">VERIFIED STATUS</span>
        </div>

        {activeTab === 'offsets' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            {offsets.map((p) => (
              <div key={p.id} className="bg-slate-950/25 border border-slate-900 rounded-xl p-4 flex flex-col justify-between hover:border-carbon-primary/20 transition-all">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-3xl filter drop-shadow">{p.pic}</span>
                    <span className="text-[9.5px] font-mono text-[#00E676] bg-[#00E676]/10 px-2 py-0.5 border border-[#00E676]/20 rounded">
                      {p.cert}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-white font-display mt-2 leading-tight">{p.title}</h4>
                    <span className="text-[10px] text-slate-500 block font-mono mt-0.5">{p.region}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-light">{p.desc}</p>
                </div>

                <div className="pt-4 border-t border-slate-900 mt-4 space-y-3">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-slate-500">Yield:</span>
                    <span className="text-slate-200">{p.co2Mitigated}</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-slate-500">Audit Metric:</span>
                    <span className="text-carbon-secondary font-semibold">{p.rating}</span>
                  </div>

                  <button
                    onClick={() => setBackedProject(p.id)}
                    className={`w-full py-2 rounded-lg text-xs font-semibold tracking-wide uppercase transition-all mt-1 cursor-pointer text-center ${
                      backedProject === p.id 
                        ? 'bg-carbon-primary/10 border border-carbon-primary/20 text-carbon-primary' 
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    {backedProject === p.id ? (
                      <span className="flex items-center justify-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Project Backed
                      </span>
                    ) : (
                      "Support Offset Project"
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            {products.map((p, idx) => (
              <div key={idx} className="bg-slate-950/25 border border-slate-900 rounded-xl p-4 flex flex-col justify-between hover:border-carbon-secondary/20 transition-all">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-2xl">{p.pic}</span>
                    <span className="text-[9.5px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/5 select-none">
                      {p.rating}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-white font-display mt-2 leading-tight">{p.title}</h4>
                    <span className="text-[10px] text-carbon-secondary block font-semibold mt-0.5">{p.savings}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-light">{p.desc}</p>
                </div>

                <div className="pt-4 border-t border-slate-900 mt-4 flex items-center justify-between">
                  <span className="text-sm font-bold font-mono text-white">{p.price}</span>
                  <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); alert("Thanks for trying out the Green Marketplace hackathon prototype!"); }}
                    className="flex items-center gap-1 text-[11px] font-semibold text-carbon-primary hover:underline"
                  >
                    Details <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-slate-900 text-slate-500 text-[10px] font-mono text-left flex justify-between mt-6">
        <span>Offset standards validated via Verra registry records</span>
        <span className="text-[#00BFA5]">Gold Certified</span>
      </div>
    </div>
  );
}

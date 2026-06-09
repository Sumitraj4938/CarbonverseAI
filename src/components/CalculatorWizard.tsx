import React, { useState } from 'react';
import { 
  Car, Zap, Utensils, ShoppingBag, Droplet, 
  ChevronRight, ChevronLeft, Check, Sparkles, AlertCircle 
} from 'lucide-react';
import { CarbonCalculatorData, EmissionBreakdown } from '../types';

interface CalculatorWizardProps {
  onCalculationComplete: (data: { breakdown: EmissionBreakdown; calculatorData: CarbonCalculatorData }) => void;
  currentData: CarbonCalculatorData;
}

export default function CalculatorWizard({ onCalculationComplete, currentData }: CalculatorWizardProps) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CarbonCalculatorData>(currentData);

  const steps = [
    { id: 'transportation', title: 'Transit & Travel', icon: Car, desc: 'How do you commute and fly each year?' },
    { id: 'electricity', title: 'Home Energy', icon: Zap, desc: 'Your home energy grid characteristics.' },
    { id: 'food', title: 'Food & Nutrition', icon: Utensils, desc: 'Your regular diet composition and waste.' },
    { id: 'shopping', title: 'Shopping Habits', icon: ShoppingBag, desc: 'Est. monthly purchases and consumer goods.' },
    { id: 'water', title: 'Water Use', icon: Droplet, desc: 'Showers and washing machine usage.' }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/calculator/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!response.ok) {
        throw new Error('Calculator response error');
      }
      const result = await response.json();
      onCalculationComplete({
        breakdown: result.breakdown,
        calculatorData: result.calculatorData
      });
    } catch (err: any) {
      setError('Failed to compute carbon metrics. Running localized backup calculations...');
      // Localized fast backup calculations in case server is booting
      const mockResult = calculateLocalEmissions(formData);
      onCalculationComplete({
        breakdown: mockResult,
        calculatorData: formData
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateLocalEmissions = (data: CarbonCalculatorData): EmissionBreakdown => {
    let t = data.transportation.carMiles * (data.transportation.carType === 'petrol' ? 0.404 : data.transportation.carType === 'diesel' ? 0.43 : data.transportation.carType === 'electric' ? 0.12 : 0.22) * 52;
    t += data.transportation.publicTransitHours * 1.5 * 52;
    t += data.transportation.flightsCount * 230;

    let e = data.electricity.monthlyKwh * 0.38 * (1 - data.electricity.renewableRatio) * 12;
    let f = (data.food.dietType === 'vegan' ? 800 : data.food.dietType === 'vegetarian' ? 1200 : data.food.dietType === 'pescatarian' ? 1550 : data.food.dietType === 'omnivore' ? 2100 : 3100) + data.food.wasteRatio * 15;
    let s = (data.shopping.clothingSpend * 0.15 + data.shopping.electronicsSpend * 0.35 + data.shopping.miscSpend * 0.1) * 12;
    let w = (data.water.dailyShowers * 0.12 * 365) + (data.water.appliancesWeekly * 0.5 * 52);

    const total = t + e + f + s + w;
    let score = Math.max(10, Math.min(100, Math.round(100 - ((total - 2000) / 16000) * 90)));

    return {
      transportation: Math.round(t),
      electricity: Math.round(e),
      food: Math.round(f),
      shopping: Math.round(s),
      water: Math.round(w),
      total: Math.round(total),
      carbonScore: score
    };
  };

  // Live indicators for instant feeling of consequences
  const currentInstantEstimate = () => {
    const local = calculateLocalEmissions(formData);
    return (local.total / 1000).toFixed(1); // t CO2
  };

  return (
    <div id="calculator-box" className="glass-panel rounded-2xl p-6 md:p-8 relative overflow-hidden">
      {/* Aurora glow background in card */}
      <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-20 bg-carbon-primary" />
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-2xl font-display font-medium text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-carbon-primary animate-pulse" />
            AI Digital Carbon Twin Profiler
          </h3>
          <p className="text-slate-400 text-sm mt-1">Calibrate your live carbon profile to unlock custom eco recommendations.</p>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-500 block uppercase font-mono tracking-wider">Dynamic Footprint Estimate</span>
          <span className="text-xl font-mono font-bold text-carbon-primary text-glow-green">
            {currentInstantEstimate()} <span className="text-xs text-slate-400 font-sans">tons CO₂/yr</span>
          </span>
        </div>
      </div>

      {/* Progress indicators wrapper */}
      <div className="grid grid-cols-5 gap-2 mb-8">
        {steps.map((s, idx) => {
          const StepIcon = s.icon;
          const isActive = idx === step;
          const isDone = idx < step;
          return (
            <button 
              key={s.id}
              onClick={() => setStep(idx)}
              className={`flex flex-col items-center gap-2 transition-all p-2 rounded-lg ${
                isActive ? 'bg-white/10 text-carbon-primary' : isDone ? 'text-carbon-secondary' : 'text-slate-500'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                isActive ? 'bg-carbon-primary/20 border border-carbon-primary' : isDone ? 'bg-carbon-secondary/20 border border-carbon-secondary' : 'bg-slate-800'
              }`}>
                {isDone ? <Check className="w-4 h-4" /> : <StepIcon className="w-4 h-4" />}
              </div>
              <span className="text-[10px] md:text-xs font-medium text-center truncate max-w-full hidden sm:block">{s.title}</span>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-amber-300 text-xs mb-4">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step Form Render */}
      <div className="min-h-[220px] transition-all duration-300">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-tr from-carbon-primary to-carbon-secondary rounded-lg">
            {React.createElement(steps[step].icon, { className: "w-5 h-5 text-carbon-dark" })}
          </div>
          <div>
            <h4 className="text-lg font-medium text-white">{steps[step].title}</h4>
            <p className="text-xs text-slate-400">{steps[step].desc}</p>
          </div>
        </div>

        {step === 0 && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <label className="flex justify-between text-sm text-slate-300 mb-2">
                <span>Commute Miles per Week (Conventional Travel):</span>
                <span className="font-mono text-carbon-primary">{formData.transportation.carMiles} mi</span>
              </label>
              <input 
                type="range" min="0" max="800" step="10"
                value={formData.transportation.carMiles}
                onChange={(e) => setFormData({
                  ...formData,
                  transportation: { ...formData.transportation, carMiles: parseInt(e.target.value) }
                })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-carbon-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Fuel or Engine Type:</label>
                <select 
                  value={formData.transportation.carType}
                  onChange={(e: any) => setFormData({
                    ...formData,
                    transportation: { ...formData.transportation, carType: e.target.value }
                  })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 outline-none focus:border-carbon-primary"
                >
                  <option value="petrol">Conventional Petrol</option>
                  <option value="diesel">Diesel Commuter</option>
                  <option value="hybrid">Efficient Hybrid</option>
                  <option value="electric">Battery Electric Vehicle</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Flights (Medium/Long range per year):</label>
                <input 
                  type="number" min="0" max="30"
                  value={formData.transportation.flightsCount}
                  onChange={(e) => setFormData({
                    ...formData,
                    transportation: { ...formData.transportation, flightsCount: Math.max(0, parseInt(e.target.value) || 0) }
                  })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-sm text-slate-200 outline-none focus:border-carbon-primary"
                />
              </div>
            </div>

            <div>
              <label className="flex justify-between text-sm text-slate-300 mb-2">
                <span>Public Transit (Hours spent weekly):</span>
                <span className="font-mono text-carbon-secondary">{formData.transportation.publicTransitHours} hrs</span>
              </label>
              <input 
                type="range" min="0" max="40" step="1"
                value={formData.transportation.publicTransitHours}
                onChange={(e) => setFormData({
                  ...formData,
                  transportation: { ...formData.transportation, publicTransitHours: parseInt(e.target.value) }
                })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-carbon-secondary"
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <label className="flex justify-between text-sm text-slate-300 mb-2">
                <span>Monthly Electricity Consumption:</span>
                <span className="font-mono text-carbon-primary">{formData.electricity.monthlyKwh} kWh</span>
              </label>
              <input 
                type="range" min="50" max="1500" step="25"
                value={formData.electricity.monthlyKwh}
                onChange={(e) => setFormData({
                  ...formData,
                  electricity: { ...formData.electricity, monthlyKwh: parseInt(e.target.value) }
                })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-carbon-primary"
              />
              <p className="text-[10px] text-slate-500 mt-1">Stripe-level average for active families is ~350-450 kWh.</p>
            </div>

            <div>
              <label className="flex justify-between text-sm text-slate-300 mb-2">
                <span>Renewable Energy Share (Carbon offsets / Green power tariff):</span>
                <span className="font-mono text-carbon-secondary">{Math.round(formData.electricity.renewableRatio * 100)}% Green</span>
              </label>
              <input 
                type="range" min="0" max="1" step="0.1"
                value={formData.electricity.renewableRatio}
                onChange={(e) => setFormData({
                  ...formData,
                  electricity: { ...formData.electricity, renewableRatio: parseFloat(e.target.value) }
                })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-carbon-secondary"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Primary Dietary Pattern:</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {[
                  { value: 'vegan', label: 'Vegan', desc: 'No animal products' },
                  { value: 'vegetarian', label: 'Veg', desc: 'Dairy but no meat' },
                  { value: 'pescatarian', label: 'Pesca', desc: 'Fish and greens' },
                  { value: 'omnivore', label: 'Omnivore', desc: 'Regular balanced' },
                  { value: 'meatHeavy', label: 'High Meat', desc: 'Rich in red beef' }
                ].map((diet) => (
                  <button
                    key={diet.value}
                    type="button"
                    onClick={() => setFormData({
                      ...formData,
                      food: { ...formData.food, dietType: diet.value as any }
                    })}
                    className={`p-2.5 rounded-lg border text-center transition-all ${
                      formData.food.dietType === diet.value 
                        ? 'border-carbon-primary bg-carbon-primary/10 text-white' 
                        : 'border-slate-800 bg-slate-900/40 text-slate-400 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-xs font-semibold block">{diet.label}</span>
                    <span className="text-[9px] text-slate-500 block mt-0.5 whitespace-nowrap">{diet.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="flex justify-between text-sm text-slate-300 mb-2">
                <span>Food Waste frequency score (spoilt food thrown away):</span>
                <span className="font-mono text-amber-400">{formData.food.wasteRatio}/10 (Intensity)</span>
              </label>
              <input 
                type="range" min="0" max="10" step="1"
                value={formData.food.wasteRatio}
                onChange={(e) => setFormData({
                  ...formData,
                  food: { ...formData.food, wasteRatio: parseInt(e.target.value) }
                })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-fadeIn">
            <h5 className="text-[11px] text-slate-400 font-mono uppercase tracking-wider mb-2">Configure Estimated Monthly Outlay</h5>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Textiles & Apparel ($):</label>
                <input 
                  type="number" min="0" max="1000"
                  value={formData.shopping.clothingSpend}
                  onChange={(e) => setFormData({
                    ...formData,
                    shopping: { ...formData.shopping, clothingSpend: Math.max(0, parseInt(e.target.value) || 0) }
                  })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-sm text-slate-200 outline-none focus:border-carbon-primary"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Electronics devices ($):</label>
                <input 
                  type="number" min="0" max="2500"
                  value={formData.shopping.electronicsSpend}
                  onChange={(e) => setFormData({
                    ...formData,
                    shopping: { ...formData.shopping, electronicsSpend: Math.max(0, parseInt(e.target.value) || 0) }
                  })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-sm text-slate-200 outline-none focus:border-carbon-primary"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">General household goods ($):</label>
                <input 
                  type="number" min="0" max="1500"
                  value={formData.shopping.miscSpend}
                  onChange={(e) => setFormData({
                    ...formData,
                    shopping: { ...formData.shopping, miscSpend: Math.max(0, parseInt(e.target.value) || 0) }
                  })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-sm text-slate-200 outline-none focus:border-carbon-primary"
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-500">Every dollar of high-end consumption accounts for transportation and material mining emissions.</p>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <label className="flex justify-between text-sm text-slate-300 mb-2">
                <span>Daily average Shower duration:</span>
                <span className="font-mono text-carbon-primary">{formData.water.dailyShowers} minutes</span>
              </label>
              <input 
                type="range" min="2" max="30" step="1"
                value={formData.water.dailyShowers}
                onChange={(e) => setFormData({
                  ...formData,
                  water: { ...formData.water, dailyShowers: parseInt(e.target.value) }
                })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-carbon-primary"
              />
            </div>

            <div>
              <label className="flex justify-between text-sm text-slate-300 mb-2">
                <span>Washing appliances run weekly (Dishwasher / Laundry dry cycles):</span>
                <span className="font-mono text-carbon-secondary">{formData.water.appliancesWeekly} loads</span>
              </label>
              <input 
                type="range" min="0" max="20" step="1"
                value={formData.water.appliancesWeekly}
                onChange={(e) => setFormData({
                  ...formData,
                  water: { ...formData.water, appliancesWeekly: parseInt(e.target.value) }
                })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-carbon-secondary"
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="flex justify-between items-center mt-8 pt-4 border-t border-slate-800/60">
        <button
          onClick={handleBack}
          disabled={step === 0}
          className={`flex items-center gap-2 px-4 py-2 border border-slate-800 rounded-lg text-sm font-medium transition-all ${
            step === 0 ? 'text-slate-600 border-slate-900 cursor-not-allowed' : 'text-slate-300 hover:bg-white/5'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        <button
          onClick={handleNext}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-carbon-primary to-carbon-secondary hover:brightness-110 text-carbon-dark rounded-xl text-sm font-bold shadow-lg shadow-carbon-primary/20 transition-all font-display"
        >
          {loading ? (
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-carbon-dark rounded-full animate-bounce" />
              Compiling...
            </span>
          ) : step === steps.length - 1 ? (
            <>
              Sync Carbon Twin
              <Check className="w-4 h-4" />
            </>
          ) : (
            <>
              Next Category
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

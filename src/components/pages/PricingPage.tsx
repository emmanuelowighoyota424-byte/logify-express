import React, { useState, useEffect } from 'react';
import { 
  Calculator, DollarSign, Scale, MapPin, Truck, HelpCircle, 
  ArrowRight, ShieldCheck, Tag, Loader2, Sparkles, Plane, Ship, Check 
} from 'lucide-react';
import { Settings } from '../../types.js';

interface PricingPageProps {
  settings: Settings;
  onNavigate: (view: string) => void;
}

export default function PricingPage({ settings, onNavigate }: PricingPageProps) {
  const [pickup, setPickup] = useState('');
  const [delivery, setDelivery] = useState('');
  const [weight, setWeight] = useState('5');
  const [cargoType, setCargoType] = useState<'Standard' | 'Express' | 'Freight' | 'Document'>('Standard');
  
  const [loading, setLoading] = useState(false);
  const [calculatedQuote, setCalculatedQuote] = useState<any>(null);

  // Service examples only; pricing and transit times must be confirmed for each route.
  const referenceRates = [
    {
      icon: <Truck size={20} className="text-blue-500" />,
      title: 'Ground Standard',
      price: 'Contact for rate',
      description: 'Affordable overland parcel delivery',
      features: ['Availability depends on route', 'Tracking options vary by shipment', 'Confirm coverage before booking']
    },
    {
      icon: <Plane size={20} className="text-blue-500" />,
      title: 'Premium Air Express',
      price: 'Contact for rate',
      description: 'Overnight priority cargo dispatch',
      features: ['Transit time requires confirmation', 'Tracking options vary by shipment', 'Service terms confirmed at booking']
    },
    {
      icon: <Ship size={20} className="text-blue-500" />,
      title: 'Heavy Ocean Cargo',
      price: 'Contact for rate',
      description: 'Bulk logistics for pallets and machinery',
      features: ['Transit time requires confirmation', 'Handling depends on cargo', 'Service terms confirmed at booking']
    }
  ];

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickup || !delivery || Number(weight) <= 0) return;

    setLoading(true);
    setCalculatedQuote(null);

    // Dynamic price calculation
    setTimeout(() => {
      const base = settings.pricing.basePrice;
      const kg = settings.pricing.pricePerKg;
      let calculatedPrice = base + (Number(weight) * kg);

      if (cargoType === 'Express') calculatedPrice *= 1.5;
      if (cargoType === 'Freight') calculatedPrice *= 1.8;
      if (cargoType === 'Document') calculatedPrice = base + 5;

      setCalculatedQuote({
        id: 'EST-' + Math.floor(100000 + Math.random() * 900000),
        pickup,
        delivery,
        weight: Number(weight),
        type: cargoType,
        distanceKm: null,
        price: Number(calculatedPrice.toFixed(2)),
        time: 'Confirm after route review'
      });
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="faster-page faster-pricing flex-1 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors py-12 text-left">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Title */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h1 className="text-xs font-black uppercase text-blue-600 dark:text-blue-400 tracking-widest font-mono">
            Route-dependent pricing
          </h1>
          <h2 className="text-3xl sm:text-4xl font-sans font-black text-slate-900 dark:text-white tracking-tight">
            Shipping Rates & Calculator
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            This preliminary estimate uses configured base and weight rates only. Route distance is not verified, so the result is not a final shipping quote or delivery promise.
          </p>
        </div>

        {/* Dynamic Calculator & Reference Card layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Dynamic Calculator form (Left - 7 cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-4">
              <Calculator size={20} className="text-blue-600 dark:text-blue-400" />
              <h3 className="text-sm font-black uppercase text-slate-800 dark:text-slate-200 tracking-wide font-sans">
                Cargo Rate Cost Calculator
              </h3>
            </div>

            <form onSubmit={handleCalculate} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-black tracking-wide flex items-center gap-1.5">
                    <MapPin size={12} className="text-blue-500" /> Pickup Street/ZIP
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. New York, NY 10005"
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-sans"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-black tracking-wide flex items-center gap-1.5">
                    <MapPin size={12} className="text-blue-500" /> Destination Street/ZIP
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Los Angeles, CA 90024"
                    value={delivery}
                    onChange={(e) => setDelivery(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-sans"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-black tracking-wide flex items-center gap-1.5">
                    <Scale size={12} className="text-blue-500" /> Weight (kg)
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    required
                    placeholder="e.g. 12"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white font-mono font-bold outline-none focus:border-blue-500 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-black tracking-wide flex items-center gap-1.5">
                    <Truck size={12} className="text-blue-500" /> Service Category
                  </label>
                  <select
                    value={cargoType}
                    onChange={(e: any) => setCargoType(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-all font-bold"
                  >
                    <option value="Standard">🚛 Standard Ground</option>
                    <option value="Express">✈️ Premium Air Express</option>
                    <option value="Freight">🚢 Heavy Ocean Cargo</option>
                    <option value="Document">✉️ Document / Envelope</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/10 cursor-pointer"
              >
                {loading ? <Loader2 size={13} className="animate-spin" /> : <Calculator size={13} />}
                Calculate Preliminary Estimate
              </button>
            </form>

            {/* Quote output card */}
            {calculatedQuote && (
              <div className="p-5 bg-gradient-to-r from-blue-900/10 to-blue-500/5 dark:from-blue-950/20 dark:to-blue-900/5 rounded-2xl border border-blue-500/20 space-y-4">
                <div className="flex justify-between items-center text-[10px] font-mono border-b border-blue-500/10 pb-2">
                  <span className="text-blue-600 dark:text-blue-400 font-extrabold uppercase tracking-widest flex items-center gap-1">
                    <Sparkles size={11} className="animate-spin" /> Preliminary estimate only
                  </span>
                  <span className="text-slate-400">{calculatedQuote.id}</span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-bold block">Route distance</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">Not verified</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-bold block">Transit estimate</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{calculatedQuote.time}</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-850 flex items-center justify-between">
                  <div className="text-left space-y-0.5">
                    <span className="text-[9px] text-slate-400 uppercase font-black tracking-wide block">Preliminary estimate</span>
                    <span className="text-xl font-black text-slate-950 dark:text-white font-mono">${calculatedQuote.price}</span>
                  </div>
                  <button
                    onClick={() => onNavigate('send')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase rounded-xl transition-all flex items-center gap-1 shadow-sm"
                  >
                    Book Now
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Service options (pricing confirmed per route) */}
          <div className="lg:col-span-5 space-y-4 text-xs text-left">
            <h3 className="text-sm font-black uppercase text-slate-400 tracking-wider font-mono">
              Service options — confirm pricing
            </h3>

            <div className="space-y-4">
              {referenceRates.map((rate, idx) => (
                <div 
                  key={idx}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                        {rate.icon}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">{rate.title}</h4>
                        <p className="text-[10px] text-slate-400">{rate.description}</p>
                      </div>
                    </div>
                    <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400 font-mono">{rate.price}</span>
                  </div>

                  <ul className="grid grid-cols-1 gap-1.5 border-t border-slate-50 dark:border-slate-850 pt-3">
                    {rate.features.map((f, fidx) => (
                      <li key={fidx} className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
                        <Check size={12} className="text-emerald-500 shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

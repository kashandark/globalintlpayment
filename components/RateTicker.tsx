import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';

interface Rate {
  currency: string;
  value: number;
  prevValue: number;
  trend: 'up' | 'down';
}

const INITIAL_RATES: Record<string, number> = {
  'EUR': 0.92,
  'GBP': 0.78,
  'AED': 3.67,
  'PKR': 278.45,
  'CHF': 0.89
};

const RateTicker: React.FC = () => {
  const [rates, setRates] = useState<Rate[]>(
    Object.entries(INITIAL_RATES).map(([curr, val]) => ({
      currency: curr,
      value: val,
      prevValue: val,
      trend: 'up'
    }))
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setRates(prevRates => 
        prevRates.map(rate => {
          const fluctuation = 1 + (Math.random() * 0.001 - 0.0005);
          const newValue = parseFloat((rate.value * fluctuation).toFixed(4));
          return {
            ...rate,
            prevValue: rate.value,
            value: newValue,
            trend: newValue >= rate.value ? 'up' : 'down'
          };
        })
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Repeat items for seamless scrolling
  const tickerItems = [...rates, ...rates, ...rates];

  return (
    <div className="bg-[#001533] border-b border-white/5 py-2.5 overflow-hidden relative z-30">
      <div className="flex whitespace-nowrap animate-ticker group">
        {tickerItems.map((rate, idx) => (
          <div 
            key={`${rate.currency}-${idx}`} 
            className="inline-flex items-center gap-4 px-8 border-r border-white/10"
          >
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">USD / {rate.currency}</span>
              <span className="font-mono text-sm font-bold text-white tabular-nums">
                {rate.value.toLocaleString(undefined, { minimumFractionDigits: rate.currency === 'PKR' ? 2 : 4 })}
              </span>
            </div>
            <div className={`flex items-center gap-1 text-[10px] font-black transition-colors duration-500 ${
              rate.trend === 'up' ? 'text-green-400' : 'text-red-400'
            }`}>
              {rate.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(((rate.value - rate.prevValue) / rate.prevValue) * 100).toFixed(3)}%
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        .animate-ticker {
          display: flex;
          width: max-content;
          animation: ticker 40s linear infinite;
        }
        .animate-ticker:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};

export default RateTicker;
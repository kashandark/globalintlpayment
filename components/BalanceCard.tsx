
import React from 'react';
import { Eye, EyeOff, TrendingUp, Wallet, ShieldCheck } from 'lucide-react';

interface BalanceCardProps {
  balance: string;
  userName: string;
}

const BalanceCard: React.FC<BalanceCardProps> = ({ balance, userName }) => {
  const [isVisible, setIsVisible] = React.useState(true);

  return (
    <div className="relative overflow-hidden bg-[#002366] rounded-3xl p-8 text-white shadow-[0_20px_50px_-12px_rgba(0,35,102,0.4)]">
      {/* High-tech grid overlay */}
      <div className="absolute inset-0 opacity-5" style={{backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '24px 24px'}}></div>
      
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-600/10 rounded-full -ml-16 -mb-16 blur-2xl"></div>

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-10">
          <div>
            <p className="text-blue-200 text-xs font-bold uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              Authenticated Session: {userName}
            </p>
            <h2 className="text-2xl font-black tracking-tight">Standard Institutional Account</h2>
          </div>
          <button 
            onClick={() => setIsVisible(!isVisible)}
            className="bg-white/10 hover:bg-white/20 p-2.5 rounded-xl backdrop-blur-md transition-all border border-white/10"
          >
            {isVisible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </button>
        </div>

        <div className="space-y-1 mb-10">
          <p className="text-blue-300 text-[10px] font-bold uppercase tracking-[0.25em] opacity-80">
            Available Liquidity
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-medium text-blue-200">$</span>
            <span className="text-4xl md:text-5xl font-black tracking-tighter">
              {isVisible ? balance : '•••••••••••••••'}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <button className="flex items-center gap-2 bg-white text-[#002366] px-6 py-3 rounded-xl font-bold text-xs hover:bg-blue-50 transition-all shadow-lg shadow-white/10 active:scale-95">
            <TrendingUp className="w-4 h-4" />
            MARKET TRADING
          </button>
          <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl font-bold text-xs backdrop-blur-md transition-all border border-white/20 active:scale-95">
            <Wallet className="w-4 h-4" />
            ASSET DETAILS
          </button>
        </div>
      </div>
    </div>
  );
};

export default BalanceCard;

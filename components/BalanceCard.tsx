
import React from 'react';
import { Eye, EyeOff, TrendingUp, Wallet, ShieldCheck, Landmark, Hash, Globe } from 'lucide-react';

interface BalanceCardProps {
  balance: string;
  user: { 
    name: string; 
    bankEntity?: string;
    swiftCode?: string;
    iban?: string;
    accountNumber?: string;
    currency?: string;
  } | null;
}

const BalanceCard: React.FC<BalanceCardProps> = ({ balance, user }) => {
  const [isVisible, setIsVisible] = React.useState(true);

  const getCurrencySymbol = (currency?: string) => {
    const symbols: Record<string, string> = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'AED': 'د.إ',
      'PKR': '₨',
      'CHF': 'Fr.',
      'HKD': 'HK$',
      'QAR': 'ر.ق',
      'CNY': '¥',
      'SAR': 'SR',
      'JPY': '¥',
    };
    return symbols[currency || 'USD'] || '$';
  };

  return (
    <div className="relative overflow-hidden bg-[#002366] dark:bg-[#001a4d] rounded-3xl p-8 text-white shadow-[0_20px_50px_-12px_rgba(0,35,102,0.4)] dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.6)] transition-colors duration-300">
      {/* High-tech grid overlay */}
      <div className="absolute inset-0 opacity-5" style={{backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '24px 24px'}}></div>
      
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-600/10 rounded-full -ml-16 -mb-16 blur-2xl"></div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Side: Balance Information */}
        <div className="border-b lg:border-b-0 lg:border-r border-white/10 pb-8 lg:pb-0 lg:pr-8">
          <div className="flex justify-between items-start mb-10">
            <div>
              <p className="text-blue-200 text-xs font-bold uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                Authenticated Session: {user?.name || 'Member'}
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
              <span className="text-2xl font-medium text-blue-200">{getCurrencySymbol(user?.currency)}</span>
              <span className="text-4xl md:text-5xl font-black tracking-tighter">
                {isVisible ? balance : '•••••••••••••••'}
              </span>
              {user?.currency && (
                <span className="text-xs font-bold text-blue-300 ml-1 opacity-60">{user.currency}</span>
              )}
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

        {/* Right Side: Institutional Sender Details */}
        <div className="flex flex-col justify-center space-y-6">
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
            <p className="text-[10px] font-black text-blue-300 uppercase tracking-[0.3em] mb-4">Identity Credentials</p>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-500/20 rounded-lg"><Landmark className="w-4 h-4 text-blue-300" /></div>
                <div>
                  <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Bank Entity</p>
                  <p className="text-sm font-bold text-white leading-tight">{user?.bankEntity || 'GIBK CENTRAL NODE'}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-500/20 rounded-lg"><Hash className="w-4 h-4 text-blue-300" /></div>
                <div>
                  <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Account & SWIFT</p>
                  <div className="flex flex-col">
                    <span className="text-xs font-mono font-bold text-blue-100">ACC: {user?.accountNumber || 'PENDING'}</span>
                    <span className="text-xs font-mono font-bold text-blue-100">BIC: {user?.swiftCode || 'PENDING'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-500/20 rounded-lg"><Globe className="w-4 h-4 text-blue-300" /></div>
                <div>
                  <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">IBAN Identification</p>
                  <p className="text-xs font-mono font-bold text-green-300 tracking-wider">{user?.iban || 'PENDING PROVISIONING'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BalanceCard;

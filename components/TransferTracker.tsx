
import React, { useState } from 'react';
import { 
  Search, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ShieldCheck, 
  Globe, 
  Activity,
  ChevronRight,
  Loader2,
  FileText
} from 'lucide-react';
import { Transaction, UserAccount } from '../api';

interface TransferTrackerProps {
  transactions: Transaction[];
  onViewReceipt: (tx: Transaction) => void;
  accounts?: UserAccount[];
}

const TransferTracker: React.FC<TransferTrackerProps> = ({ transactions, onViewReceipt, accounts = [] }) => {
  const [searchId, setSearchId] = useState('');
  const [trackedTx, setTrackedTx] = useState<Transaction | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return;

    setIsSearching(true);
    setError(null);
    setTrackedTx(null);

    // Simulate network delay for "Institutional Tracking" feel
    setTimeout(() => {
      const found = transactions.find(tx => 
        tx.referenceId?.toLowerCase() === searchId.toLowerCase() || 
        tx.id.toString().toLowerCase() === searchId.toLowerCase()
      );

      if (found) {
        setTrackedTx(found);
      } else {
        setError('No record found for this Reference ID. Please verify and try again.');
      }
      setIsSearching(false);
    }, 1200);
  };

  const getStatusSteps = (tx: Transaction) => {
    const isSwift = !tx.isSepa && !tx.isHsbcGlobal && !tx.isDirectDebit && !tx.isRaast;
    const isInstant = tx.isHsbcGlobal || tx.isRaast || (tx.isSepa && tx.timeframe?.toLowerCase().includes('10 seconds'));
    const isDirectDebit = tx.isDirectDebit;
    
    if (tx.isRaast) {
      const raastSteps = [
        { id: 1, label: 'Authorized', desc: 'Transaction signed and verified', icon: ShieldCheck },
        { id: 2, label: 'Gateway Handshake', desc: `Connected to ${tx.gatewayBank || 'RAAST HUB'}`, icon: Activity },
        { id: 3, label: 'Core Validation', desc: 'Beneficiary account verified', icon: ShieldCheck },
        { id: 4, label: 'Settled', desc: 'Funds reached destination hub', icon: Globe },
        { id: 5, label: 'Cleared', desc: 'Funds credited to beneficiary', icon: CheckCircle2 },
      ];
      return { steps: raastSteps, activeStep: tx.status === 'Settled' || tx.status === 'Cleared' ? 5 : 2 };
    }

    const steps = [
      { id: 1, label: 'Authorized', desc: 'Transaction signed and verified', icon: ShieldCheck },
      { id: 2, label: 'Processing', desc: 'Clearing through global nodes', icon: Activity },
    ];

    if (isSwift) {
      steps.push({ id: 3, label: 'Intermediary', desc: 'Correspondent bank relay', icon: Globe });
      steps.push({ id: 4, label: 'Settled', desc: 'Funds reached destination hub', icon: Globe });
      steps.push({ id: 5, label: 'Cleared', desc: 'Funds credited to beneficiary', icon: CheckCircle2 });
    } else {
      steps.push({ id: 3, label: 'Settled', desc: 'Funds reached destination hub', icon: Globe });
      steps.push({ id: 4, label: 'Cleared', desc: 'Funds credited to beneficiary', icon: CheckCircle2 });
    }

    // Calculate active step based on time elapsed
    let activeStep = 1;
    const now = new Date();
    const created = tx.createdAt ? new Date(tx.createdAt) : new Date(tx.date);
    const diffMs = now.getTime() - created.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (isInstant) {
      activeStep = steps.length; // Always cleared for instant
    } else if (isSwift) {
      if (diffDays === 0) activeStep = 2; // Processing on Day 0
      if (diffDays === 1) activeStep = 2; // Still processing on Day 1
      if (diffDays === 2) activeStep = 3; // Intermediary on Day 2
      if (diffDays === 3) activeStep = 4; // Settled on Day 3
      if (diffDays >= 4) activeStep = 5;  // Cleared on Day 4+
    } else if (isDirectDebit) {
      if (diffDays === 0) activeStep = 2; // Processing on Day 0
      if (diffDays === 1) activeStep = 3; // Settled on Day 1
      if (diffDays >= 2) activeStep = 4;  // Cleared on Day 2+
    } else {
      // SEPA Standard
      if (diffDays === 0) activeStep = 2; // Processing on Day 0
      if (diffDays >= 1) activeStep = 4;  // Cleared on Day 1+
    }

    // Override if status is explicitly 'Cleared' or 'Pending'
    if (tx.status === 'Cleared') activeStep = steps.length;
    if (tx.status === 'Pending' && diffDays === 0) activeStep = 1;

    return { steps, activeStep };
  };

  const { steps, activeStep } = trackedTx ? getStatusSteps(trackedTx) : { steps: [], activeStep: 1 };
  const currentStatus = trackedTx ? (steps.find(s => s.id === activeStep)?.label || trackedTx.status) : '';

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Search Section */}
      <div className="bg-white dark:bg-[#111] rounded-[2.5rem] p-8 shadow-xl border border-gray-100 dark:border-gray-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        
        <div className="relative z-10">
          <h2 className="text-2xl font-black text-[#002366] dark:text-white uppercase tracking-tight mb-2">Global Transfer Tracker</h2>
          <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-8">Real-time ISO-20022 Node Monitoring</p>
          
          <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input 
                type="text" 
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder="Enter Reference ID (e.g. GIBK-12345678)"
                className="w-full pl-12 pr-4 py-5 bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-100 dark:border-gray-800 rounded-2xl text-sm font-bold text-black dark:text-white focus:bg-white dark:focus:bg-[#1a1a1a] focus:border-[#002366] dark:focus:border-blue-600 outline-none transition-all uppercase"
              />
            </div>
            <button 
              type="submit"
              disabled={isSearching || !searchId.trim()}
              className="px-8 py-5 bg-[#002366] dark:bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-900/20 hover:bg-blue-900 dark:hover:bg-blue-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95"
            >
              {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Activity className="w-5 h-5" />}
              Track Transfer
            </button>
          </form>

          {error && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 animate-in shake duration-300">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-[11px] font-black uppercase tracking-widest">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Result Section */}
      {trackedTx && (
        <div className="space-y-6 animate-in zoom-in-95 duration-500">
          <div className="bg-white dark:bg-[#111] rounded-[2.5rem] p-8 shadow-xl border border-gray-100 dark:border-gray-800">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    currentStatus === 'Cleared' || currentStatus === 'Settled' 
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-900/30' 
                      : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30'
                  }`}>
                    {currentStatus}
                  </span>
                  <span className="text-[10px] font-mono font-black text-gray-400 dark:text-gray-500 uppercase">REF: {trackedTx.referenceId}</span>
                  {trackedTx.utr && (
                    <span className="text-[10px] font-mono font-black text-gray-400 dark:text-gray-500 uppercase ml-2">UTR: {trackedTx.utr}</span>
                  )}
                  {trackedTx.raastId && (
                    <span className="text-[10px] font-mono font-black text-green-600 dark:text-green-400 uppercase ml-2">RAAST ID: {trackedTx.raastId}</span>
                  )}
                </div>
                <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight uppercase">{trackedTx.recipientName || trackedTx.name}</h3>
                <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">
                  {trackedTx.date} • {trackedTx.paymentReason || 'Institutional Settlement'}
                  {trackedTx.accountId && accounts.find(a => a.id === trackedTx.accountId) && ` • VIA: ${accounts.find(a => a.id === trackedTx.accountId)?.account_name}`}
                </p>
              </div>
              <div className="text-left md:text-right">
                <p className="text-4xl font-black text-[#002366] dark:text-white tracking-tighter">
                  {trackedTx.currency} {parseFloat(trackedTx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em] mt-2">Total Settlement Value</p>
              </div>
            </div>

            {/* Progress Tracker */}
            <div className="relative px-4 py-8">
              <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 dark:bg-gray-800 -translate-y-1/2 rounded-full"></div>
              <div 
                className="absolute top-1/2 left-0 h-1 bg-blue-600 -translate-y-1/2 rounded-full transition-all duration-1000"
                style={{ width: `${((activeStep - 1) / (steps.length - 1)) * 100}%` }}
              ></div>

              <div className="relative flex justify-between items-center">
                {steps.map((step) => {
                  const isActive = step.id <= activeStep;
                  const isCurrent = step.id === activeStep;
                  const Icon = step.icon;

                  return (
                    <div key={step.id} className="flex flex-col items-center group">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 border-4 ${
                        isCurrent 
                          ? 'bg-blue-600 text-white border-blue-100 dark:border-blue-900/30 scale-110 shadow-xl shadow-blue-600/20' 
                          : isActive 
                            ? 'bg-green-500 text-white border-green-100 dark:border-green-900/30' 
                            : 'bg-white dark:bg-[#1a1a1a] text-gray-300 dark:text-gray-700 border-gray-100 dark:border-gray-800'
                      }`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="mt-4 text-center">
                        <p className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'}`}>
                          {step.label}
                        </p>
                        <p className="text-[8px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tighter mt-1 hidden sm:block">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t border-gray-50 dark:border-gray-800">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Est. Completion</p>
                  <p className="text-xs font-black text-gray-900 dark:text-white uppercase">{trackedTx.timeframe || 'Processing'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Current Node</p>
                  <p className="text-xs font-black text-gray-900 dark:text-white uppercase">GIBK-LN-09 (LONDON)</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Security Protocol</p>
                  <p className="text-xs font-black text-green-600 dark:text-green-400 uppercase">ISO-20022 SECURED</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={() => onViewReceipt(trackedTx)}
              className="flex-1 flex items-center justify-center gap-3 py-5 bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-2xl text-[11px] font-black uppercase tracking-widest text-[#002366] dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all active:scale-95 shadow-sm"
            >
              <FileText className="w-5 h-5" />
              View Full Document Bundle
            </button>
            <button 
              className="flex-1 flex items-center justify-center gap-3 py-5 bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-2xl text-[11px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all active:scale-95 shadow-sm"
            >
              <Globe className="w-5 h-5" />
              View on Global Ledger
            </button>
          </div>
        </div>
      )}

      {/* Info Section */}
      {!trackedTx && !isSearching && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { 
              title: 'Real-time Sync', 
              desc: 'Direct connection to SWIFT and SEPA clearing nodes for millisecond updates.',
              icon: Activity 
            },
            { 
              title: 'ISO-20022 Ready', 
              desc: 'Full compliance with the latest global financial messaging standards.',
              icon: ShieldCheck 
            },
            { 
              title: 'Node Transparency', 
              desc: 'Track your funds as they move through our global liquidity network.',
              icon: Globe 
            },
          ].map((item, i) => (
            <div key={i} className="bg-white/50 dark:bg-gray-900/30 backdrop-blur-sm border border-gray-100 dark:border-gray-800 p-6 rounded-3xl">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center text-[#002366] dark:text-blue-400 mb-4">
                <item.icon className="w-5 h-5" />
              </div>
              <h4 className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-widest mb-2">{item.title}</h4>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TransferTracker;

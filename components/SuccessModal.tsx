
import React from 'react';
import { X, CheckCircle2, Printer, Layers, Clock, ShieldCheck } from 'lucide-react';
import { Transaction } from '../App';

interface SuccessModalProps {
  onClose: () => void;
  transaction: Transaction;
  onViewReceipt: () => void;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  'USD': '$',
  'EUR': '€',
  'GBP': '£',
  'AED': 'د.إ',
  'PKR': '₨',
  'CHF': 'Fr.',
  'HKD': 'HK$',
  'QAR': 'ر.ق',
};

const SuccessModal: React.FC<SuccessModalProps> = ({ onClose, transaction, onViewReceipt }) => {
  const { amount, currency, referenceId, timeframe, fee, totalSettlement, paymentReason } = transaction;
  const symbol = CURRENCY_SYMBOLS[currency] || '$';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md" onClick={onClose}></div>
      
      <div className="relative bg-white dark:bg-[#111] rounded-[2.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.4)] w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20 dark:border-gray-800">
        <div className="h-3 bg-green-500 w-full"></div>
        
        <div className="p-10">
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center text-green-500 dark:text-green-400 border-2 border-green-100 dark:border-green-900/30 shadow-inner relative">
              <div className="absolute inset-0 bg-green-400/10 rounded-full animate-ping"></div>
              <CheckCircle2 className="w-12 h-12 relative z-10" />
            </div>
          </div>
          
          <h2 className="text-2xl font-black text-center text-[#002366] dark:text-white mb-1 tracking-tight uppercase">Transfer Authorized</h2>
          <p className="text-center text-gray-500 dark:text-gray-400 text-[10px] font-black uppercase tracking-[0.3em] mb-8">Institutional Funds Dispatched</p>
          
          <div className="bg-[#f8fafc] dark:bg-gray-800/50 rounded-[2rem] p-8 mb-8 border border-gray-100 dark:border-gray-800 space-y-4 shadow-inner">
            <div className="flex justify-between items-center border-b border-gray-200/60 dark:border-gray-700/60 pb-3">
              <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Net Principal</span>
              <span className="text-lg font-black text-gray-700 dark:text-gray-200">{symbol}{parseFloat(amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-200/60 dark:border-gray-700/60 pb-3">
              <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Settlement Fee</span>
              <span className="text-sm font-black text-red-600 dark:text-red-400">+{symbol}{fee}</span>
            </div>
            <div className="flex justify-between items-center border-b-2 border-dashed border-gray-300 dark:border-gray-700 pb-4 pt-2">
              <span className="text-[10px] font-black text-blue-900 dark:text-blue-400 uppercase tracking-widest">Total Asset Cost</span>
              <span className="text-2xl font-black text-[#002366] dark:text-white">{symbol}{totalSettlement}</span>
            </div>
            
            <div className="pt-2 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Payment Purpose</span>
                <span className="text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase truncate max-w-[150px]">{paymentReason || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Est. Timeframe</span>
                <span className="text-[10px] font-black text-blue-700 dark:text-blue-400 uppercase flex items-center gap-1.5">
                  <Clock className="w-3 h-3" /> {timeframe || 'Processing'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Ref ID</span>
                <span className="text-[9px] font-mono font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-900/30 uppercase tracking-tighter">{referenceId}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 mb-8">
            <button 
              onClick={onViewReceipt}
              className="flex items-center justify-center gap-3 py-5 bg-[#002366] dark:bg-blue-700 text-white rounded-2xl hover:bg-blue-900 dark:hover:bg-blue-600 transition-all shadow-xl shadow-blue-900/20 group active:scale-95"
            >
              <Layers className="w-5 h-5 group-hover:scale-110 transition-transform" /> 
              <span className="text-[11px] font-black tracking-widest uppercase">Institutional Document Bundle</span>
            </button>
          </div>
          
          <button
            onClick={onClose}
            className="w-full py-5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-black rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:scale-[0.98] tracking-[0.3em] text-[10px]"
          >
            DISMISS NOTIFICATION
          </button>
        </div>

        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default SuccessModal;


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
};

const SuccessModal: React.FC<SuccessModalProps> = ({ onClose, transaction, onViewReceipt }) => {
  const { amount, currency, referenceId, timeframe, fee, totalSettlement, paymentReason } = transaction;
  const symbol = CURRENCY_SYMBOLS[currency] || '$';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md" onClick={onClose}></div>
      
      <div className="relative bg-white rounded-[2.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.4)] w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
        <div className="h-3 bg-green-500 w-full"></div>
        
        <div className="p-10">
          <div className="flex justify-center mb-8">
            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center text-green-500 border-2 border-green-100 shadow-inner relative">
              <div className="absolute inset-0 bg-green-400/10 rounded-full animate-ping"></div>
              <CheckCircle2 className="w-12 h-12 relative z-10" />
            </div>
          </div>
          
          <h2 className="text-2xl font-black text-center text-[#002366] mb-1 tracking-tight uppercase">Transfer Authorized</h2>
          <p className="text-center text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] mb-8">Institutional Funds Dispatched</p>
          
          <div className="bg-[#f8fafc] rounded-[2rem] p-8 mb-8 border border-gray-100 space-y-4 shadow-inner">
            <div className="flex justify-between items-center border-b border-gray-200/60 pb-3">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Net Principal</span>
              <span className="text-lg font-black text-gray-700">{symbol}{parseFloat(amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-200/60 pb-3">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Settlement Fee</span>
              <span className="text-sm font-black text-red-600">+{symbol}{fee}</span>
            </div>
            <div className="flex justify-between items-center border-b-2 border-dashed border-gray-300 pb-4 pt-2">
              <span className="text-[10px] font-black text-blue-900 uppercase tracking-widest">Total Asset Cost</span>
              <span className="text-2xl font-black text-[#002366]">{symbol}{totalSettlement}</span>
            </div>
            
            <div className="pt-2 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Payment Purpose</span>
                <span className="text-[10px] font-black text-gray-700 uppercase truncate max-w-[150px]">{paymentReason || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Est. Timeframe</span>
                <span className="text-[10px] font-black text-blue-700 uppercase flex items-center gap-1.5">
                  <Clock className="w-3 h-3" /> {timeframe || 'Processing'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Ref ID</span>
                <span className="text-[9px] font-mono font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 uppercase tracking-tighter">{referenceId}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 mb-8">
            <button 
              onClick={onViewReceipt}
              className="flex items-center justify-center gap-3 py-5 bg-[#002366] text-white rounded-2xl hover:bg-blue-900 transition-all shadow-xl shadow-blue-900/20 group active:scale-95"
            >
              <Layers className="w-5 h-5 group-hover:scale-110 transition-transform" /> 
              <span className="text-[11px] font-black tracking-widest uppercase">Institutional Document Bundle</span>
            </button>
          </div>
          
          <button
            onClick={onClose}
            className="w-full py-5 bg-gray-100 text-gray-500 font-black rounded-2xl hover:bg-gray-200 transition-all active:scale-[0.98] tracking-[0.3em] text-[10px]"
          >
            DISMISS NOTIFICATION
          </button>
        </div>

        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-gray-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-all"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default SuccessModal;

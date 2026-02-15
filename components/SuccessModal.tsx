
import React from 'react';
import { X, CheckCircle2, Printer, Layers } from 'lucide-react';
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
};

const SuccessModal: React.FC<SuccessModalProps> = ({ onClose, transaction, onViewReceipt }) => {
  const { amount, name: bank, currency, referenceId } = transaction;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md" onClick={onClose}></div>
      
      <div className="relative bg-white rounded-[2.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.4)] w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
        <div className="h-3 bg-green-500 w-full"></div>
        
        <div className="p-10">
          <div className="flex justify-center mb-8">
            <div className="w-28 h-28 bg-green-50 rounded-full flex items-center justify-center text-green-500 border-2 border-green-100 shadow-inner relative">
              <div className="absolute inset-0 bg-green-400/10 rounded-full animate-ping"></div>
              <CheckCircle2 className="w-14 h-14 relative z-10" />
            </div>
          </div>
          
          <h2 className="text-2xl font-black text-center text-[#002366] mb-1 tracking-tight uppercase">Transfer Authorized</h2>
          <p className="text-center text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] mb-10">Institutional Funds Dispatched</p>
          
          <div className="bg-[#f8fafc] rounded-[2rem] p-8 mb-10 border border-gray-100 space-y-5 shadow-inner">
            <div className="flex justify-between items-center border-b border-gray-200/60 pb-4">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</span>
              <span className="text-2xl font-black text-[#002366]">{CURRENCY_SYMBOLS[currency] || '$'}{parseFloat(amount).toLocaleString(undefined, {minimumFractionDigits: 2})} {currency}</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-200/60 pb-4">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Target Node</span>
              <span className="text-xs font-black text-gray-700 uppercase tracking-tight">{bank}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ref ID</span>
              <span className="text-[10px] font-mono font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 uppercase tracking-tighter">{referenceId}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 mb-8">
            <button 
              onClick={onViewReceipt}
              className="flex items-center justify-center gap-3 py-5 bg-[#002366] text-white rounded-2xl hover:bg-blue-900 transition-all shadow-xl shadow-blue-900/20 group active:scale-95"
            >
              <Layers className="w-5 h-5 group-hover:scale-110 transition-transform" /> 
              <span className="text-[12px] font-black tracking-widest uppercase">View/Print Full Bundle</span>
            </button>
            <button 
              onClick={() => window.print()}
              className="flex items-center justify-center gap-3 py-4 bg-gray-50 text-gray-600 rounded-2xl hover:bg-gray-100 transition-colors border-2 border-gray-100 active:scale-95"
            >
              <Printer className="w-4 h-4" /> <span className="text-[11px] font-black tracking-widest uppercase">Quick Print</span>
            </button>
          </div>
          
          <button
            onClick={onClose}
            className="w-full py-5 bg-gray-900 text-white font-black rounded-2xl hover:bg-black transition-all shadow-xl active:scale-[0.98] tracking-[0.3em] text-xs"
          >
            DISMISS PORTAL
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

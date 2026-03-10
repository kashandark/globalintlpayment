
import React from 'react';
import { 
  ShieldCheck, 
  X, 
  ArrowRight, 
  Building2, 
  Globe, 
  Activity, 
  Clock, 
  AlertCircle,
  CheckCircle2,
  Send,
  Info
} from 'lucide-react';

interface TransferConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  details: {
    amount: string;
    currency: string;
    recipientName: string;
    recipientIban: string;
    bic: string;
    fee: string;
    timeframe: string;
    paymentReason: string;
    eurEquivalent: string;
    method: string;
  };
}

const TransferConfirmationModal: React.FC<TransferConfirmationModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  details 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose}
      ></div>
      
      <div className="relative w-full max-w-lg bg-white dark:bg-[#111] rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="bg-[#002366] dark:bg-blue-700 p-8 text-white relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-4 mb-2">
            <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-md">
              <ShieldCheck className="w-6 h-6 text-blue-100" />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight">Authorization Required</h3>
              <p className="text-[10px] text-blue-300 dark:text-blue-200 font-bold uppercase tracking-[0.2em]">Final Institutional Review</p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* Amount Summary */}
          <div className="text-center py-6 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border border-gray-100 dark:border-gray-800">
            <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em] mb-2">Total Settlement Amount</p>
            <h4 className="text-4xl font-black text-[#002366] dark:text-white tracking-tighter">
              {details.currency} {parseFloat(details.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h4>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">≈ €{details.eurEquivalent} EUR</span>
              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
              <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Fee: {details.fee} {details.currency}</span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-start gap-4 p-4 border border-gray-100 dark:border-gray-800 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Beneficiary Entity</p>
                <p className="text-sm font-black text-gray-900 dark:text-white uppercase truncate">{details.recipientName}</p>
                <p className="text-[10px] font-mono text-gray-500 dark:text-gray-400 truncate mt-0.5">{details.recipientIban}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 border border-gray-100 dark:border-gray-800 rounded-2xl">
                <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 shrink-0">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Network</p>
                  <p className="text-[10px] font-black text-gray-900 dark:text-white uppercase">{details.method}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 border border-gray-100 dark:border-gray-800 rounded-2xl">
                <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Timeframe</p>
                  <p className="text-[10px] font-black text-gray-900 dark:text-white uppercase">{details.timeframe}</p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 border border-gray-100 dark:border-gray-800 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 shrink-0">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Payment Purpose</p>
                <p className="text-xs font-bold text-gray-900 dark:text-white uppercase">{details.paymentReason}</p>
              </div>
            </div>
          </div>

          {/* Security Warning */}
          <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[10px] text-amber-800 dark:text-amber-200 font-bold leading-relaxed">
              By confirming, you authorize the immediate clearing of these funds through the global banking network. This action is irreversible once the ISO-20022 message is broadcast.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button 
              onClick={onClose}
              className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:scale-95"
            >
              Cancel Authorization
            </button>
            <button 
              onClick={onConfirm}
              className="flex-1 py-4 bg-[#002366] dark:bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-900/20 hover:bg-blue-900 dark:hover:bg-blue-700 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <Send className="w-4 h-4" />
              Confirm & Broadcast
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransferConfirmationModal;

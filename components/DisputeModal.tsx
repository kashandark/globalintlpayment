
import React, { useState } from 'react';
import { X, ShieldAlert, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { api, Transaction } from '../api';

interface DisputeModalProps {
  transaction: Transaction;
  onClose: () => void;
  onSuccess: () => void;
}

const DisputeModal: React.FC<DisputeModalProps> = ({ transaction, onClose, onSuccess }) => {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submittedDisputeId, setSubmittedDisputeId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return;

    setIsSubmitting(true);
    setError(null);

    try {
      console.log(`Submitting dispute for transaction ID: ${transaction.id}`);
      const result = await api.submitDispute(transaction.id.toString(), reason, details);
      setSubmittedDisputeId(result.id);
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit dispute');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-2">Dispute Submitted</h2>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Your request is being reviewed by our compliance team. Case ID: {submittedDisputeId || 'PENDING'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden my-8">
        <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Initiate Dispute</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Transaction Ref: {transaction.referenceId}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-gray-100 dark:border-zinc-800">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Transaction Details</span>
                <span className="text-[10px] font-mono font-bold text-gray-500">{transaction.date}</span>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{transaction.recipientName || transaction.name}</p>
                  <p className="text-[10px] font-mono text-gray-500">{transaction.recipient}</p>
                </div>
                <p className="text-lg font-black text-gray-900 dark:text-white">-{transaction.amount} {transaction.currency}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Reason for Dispute</label>
              <select
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-gray-50 dark:bg-zinc-800 border-2 border-transparent focus:border-red-500 rounded-xl p-4 text-sm font-bold text-gray-900 dark:text-white transition-all outline-none appearance-none"
              >
                <option value="">Select a reason</option>
                <option value="unauthorized">Unauthorized Transaction</option>
                <option value="not_received">Goods/Services Not Received</option>
                <option value="duplicate">Duplicate Charge</option>
                <option value="incorrect_amount">Incorrect Amount</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Additional Details</label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Please provide more information about your claim..."
                rows={4}
                className="w-full bg-gray-50 dark:bg-zinc-800 border-2 border-transparent focus:border-red-500 rounded-xl p-4 text-sm font-medium text-gray-900 dark:text-white transition-all outline-none resize-none"
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 rounded-xl text-sm font-black uppercase tracking-widest text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reason}
              className="flex-[2] bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-4 rounded-xl text-sm font-black uppercase tracking-widest shadow-lg shadow-red-600/20 transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Submit Dispute'
              )}
            </button>
          </div>
        </form>

        <div className="p-6 bg-gray-50 dark:bg-zinc-800/30 border-t border-gray-100 dark:border-zinc-800">
          <p className="text-[9px] font-bold text-gray-400 uppercase leading-relaxed text-center">
            By submitting this dispute, you authorize Global International Banking to investigate the transaction. False claims may result in account suspension.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DisputeModal;

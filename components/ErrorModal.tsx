
import React from 'react';
import { X, ShieldAlert, AlertTriangle, RefreshCcw, Terminal } from 'lucide-react';

interface ErrorModalProps {
  onClose: () => void;
  message?: string;
}

const ErrorModal: React.FC<ErrorModalProps> = ({ onClose, message }) => {
  const [showLogs, setShowLogs] = React.useState(false);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 sm:px-0">
      <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-white dark:bg-[#111] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header decoration */}
        <div className="h-2 bg-red-600 w-full"></div>
        
        <div className="p-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 animate-pulse">
              <ShieldAlert className="w-8 h-8" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">Transfer Error</h2>
          
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-200 leading-relaxed font-medium">
                {message || "Security Alert: Remote server rejected the connection due to high-volume encryption mismatch. Funds returned to ASDI account."}
              </p>
            </div>
          </div>

          {showLogs && (
            <div className="mb-6 bg-gray-900 rounded-xl p-4 font-mono text-[10px] text-red-400 border border-red-900/30 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2 mb-2 border-b border-red-900/20 pb-1 opacity-50">
                <Terminal className="w-3 h-3" />
                <span>[ERROR_TRACE_LOG]</span>
              </div>
              <div className="space-y-1">
                <div>&gt; TIMESTAMP: {new Date().toISOString()}</div>
                <div>&gt; STATUS: 503_SERVICE_UNAVAILABLE</div>
                <div>&gt; MESSAGE: {message || "ENCRYPTION_LAYER_MISMATCH"}</div>
                <div>&gt; ACTION: ROLLBACK_INITIATED</div>
                <div className="text-white">&gt; FUNDS_STATUS: RESTORED_TO_SOURCE</div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={onClose}
              className="w-full py-4 bg-gray-900 dark:bg-white dark:text-black text-white font-bold rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-lg active:scale-[0.98]"
            >
              ACKNOWLEDGE
            </button>
            <button
              onClick={() => setShowLogs(!showLogs)}
              className="w-full py-3 text-gray-500 dark:text-gray-400 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCcw className="w-4 h-4" />
              {showLogs ? 'Hide Server Logs' : 'Check Server Logs'}
            </button>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ErrorModal;

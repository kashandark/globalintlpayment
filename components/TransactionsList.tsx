
import React, { useState, useMemo } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Search, 
  FileText, 
  Filter, 
  X, 
  Calendar, 
  DollarSign,
  ArrowRight,
  Printer
} from 'lucide-react';
import { Transaction } from '../App';

interface TransactionsListProps {
  transactions: Transaction[];
  onViewReceipt: (tx: Transaction) => void;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  'USD': '$',
  'EUR': '€',
  'GBP': '£',
  'AED': 'د.إ',
  'PKR': '₨',
  'CHF': 'Fr.',
};

const TransactionsList: React.FC<TransactionsListProps> = ({ transactions, onViewReceipt }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Advanced Filter State
  const [filterType, setFilterType] = useState<'all' | 'in' | 'out'>('all');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // 1. Search Query (Name, Status, RefID)
      const matchesSearch = 
        tx.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tx.referenceId && tx.referenceId.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      // 2. Transaction Type
      if (filterType !== 'all' && tx.type !== filterType) return false;

      // 3. Amount Range
      const val = parseFloat(tx.amount.replace(/,/g, ''));
      if (minAmount && val < parseFloat(minAmount)) return false;
      if (maxAmount && val > parseFloat(maxAmount)) return false;

      // 4. Date Range
      if (dateStart || dateEnd) {
        const txDate = new Date(tx.date);
        if (dateStart && txDate < new Date(dateStart)) return false;
        if (dateEnd && txDate > new Date(dateEnd)) return false;
      }

      return true;
    });
  }, [transactions, searchQuery, filterType, dateStart, dateEnd, minAmount, maxAmount]);

  const resetFilters = () => {
    setFilterType('all');
    setDateStart('');
    setDateEnd('');
    setMinAmount('');
    setMaxAmount('');
    setSearchQuery('');
  };

  const activeFiltersCount = [
    filterType !== 'all',
    dateStart !== '',
    dateEnd !== '',
    minAmount !== '',
    maxAmount !== ''
  ].filter(Boolean).length;

  return (
    <div className="bg-white dark:bg-[#111] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col max-h-[700px] transition-colors duration-300">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0 bg-white dark:bg-[#111] z-10 transition-colors duration-300">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-gray-900 dark:text-white">Transaction History</h3>
          {activeFiltersCount > 0 && (
            <span className="bg-[#002366] dark:bg-blue-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition-all border ${
              showFilters || activeFiltersCount > 0 
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-[#002366] dark:text-blue-400' 
                : 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Filter className="w-4 h-4" />
          </button>
          <button className="text-[#002366] dark:text-blue-400 text-[10px] font-black hover:underline flex items-center gap-1 uppercase tracking-widest bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg border border-gray-100 dark:border-gray-700 transition-colors">
             <FileText className="w-3.5 h-3.5" /> Statement
          </button>
        </div>
      </div>

      {/* Advanced Filter Panel */}
      {showFilters && (
        <div className="p-6 bg-gray-50/80 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800 space-y-4 animate-in slide-in-from-top-2 duration-200 transition-colors">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Transfer Direction</label>
              <div className="flex p-1 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl transition-colors">
                {(['all', 'in', 'out'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilterType(t)}
                    className={`flex-1 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${
                      filterType === t 
                        ? 'bg-[#002366] dark:bg-blue-600 text-white shadow-sm' 
                        : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                    }`}
                  >
                    {t === 'all' ? 'All' : t === 'in' ? 'Credit' : 'Debit'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Value Range</label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-300 dark:text-gray-600" />
                  <input 
                    type="number" 
                    placeholder="Min" 
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-blue-500 dark:text-white transition-colors"
                  />
                </div>
                <ArrowRight className="w-3 h-3 text-gray-300 dark:text-gray-600 shrink-0" />
                <div className="relative flex-1">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-300 dark:text-gray-600" />
                  <input 
                    type="number" 
                    placeholder="Max" 
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-blue-500 dark:text-white transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Processing Window</label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-300 dark:text-gray-600" />
                  <input 
                    type="date" 
                    value={dateStart}
                    onChange={(e) => setDateStart(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-blue-500 dark:text-white transition-colors"
                  />
                </div>
                <div className="relative flex-1">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-300 dark:text-gray-600" />
                  <input 
                    type="date" 
                    value={dateEnd}
                    onChange={(e) => setDateEnd(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-blue-500 dark:text-white transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center pt-2">
             <button 
               onClick={resetFilters}
               className="text-[10px] font-black text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 flex items-center gap-1 uppercase tracking-widest"
             >
               <X className="w-3 h-3" /> Clear All Filters
             </button>
             <button 
               onClick={() => setShowFilters(false)}
               className="bg-[#002366] dark:bg-blue-600 text-white text-[10px] font-black px-4 py-2 rounded-lg uppercase tracking-widest hover:bg-blue-900 dark:hover:bg-blue-700 transition-colors"
             >
               Apply Criteria
             </button>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="p-4 bg-gray-50/30 dark:bg-gray-900/30 border-b border-gray-100 dark:border-gray-800 shrink-0 transition-colors">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
          <input 
            type="text" 
            placeholder="Search by recipient, status, or reference ID..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-medium text-black dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-[#002366] dark:focus:border-blue-600 outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar dark:bg-[#111] transition-colors">
        {filteredTransactions.length > 0 ? (
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {filteredTransactions.map((tx) => (
              <div 
                key={tx.id} 
                className="p-4 hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-all flex items-center gap-4 cursor-pointer group border-l-4 border-transparent hover:border-[#002366] dark:hover:border-blue-600"
                onClick={() => onViewReceipt(tx)}
              >
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all group-hover:rotate-12 ${
                  tx.type === 'in' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 shadow-sm border border-green-100 dark:border-green-900/30' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 shadow-sm border border-red-100 dark:border-red-900/30'
                }`}>
                  {tx.type === 'in' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-black text-gray-900 dark:text-white truncate group-hover:text-[#002366] dark:group-hover:text-blue-400 tracking-tight">{tx.name}</p>
                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full border ${
                      tx.status === 'Cleared' || tx.status === 'Settled' 
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/30 text-green-700 dark:text-green-400' 
                        : 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30 text-blue-700 dark:text-blue-400'
                    }`}>
                      {tx.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-tighter mt-0.5">
                    {tx.date} {tx.referenceId && `• REF: ${tx.referenceId}`} {tx.recipientAccountNumber && `• ACC: ${tx.recipientAccountNumber}`}
                  </p>
                </div>
                <div className="text-right flex items-center gap-4">
                  <div className="text-right">
                    <p className={`text-sm font-black ${tx.type === 'in' ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                      {tx.type === 'in' ? '+' : '-'} {CURRENCY_SYMBOLS[tx.currency] || '$'}{parseFloat(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[9px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-[0.2em]">{tx.currency}</p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewReceipt(tx);
                      }}
                      className="p-2.5 text-gray-400 dark:text-gray-500 hover:text-[#002366] dark:hover:text-blue-400 hover:bg-white dark:hover:bg-gray-800 rounded-xl transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-700 shadow-sm"
                      title="View/Print Document Bundle"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-20 text-center opacity-60">
            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-gray-300 dark:text-gray-600" />
            </div>
            <p className="text-gray-900 dark:text-white font-black text-xs uppercase tracking-widest">No matching records</p>
            <button 
              onClick={resetFilters}
              className="mt-6 text-[#002366] dark:text-blue-400 text-[10px] font-black underline uppercase tracking-widest"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center shrink-0 transition-colors">
        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
          Showing {filteredTransactions.length} of {transactions.length} entries
        </span>
        <div className="flex items-center gap-1.5">
           <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
           <span className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Live Ledger Sync Active</span>
        </div>
      </div>
    </div>
  );
};

export default TransactionsList;

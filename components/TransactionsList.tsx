
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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full max-h-[700px]">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white z-10">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-gray-900">Transaction History</h3>
          {activeFiltersCount > 0 && (
            <span className="bg-[#002366] text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition-all border ${
              showFilters || activeFiltersCount > 0 
                ? 'bg-blue-50 border-blue-200 text-[#002366]' 
                : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100'
            }`}
          >
            <Filter className="w-4 h-4" />
          </button>
          <button className="text-[#002366] text-[10px] font-black hover:underline flex items-center gap-1 uppercase tracking-widest bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
             <FileText className="w-3.5 h-3.5" /> Statement
          </button>
        </div>
      </div>

      {/* Advanced Filter Panel */}
      {showFilters && (
        <div className="p-6 bg-gray-50/80 border-b border-gray-100 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Transfer Direction</label>
              <div className="flex p-1 bg-white border border-gray-200 rounded-xl">
                {(['all', 'in', 'out'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilterType(t)}
                    className={`flex-1 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${
                      filterType === t 
                        ? 'bg-[#002366] text-white shadow-sm' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {t === 'all' ? 'All' : t === 'in' ? 'Credit' : 'Debit'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Value Range</label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-300" />
                  <input 
                    type="number" 
                    placeholder="Min" 
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <ArrowRight className="w-3 h-3 text-gray-300 shrink-0" />
                <div className="relative flex-1">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-300" />
                  <input 
                    type="number" 
                    placeholder="Max" 
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Processing Window</label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-300" />
                  <input 
                    type="date" 
                    value={dateStart}
                    onChange={(e) => setDateStart(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="relative flex-1">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-300" />
                  <input 
                    type="date" 
                    value={dateEnd}
                    onChange={(e) => setDateEnd(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center pt-2">
             <button 
               onClick={resetFilters}
               className="text-[10px] font-black text-red-500 hover:text-red-600 flex items-center gap-1 uppercase tracking-widest"
             >
               <X className="w-3 h-3" /> Clear All Filters
             </button>
             <button 
               onClick={() => setShowFilters(false)}
               className="bg-[#002366] text-white text-[10px] font-black px-4 py-2 rounded-lg uppercase tracking-widest hover:bg-blue-900 transition-colors"
             >
               Apply Criteria
             </button>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="p-4 bg-gray-50/30 border-b border-gray-100 shrink-0">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by recipient, status, or reference ID..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-[#002366] outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filteredTransactions.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {filteredTransactions.map((tx) => (
              <div 
                key={tx.id} 
                className="p-4 hover:bg-gray-50/80 transition-all flex items-center gap-4 cursor-pointer group border-l-4 border-transparent hover:border-[#002366]"
                onClick={() => onViewReceipt(tx)}
              >
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all group-hover:rotate-12 ${
                  tx.type === 'in' ? 'bg-green-50 text-green-600 shadow-sm border border-green-100' : 'bg-red-50 text-red-600 shadow-sm border border-red-100'
                }`}>
                  {tx.type === 'in' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-black text-gray-900 truncate group-hover:text-[#002366] tracking-tight">{tx.name}</p>
                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full border ${
                      tx.status === 'Cleared' || tx.status === 'Settled' 
                        ? 'bg-green-50 border-green-100 text-green-700' 
                        : 'bg-blue-50 border-blue-100 text-blue-700'
                    }`}>
                      {tx.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter mt-0.5">
                    {tx.date} {tx.referenceId && `• REF: ${tx.referenceId}`}
                  </p>
                </div>
                <div className="text-right flex items-center gap-4">
                  <div className="text-right">
                    <p className={`text-sm font-black ${tx.type === 'in' ? 'text-green-600' : 'text-gray-900'}`}>
                      {tx.type === 'in' ? '+' : '-'} {CURRENCY_SYMBOLS[tx.currency] || '$'}{parseFloat(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-[0.2em]">{tx.currency}</p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewReceipt(tx);
                      }}
                      className="p-2.5 text-gray-400 hover:text-[#002366] hover:bg-white rounded-xl transition-all border border-transparent hover:border-gray-200 shadow-sm"
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
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-900 font-black text-xs uppercase tracking-widest">No matching records</p>
            <button 
              onClick={resetFilters}
              className="mt-6 text-[#002366] text-[10px] font-black underline uppercase tracking-widest"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center shrink-0">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          Showing {filteredTransactions.length} of {transactions.length} entries
        </span>
        <div className="flex items-center gap-1.5">
           <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
           <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Live Ledger Sync Active</span>
        </div>
      </div>
    </div>
  );
};

export default TransactionsList;

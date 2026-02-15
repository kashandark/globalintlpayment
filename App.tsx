
import React, { useState, useEffect } from 'react';
import { 
  Layout, 
  Wallet, 
  Send, 
  History, 
  ShieldAlert, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Menu, 
  X,
  ChevronRight,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import Header from './components/Header';
import BalanceCard from './components/BalanceCard';
import TransferForm from './components/TransferForm';
import TransactionsList from './components/TransactionsList';
import ErrorModal from './components/ErrorModal';
import SuccessModal from './components/SuccessModal';
import InvoiceModal from './components/InvoiceModal';
import Login from './components/Login';

export interface Transaction {
  id: number | string;
  name: string;
  date: string;
  amount: string;
  currency: string;
  type: 'in' | 'out';
  status: string;
  referenceId?: string;
  recipient?: string;
  balanceAfter?: number; 
  exchangeRate?: number;
  usdAmount?: number;
}

const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 1, name: 'Swift Global - Settlement', date: 'Oct 14, 2024', amount: '5,400,000.00', currency: 'USD', type: 'in', status: 'Cleared', referenceId: 'SWFT-88219022', recipient: 'Global Int', balanceAfter: 990405989.50, usdAmount: 5400000.00, exchangeRate: 1.0 },
  { id: 2, name: 'Dubai Real Estate Corp', date: 'Oct 12, 2024', amount: '12,500,000.00', currency: 'AED', type: 'out', status: 'Verified', referenceId: 'RE-990122', recipient: 'DREC-UAE-992', balanceAfter: 985005989.50, usdAmount: 3405994.55, exchangeRate: 3.67 },
  { id: 3, name: 'Amazon Web Services', date: 'Oct 11, 2024', amount: '45,210.50', currency: 'USD', type: 'out', status: 'Cleared', referenceId: 'AWS-INV-0012', recipient: 'AWS-IRELAND', balanceAfter: 997505989.50, usdAmount: 45210.50, exchangeRate: 1.0 },
  { id: 4, name: 'Apple Inc. Dividend', date: 'Oct 09, 2024', amount: '1,200.00', currency: 'USD', type: 'in', status: 'Cleared', referenceId: 'AAPL-DIV-2024', recipient: 'Global Int', balanceAfter: 997551200.00, usdAmount: 1200.00, exchangeRate: 1.0 },
  { id: 5, name: 'London Stock Exchange', date: 'Oct 08, 2024', amount: '2,450,000.00', currency: 'GBP', type: 'out', status: 'Verified', referenceId: 'LSE-TRADE-X', recipient: 'BARCLAYS-UK', balanceAfter: 997550000.00, usdAmount: 3141025.64, exchangeRate: 0.78 },
];

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{ name: string; balance: number } | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [balance, setBalance] = useState(990405989.50); 
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Transaction | null>(null);
  const [invoiceInitialTab, setInvoiceInitialTab] = useState<'receipt' | 'swift' | 'remittance' | 'debitNote' | 'full'>('receipt');

  useEffect(() => {
    const session = localStorage.getItem('asdipro_session');
    if (session) {
      const parsed = JSON.parse(session);
      if (parsed.expiry > Date.now()) {
        setIsLoggedIn(true);
        setUser(parsed.user);
      } else {
        localStorage.removeItem('asdipro_session');
      }
    }

    const storedTx = localStorage.getItem('asdipro_transactions');
    if (storedTx) {
      setTransactions(JSON.parse(storedTx));
    } else {
      setTransactions(INITIAL_TRANSACTIONS);
      localStorage.setItem('asdipro_transactions', JSON.stringify(INITIAL_TRANSACTIONS));
    }

    const storedBalance = localStorage.getItem('asdipro_balance');
    if (storedBalance) {
      setBalance(parseFloat(storedBalance));
    } else {
      localStorage.setItem('asdipro_balance', balance.toString());
    }
  }, []);

  const handleLogin = (userData: { name: string; balance: number }) => {
    setIsLoggedIn(true);
    setUser(userData);
    const savedBalance = localStorage.getItem('asdipro_balance');
    const actualBalance = savedBalance ? parseFloat(savedBalance) : userData.balance;
    setBalance(actualBalance);
  };

  const handleLogout = () => {
    localStorage.removeItem('asdipro_session');
    setIsLoggedIn(false);
    setUser(null);
  };

  const handleTransferComplete = (success: boolean, details?: { amount: string, recipient: string, bank: string, centralBankName: string, currency: string, rate?: number }) => {
    if (success && details) {
      const rawAmount = parseFloat(details.amount || '0');
      // Convert to base currency (USD)
      const usdValue = details.rate ? rawAmount / details.rate : rawAmount;
      const newBalance = balance - usdValue;
      
      setBalance(newBalance);
      localStorage.setItem('asdipro_balance', newBalance.toString());
      
      const refId = `FTX-${Math.random().toString().slice(-8).toUpperCase()}`;
      
      const newTx: Transaction = {
        id: Date.now(),
        // Format the name as requested: IBAN + Central Bank Name
        name: `${details.recipient} • ${details.centralBankName}`,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        amount: details.amount,
        currency: details.currency,
        type: 'out',
        status: 'Settled',
        referenceId: refId,
        recipient: details.recipient,
        balanceAfter: newBalance,
        exchangeRate: details.rate || 1.0,
        usdAmount: usdValue
      };
      
      const updatedTx = [newTx, ...transactions];
      setTransactions(updatedTx);
      localStorage.setItem('asdipro_transactions', JSON.stringify(updatedTx));
      
      setLastTransaction(newTx);
      setShowSuccessModal(true);
    } else {
      setShowErrorModal(true);
    }
  };

  const openInvoice = (tx: Transaction, tab: 'receipt' | 'swift' | 'remittance' | 'debitNote' | 'full' = 'receipt') => {
    document.title = `${tab === 'full' ? 'Institutional_Bundle' : 'Receipt'}_${tx.referenceId || tx.id}.pdf`;
    setInvoiceInitialTab(tab);
    setSelectedInvoice(tx);
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex flex-col font-['Inter']">
      <Header onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} onLogout={handleLogout} />
      
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-8">
            <BalanceCard balance={balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} userName={user?.name || "Member"} />
            <TransferForm onTransferComplete={handleTransferComplete} />
          </div>

          <div className="space-y-8">
            <TransactionsList 
              transactions={transactions} 
              onViewReceipt={(tx) => openInvoice(tx, 'full')} 
            />
            
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-[#002366] mb-4">Security Insights</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl">
                  <ShieldAlert className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Advanced Encryption Active</p>
                    <p className="text-xs text-blue-700">All outbound transfers are verified via 256-bit HSM modules.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-xl">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-900">System Status: Optimal</p>
                    <p className="text-xs text-green-700">Cloud nodes in London, New York, and Dubai are fully operational.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {showErrorModal && <ErrorModal onClose={() => setShowErrorModal(false)} />}
      
      {showSuccessModal && lastTransaction && (
        <SuccessModal 
          onClose={() => setShowSuccessModal(false)} 
          transaction={lastTransaction}
          onViewReceipt={() => {
            setShowSuccessModal(false);
            openInvoice(lastTransaction, 'full');
          }}
        />
      )}

      {selectedInvoice && (
        <InvoiceModal 
          transaction={selectedInvoice} 
          initialTab={invoiceInitialTab}
          onClose={() => {
            setSelectedInvoice(null);
            document.title = 'Global International Banking';
          }} 
        />
      )}

      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setIsSidebarOpen(false)}></div>
          <div className="fixed inset-y-0 left-0 flex flex-col w-64 bg-white shadow-xl">
            <div className="p-6 border-b flex justify-between items-center">
              <span className="text-xl font-bold text-[#002366]">Global Int</span>
              <button onClick={() => setIsSidebarOpen(false)}><X className="w-6 h-6 text-gray-500" /></button>
            </div>
            <nav className="p-4 space-y-2">
              <a href="#" className="flex items-center gap-3 p-3 bg-blue-50 text-blue-700 rounded-lg font-medium">
                <Layout className="w-5 h-5" /> Dashboard
              </a>
              <a href="#" className="flex items-center gap-3 p-3 text-gray-600 hover:bg-gray-50 rounded-lg">
                <CreditCard className="w-5 h-5" /> Cards
              </a>
              <a href="#" className="flex items-center gap-3 p-3 text-gray-600 hover:bg-gray-50 rounded-lg">
                <Send className="w-5 h-5" /> Payments
              </a>
              <a href="#" className="flex items-center gap-3 p-3 text-gray-600 hover:bg-gray-50 rounded-lg">
                <History className="w-5 h-5" /> History
              </a>
            </nav>
          </div>
        </div>
      )}

      <footer className="bg-white border-t border-gray-200 py-6 text-center">
        <p className="text-sm text-gray-500">© 2024 Global International Banking Group. Secure Tier-1 International Entity.</p>
      </footer>
    </div>
  );
};

export default App;

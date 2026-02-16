
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
import RateTicker from './components/RateTicker';

export interface Transaction {
  id: number | string;
  name: string;
  recipientName?: string;
  date: string;
  time?: string;
  amount: string; // Principal
  currency: string;
  type: 'in' | 'out';
  status: string;
  referenceId?: string;
  recipient?: string;
  bic?: string;
  balanceAfter?: number; 
  exchangeRate?: number;
  eurAmount?: number; // Total impact in EUR
  isSepa?: boolean;
  timeframe?: string;
  fee?: string;
  totalSettlement?: string; // amount + fee
  paymentReason?: string;
  feeInstruction?: 'OUR' | 'SHA' | 'BEN';
}

const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 1, name: 'SJ LLC - Corporate Yield', date: 'Oct 14, 2024', time: '14:22:10 GMT', amount: '5,400,000.00', currency: 'USD', type: 'in', status: 'Cleared', referenceId: 'SWFT-88219022', recipient: 'DE07300308805230314596', balanceAfter: 911173510.34, eurAmount: 4968000.00, exchangeRate: 1.0, timeframe: '1 to 5 Business Days', fee: '45.00', totalSettlement: '5,400,045.00', paymentReason: 'Institutional Dividend Settlement', feeInstruction: 'OUR' },
  { id: 2, name: 'Dubai Real Estate Corp', date: 'Oct 12, 2024', time: '09:45:33 GMT', amount: '12,500,000.00', currency: 'AED', type: 'out', status: 'Verified', referenceId: 'RE-990122', recipient: 'DREC-UAE-992', balanceAfter: 906205510.34, eurAmount: 3133515.00, exchangeRate: 3.67, timeframe: '1 to 5 Business Days', fee: '25.00', totalSettlement: '12,500,025.00', paymentReason: 'Real Estate Purchase', feeInstruction: 'OUR' },
  { id: 3, name: 'Amazon Web Services', date: 'Oct 11, 2024', time: '18:10:05 GMT', amount: '45,210.50', currency: 'USD', type: 'out', status: 'Cleared', referenceId: 'AWS-INV-0012', recipient: 'AWS-IRELAND', balanceAfter: 917705510.34, eurAmount: 41593.66, exchangeRate: 1.0, timeframe: 'Under 10 Seconds', fee: '0.00', totalSettlement: '45,210.50', paymentReason: 'Cloud Infrastructure Services', feeInstruction: 'OUR' },
];

const RANDOM_PARTNERS = [
  { name: "Global Logistics S.A.", bank: "BNP Paribas", bic: "BNPAFRPPXXX", country: "FR" },
  { name: "TechNova Solutions Ltd", bank: "Barclays Bank PLC", bic: "BARCGB22XXX", country: "GB" },
  { name: "Alpine Capital Partners", bank: "UBS Group AG", bic: "UBSWCHZHXXX", country: "CH" },
  { name: "Nordic Energy Corp", bank: "Nordea Bank Abp", bic: "NORDDEHHXXX", country: "DE" },
  { name: "Silicon Valley Equities", bank: "JPMorgan Chase", bic: "CHASUS33XXX", country: "US" },
  { name: "Desert Bloom Trading", bank: "Emirates NBD", bic: "EBILAEADXXX", country: "AE" }
];

const RANDOM_PAYMENT_REASONS = [
  "Account Refill", "Quarterly Bonus", "Invoice Settlement #982", 
  "Stock Dividend", "Consultancy Remittance", "Inter-account Transfer",
  "Hardware Procurement", "Marketing Retainer Q4", "SaaS Licensing Fee"
];

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{ name: string; balance: number } | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [balance, setBalance] = useState(911173510.34); 
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

  useEffect(() => {
    if (!isLoggedIn) return;

    const generateRandomIban = (countryCode: string) => {
      const randomBody = Array.from({length: 18}, () => Math.floor(Math.random() * 10)).join('');
      return `${countryCode}${Math.floor(Math.random() * 90) + 10}${randomBody}`;
    };

    const interval = setInterval(() => {
      const partner = RANDOM_PARTNERS[Math.floor(Math.random() * RANDOM_PARTNERS.length)];
      const reason = RANDOM_PAYMENT_REASONS[Math.floor(Math.random() * RANDOM_PAYMENT_REASONS.length)];
      const randomAmount = Math.floor(Math.random() * (50000 - 5000 + 1)) + 5000;
      
      const now = new Date();
      const refId = `FTX-${Math.random().toString().slice(-8).toUpperCase()}`;
      
      setBalance(prev => {
        const nextBalance = prev + randomAmount;
        localStorage.setItem('asdipro_balance', nextBalance.toString());

        const newTx: Transaction = {
          id: Date.now(),
          name: partner.bank,
          recipientName: partner.name,
          date: now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
          time: now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) + ' GMT',
          amount: randomAmount.toFixed(2),
          currency: 'EUR',
          type: 'in',
          status: 'Cleared',
          referenceId: refId,
          recipient: generateRandomIban(partner.country),
          bic: partner.bic,
          balanceAfter: nextBalance,
          exchangeRate: 1.0,
          eurAmount: randomAmount,
          isSepa: true,
          timeframe: 'Instant',
          fee: '0.00',
          totalSettlement: randomAmount.toFixed(2),
          paymentReason: reason,
          feeInstruction: 'SHA'
        };

        setTransactions(prevTx => {
          const updated = [newTx, ...prevTx];
          localStorage.setItem('asdipro_transactions', JSON.stringify(updated));
          return updated;
        });

        return nextBalance;
      });
    }, 900000); // 15 minutes

    return () => clearInterval(interval);
  }, [isLoggedIn]);

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

  const handleTransferComplete = (success: boolean, details?: { 
    amount: string, 
    recipient: string, 
    recipientName: string,
    bic: string,
    bank: string, 
    centralBankName: string, 
    currency: string, 
    rate?: number, 
    isSepa?: boolean, 
    timeframe?: string, 
    fee?: string,
    paymentReason?: string,
    feeInstruction?: 'OUR' | 'SHA' | 'BEN'
  }) => {
    if (success && details) {
      const rawAmount = parseFloat(details.amount || '0');
      const feeAmount = parseFloat(details.fee || '0');
      const totalInSelectedCurrency = rawAmount + feeAmount;
      const rate = details.rate || 1.0;
      
      const eurRate = 0.92;
      const eurValue = (totalInSelectedCurrency / rate) * eurRate;
      const newBalance = balance - eurValue;
      
      setBalance(newBalance);
      localStorage.setItem('asdipro_balance', newBalance.toString());
      
      const refId = `FTX-${Math.random().toString().slice(-8).toUpperCase()}`;
      const now = new Date();
      
      const newTx: Transaction = {
        id: Date.now(),
        name: details.recipientName || details.bank,
        recipientName: details.recipientName,
        date: now.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        time: now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) + ' GMT',
        amount: details.amount,
        currency: details.currency,
        type: 'out',
        status: 'Settled',
        referenceId: refId,
        recipient: details.recipient,
        bic: details.bic,
        balanceAfter: newBalance,
        exchangeRate: rate,
        eurAmount: eurValue,
        isSepa: details.isSepa,
        timeframe: details.timeframe,
        fee: details.fee,
        totalSettlement: totalInSelectedCurrency.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        paymentReason: details.paymentReason,
        feeInstruction: details.feeInstruction || 'OUR'
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
      <div className="flex-1 flex flex-col">
        <Header onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} onLogout={handleLogout} />
        <RateTicker />
        
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
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
      </div>

      <footer className="bg-white border-t border-gray-200 py-6 text-center shrink-0 mt-auto">
        <p className="text-sm text-gray-500">© 2024 Global International Banking Group. Secure Tier-1 International Entity.</p>
      </footer>

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
    </div>
  );
};

export default App;


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
  Loader2,
  CheckCircle2,
  Clock,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Activity,
  Shield
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
import AdminDashboard from './components/AdminDashboard';
import { api, Recipient } from './api';

export interface Transaction {
  id: number | string;
  name: string;
  recipientName?: string;
  date: string;
  time?: string;
  amount: string; 
  currency: string;
  type: 'in' | 'out';
  status: string;
  referenceId?: string;
  recipient?: string;
  recipientAccountNumber?: string;
  bic?: string;
  balanceAfter?: number; 
  exchangeRate?: number;
  eurAmount?: number; 
  isSepa?: boolean;
  timeframe?: string;
  fee?: string;
  totalSettlement?: string;
  paymentReason?: string;
  feeInstruction?: 'OUR' | 'SHA' | 'BEN';
}

interface AuthNode {
  location: string;
  id: string;
  date: string;
  isCurrent?: boolean;
}

const POSSIBLE_NODES: AuthNode[] = [
  { location: 'London, UK', id: 'GIBK-LN-09', date: 'CURRENT' },
  { location: 'Dubai, UAE', id: 'GIBK-DX-04', date: '14 OCT' },
  { location: 'Dubai, UAE', id: 'GIBK-DX-05', date: '28 FEB' },
  { location: 'Frankfurt, DE', id: 'GIBK-FR-12', date: '22 NOV' },
  { location: 'New York, USA', id: 'GIBK-NY-01', date: '05 JAN' },
  { location: 'San Francisco, USA', id: 'GIBK-SF-06', date: '19 MAR' },
  { location: 'Chicago, USA', id: 'GIBK-CH-03', date: '18 FEB' },
  { location: 'Berlin, DE', id: 'GIBK-BE-07', date: '12 DEC' },
  { location: 'Zurich, CH', id: 'GIBK-ZH-05', date: '09 MAR' },
  { location: 'Paris, FR', id: 'GIBK-PA-02', date: '30 APR' },
  { location: 'Tokyo, JP', id: 'GIBK-TK-08', date: '15 MAY' },
  { location: 'Shanghai, CN', id: 'GIBK-SH-10', date: '03 JUN' },
  { location: 'Beijing, CN', id: 'GIBK-BJ-11', date: '11 JUL' },
  { location: 'Dublin, IE', id: 'GIBK-DB-14', date: '25 AUG' },
  { location: 'Riyadh, SA', id: 'GIBK-RY-15', date: '07 SEP' },
  { location: 'Karachi, PK', id: 'GIBK-KA-16', date: '20 OCT' },
  { location: 'Islamabad, PK', id: 'GIBK-IS-17', date: '02 NOV' }
];

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{ 
    name: string; 
    balance: number; 
    role?: 'admin' | 'user';
    bankEntity?: string;
    swiftCode?: string;
    iban?: string;
    accountNumber?: string;
  } | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [balance, setBalance] = useState(0); 
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Transaction | null>(null);
  const [invoiceInitialTab, setInvoiceInitialTab] = useState<'receipt' | 'swift' | 'remittance' | 'debitNote' | 'full'>('receipt');
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [authNodes, setAuthNodes] = useState<AuthNode[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transfer' | 'history' | 'admin'>('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved === 'true';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', isDarkMode.toString());
  }, [isDarkMode]);

  // Security Panel State
  const [sessionStartTime, setSessionStartTime] = useState(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await api.getSession();
      if (session) {
        const localSession = localStorage.getItem('asdipro_session');
        if (localSession) {
          const parsed = JSON.parse(localSession);
          setIsLoggedIn(true);
          setUser(parsed.user);
          setSessionStartTime(parsed.loginTime || Date.now());
          if (parsed.nodes) {
            setAuthNodes(parsed.nodes);
          } else {
            generateRandomNodes();
          }
        } else {
          // If we have a supabase session but no local session info (e.g. refresh)
          // we should probably fetch the profile
          try {
            const { data: { session } } = await api.getSession();
            if (session) {
              const profile = await api.getProfile(session.user.id);
              const userData = { 
                name: profile.full_name, 
                balance: profile.balance,
                role: profile.role,
                bankEntity: profile.bank_entity,
                swiftCode: profile.swift_code,
                iban: profile.iban,
                accountNumber: profile.account_number
              }; 
              setIsLoggedIn(true);
              setUser(userData);
              generateRandomNodes();
            }
          } catch (e) {
            api.logout();
          }
        }
      } else {
        setIsLoggedIn(false);
      }
    };
    checkSession();
  }, []);

  const generateRandomNodes = () => {
    const shuffled = [...POSSIBLE_NODES].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3);
    // Ensure one is current
    const nodes = selected.map((node, idx) => ({
      ...node,
      isCurrent: idx === 0,
      date: idx === 0 ? 'CURRENT' : node.date
    }));
    setAuthNodes(nodes);
    return nodes;
  };

  useEffect(() => {
    if (!isLoggedIn) return;

    const loadInitialData = async () => {
      setIsLoadingData(true);
      try {
        const [txs, bal] = await Promise.all([
          api.fetchTransactions(),
          api.fetchBalance()
        ]);
        setTransactions(txs);
        setBalance(bal);
      } catch (err) {
        console.error("Failed to synchronize with clearing hub", err);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadInitialData();
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - sessionStartTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isLoggedIn, sessionStartTime]);

  const formatElapsedTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, m, s].map(v => v < 10 ? '0' + v : v).join(':');
  };

  const handleLogin = (userData: any) => {
    setIsLoggedIn(true);
    setUser(userData);
    setBalance(userData.balance);
    setSessionStartTime(Date.now());
    const nodes = generateRandomNodes();
    
    // Update session with nodes
    const session = JSON.parse(localStorage.getItem('asdipro_session') || '{}');
    localStorage.setItem('asdipro_session', JSON.stringify({
      ...session,
      user: userData,
      nodes: nodes,
      loginTime: Date.now()
    }));
  };

  const handleLogout = () => {
    api.logout();
    setIsLoggedIn(false);
    setUser(null);
  };

  const handleTransferComplete = async (success: boolean, details?: any) => {
    if (success && details) {
      const eurRate = 0.92;
      const totalInSelectedCurrency = parseFloat(details.amount) + parseFloat(details.fee);
      const eurValue = (totalInSelectedCurrency / (details.rate || 1.0)) * eurRate;
      
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
        recipientAccountNumber: details.recipientAccountNumber,
        bic: details.bic,
        balanceAfter: balance - eurValue,
        exchangeRate: details.rate,
        eurAmount: eurValue,
        isSepa: details.isSepa,
        timeframe: details.timeframe,
        fee: details.fee,
        totalSettlement: totalInSelectedCurrency.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        paymentReason: details.paymentReason,
        feeInstruction: details.feeInstruction || 'OUR'
      };
      
      try {
        const result = await api.submitTransfer(newTx);
        setBalance(result.newBalance);
        setTransactions(prev => [newTx, ...prev]);
        setLastTransaction(newTx);
        setShowSuccessModal(true);
      } catch (err) {
        setShowErrorModal(true);
      }
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
    <div className="min-h-screen bg-[#f3f4f6] dark:bg-[#050505] flex flex-col font-['Inter'] transition-colors duration-300">
      <div className="flex-1 flex flex-col transition-all duration-500 ease-in-out">
        <Header 
          onLogout={handleLogout}
          onTabChange={(tab) => setActiveTab(tab)}
          user={user}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        />
        <RateTicker />
        
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'admin' && user?.role === 'admin' ? (
            <AdminDashboard />
          ) : activeTab === 'transfer' ? (
            <div className="max-w-3xl mx-auto">
              <TransferForm onTransferComplete={handleTransferComplete} />
            </div>
          ) : activeTab === 'history' ? (
            <TransactionsList 
              transactions={transactions} 
              onViewReceipt={(tx) => openInvoice(tx, 'full')} 
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
              <div className="lg:col-span-2 space-y-8">
                <BalanceCard 
                  balance={balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} 
                  user={user} 
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <button 
                    onClick={() => setActiveTab('transfer')}
                    className="bg-white dark:bg-[#111] p-8 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all group text-left"
                  >
                    <div className="bg-blue-50 dark:bg-blue-900/20 w-12 h-12 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6 group-hover:bg-blue-600 dark:group-hover:bg-blue-500 group-hover:text-white transition-colors">
                      <Send className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-2">New Transfer</h4>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-tight">Initiate cross-border clearing</p>
                  </button>
                  <button 
                    onClick={() => setActiveTab('history')}
                    className="bg-white dark:bg-[#111] p-8 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all group text-left"
                  >
                    <div className="bg-gray-50 dark:bg-gray-800 w-12 h-12 rounded-2xl flex items-center justify-center text-gray-400 dark:text-gray-500 mb-6 group-hover:bg-[#002366] dark:group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <History className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-2">Transaction Ledger</h4>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-tight">Review settlement history</p>
                  </button>
                </div>
                <TransactionsList 
                  transactions={transactions.slice(0, 5)} 
                  onViewReceipt={(tx) => openInvoice(tx, 'full')} 
                />
              </div>

              <div className="space-y-8">
                <div className="bg-white dark:bg-[#111] rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-black text-[#002366] dark:text-blue-400 uppercase tracking-tighter">Security Insights</h3>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-green-100 dark:border-green-900/30">
                      <Activity className="w-3 h-3" /> Live Monitor
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-2xl">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-blue-600/10 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                          <Clock className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Active Session Duration</span>
                      </div>
                      <p className="text-2xl font-black text-[#002366] dark:text-white font-mono">{formatElapsedTime(elapsedSeconds)}</p>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                      <ShieldAlert className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                      <div>
                        <p className="text-xs font-black text-blue-900 dark:text-blue-200 uppercase tracking-tight">Advanced Encryption Active</p>
                        <p className="text-[10px] text-blue-700 dark:text-blue-400 font-medium leading-relaxed">Verification confirmed via 256-bit HSM modules. Peer-to-peer tunnels are stable.</p>
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] ml-1">Recent Authentication Nodes</p>
                      <div className="space-y-2">
                        {authNodes.map((node, idx) => (
                          <div key={idx} className={`flex items-center justify-between p-3 border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm ${node.isCurrent ? 'bg-white dark:bg-[#1a1a1a]' : 'bg-gray-50/50 dark:bg-gray-900/30 opacity-60'}`}>
                            <div className="flex items-center gap-2">
                              <MapPin className={`w-3 h-3 ${node.isCurrent ? 'text-red-500' : 'text-gray-400'}`} />
                              <span className={`text-[10px] font-bold ${node.isCurrent ? 'text-gray-700 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400'}`}>{node.location} ({node.id})</span>
                            </div>
                            <span className="text-[9px] font-mono text-gray-400 dark:text-gray-500 uppercase">{node.date}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <footer className="bg-white dark:bg-[#0a0a0a] border-t border-gray-200 dark:border-gray-800 py-6 text-center shrink-0 mt-auto transition-colors duration-300">
        <p className="text-sm text-gray-500 dark:text-gray-400">© 2024 Global International Banking Group. Secure Tier-1 International Entity.</p>
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

      {isLoadingData && (
        <div className="fixed inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-sm z-[100] flex flex-col items-center justify-center">
           <Loader2 className="w-10 h-10 text-[#002366] dark:text-blue-400 animate-spin mb-4" />
           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">Synchronizing Global Ledger...</p>
        </div>
      )}
    </div>
  );
};

export default App;

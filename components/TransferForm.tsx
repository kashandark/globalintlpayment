
import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, ShieldCheck, CheckCircle2, Loader2, ChevronRight, 
  Landmark, Activity, Terminal, ShieldAlert, CheckCircle, 
  Globe, Server, Send, Wallet, RefreshCw, TrendingUp, Zap, Clock, User, ChevronDown, Search, Plus, Save
} from 'lucide-react';
import { api, Recipient } from '../api';
import TransferConfirmationModal from './TransferConfirmationModal';

interface TransferFormProps {
  onTransferComplete: (success: boolean, details?: { 
    amount: string, 
    recipient: string, 
    recipientName: string,
    recipientAccountNumber?: string,
    bic: string,
    bank: string, 
    centralBankName: string, 
    currency: string, 
    rate: number, 
    isSepa: boolean, 
    isHsbcGlobal?: boolean,
    isDirectDebit?: boolean,
    mandateReference?: string,
    timeframe: string, 
    fee: string,
    paymentReason: string,
    feeInstruction: 'OUR' | 'SHA' | 'BEN'
  }) => void;
}

interface IBANMetadata {
  isValid: boolean;
  iban?: string;
  countryName?: string;
  countryCode?: string;
  currency?: string;
  centralBankName?: string;
  centralBankUrl?: string;
  membership?: string;
  isEuMember?: string;
  ibanLength?: number;
  isSepa?: string;
  isSwift?: string;
  bankName?: string;
  bic?: string;
  city?: string;
  relayNode?: 'PRIMARY' | 'SECONDARY';
}

const formatIbanDisplay = (iban: string) => {
  const clean = iban.toUpperCase().replace(/\s/g, '');
  return clean.replace(/(.{4})/g, '$1 ').trim();
};

const FINANCIAL_HUB_DB: Record<string, Partial<IBANMetadata>> = {
  'CH': { countryName: 'Switzerland', currency: 'CHF', ibanLength: 21, centralBankName: 'Swiss National Bank', centralBankUrl: 'http://www.snb.ch/', membership: 'efta_member', isEuMember: 'No', isSepa: 'Yes', isSwift: 'Yes' },
  'PK': { countryName: 'Pakistan', currency: 'PKR', ibanLength: 24, centralBankName: 'State Bank of Pakistan', centralBankUrl: 'http://www.sbp.org.pk/', membership: 'non_member', isEuMember: 'No', isSepa: 'No', isSwift: 'Yes' },
  'DE': { countryName: 'Germany', currency: 'EUR', ibanLength: 22, centralBankName: 'Deutsche Bundesbank', centralBankUrl: 'http://www.bundesbank.de/', membership: 'eu_member', isEuMember: 'Yes', isSepa: 'Yes', isSwift: 'Yes' },
  'GB': { countryName: 'United Kingdom', currency: 'GBP', ibanLength: 22, centralBankName: 'Bank of England', centralBankUrl: 'https://www.bankofengland.co.uk/', membership: 'oecd_member', isEuMember: 'No', isSepa: 'Yes', isSwift: 'Yes' },
  'AE': { countryName: 'United Arab Emirates', currency: 'AED', ibanLength: 23, centralBankName: 'Central Bank of the UAE', centralBankUrl: 'https://www.centralbank.ae/', membership: 'gcc_member', isEuMember: 'No', isSepa: 'No', isSwift: 'Yes' },
  'US': { countryName: 'United States', currency: 'USD', ibanLength: 0, centralBankName: 'Federal Reserve', centralBankUrl: 'https://www.federalreserve.gov/', membership: 'oecd_member', isEuMember: 'No', isSepa: 'No', isSwift: 'Yes' },
  'CN': { countryName: 'China', currency: 'CNY', ibanLength: 0, centralBankName: 'People\'s Bank of China', centralBankUrl: 'http://www.pbc.gov.cn/', membership: 'non_member', isEuMember: 'No', isSepa: 'No', isSwift: 'Yes' },
  'IE': { countryName: 'Ireland', currency: 'EUR', ibanLength: 22, centralBankName: 'Central Bank of Ireland', centralBankUrl: 'https://www.centralbank.ie/', membership: 'eu_member', isEuMember: 'Yes', isSepa: 'Yes', isSwift: 'Yes' },
  'LT': { countryName: 'Lithuania', currency: 'EUR', ibanLength: 20, centralBankName: 'Bank of Lithuania', centralBankUrl: 'https://www.lb.lt/', membership: 'eu_member', isEuMember: 'Yes', isSepa: 'Yes', isSwift: 'Yes' },
  'SA': { countryName: 'Saudi Arabia', currency: 'SAR', ibanLength: 24, centralBankName: 'Saudi Central Bank', centralBankUrl: 'https://www.sama.gov.sa/', membership: 'gcc_member', isEuMember: 'No', isSepa: 'No', isSwift: 'Yes' },
  'HK': { countryName: 'Hong Kong', currency: 'HKD', ibanLength: 0, centralBankName: 'Hong Kong Monetary Authority', centralBankUrl: 'https://www.hkma.gov.hk/', membership: 'non_member', isEuMember: 'No', isSepa: 'No', isSwift: 'Yes' },
  'ES': { countryName: 'Spain', currency: 'EUR', ibanLength: 24, centralBankName: 'Banco de España', centralBankUrl: 'https://www.bde.es/', membership: 'eu_member', isEuMember: 'Yes', isSepa: 'Yes', isSwift: 'Yes' },
  'QA': { countryName: 'Qatar', currency: 'QAR', ibanLength: 29, centralBankName: 'Qatar Central Bank', centralBankUrl: 'https://www.qcb.gov.qa/', membership: 'gcc_member', isEuMember: 'No', isSepa: 'No', isSwift: 'Yes' }
};

const INITIAL_RATES: Record<string, number> = {
  'USD': 1.00,
  'EUR': 0.92,
  'GBP': 0.78,
  'AED': 3.67,
  'PKR': 278.45,
  'CHF': 0.89,
  'CNY': 7.24,
  'SAR': 3.75,
  'HKD': 7.82,
  'QAR': 3.64
};

const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'AED', 'PKR', 'CHF', 'CNY', 'SAR', 'HKD', 'QAR'];

const PAYMENT_REASONS = [
  'Invoice Settlement',
  'Professional Services',
  'Business Services',
  'Trade Finance',
  'Capital Repatriation',
  'Real Estate Purchase',
  'Inter-Institutional Transfer',
  'Capital Investment',
  'Salary / Payroll Posting',
  'Consultancy Services',
  'Software Licensing',
  'Marketing Retainer',
  'Family Maintenance',
  'Education',
  'Investment',
  'Dividend Payment',
  'Loan Repayment',
  'Intercompany Transfer',
  'Charitable Donation',
  'Donation',
  'Zakat',
  'Medical Expenses',
  'Travel Expenses'
];

const TransferForm: React.FC<TransferFormProps> = ({ onTransferComplete }) => {
  const [recipientIban, setRecipientIban] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientAccountNumber, setRecipientAccountNumber] = useState('');
  const [bicCode, setBicCode] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [paymentReason, setPaymentReason] = useState(PAYMENT_REASONS[0]);
  const [mandateReference, setMandateReference] = useState('');
  
  const [transferType, setTransferType] = useState<'STANDARD' | 'HSBC_GLOBAL' | 'SEPA_DIRECT_DEBIT'>('STANDARD');
  const [destinationCountry, setDestinationCountry] = useState('HK');
  const [selectedMethod, setSelectedMethod] = useState<'SEPA' | 'SWIFT' | 'HSBC_GLOBAL' | null>(null);
  const [sepaSpeed, setSepaSpeed] = useState<'standard' | 'instant'>('standard');
  const [isManual, setIsManual] = useState(false);

  const [isValidating, setIsValidating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ibanData, setIbanData] = useState<IBANMetadata | null>(null);
  const [processStep, setProcessStep] = useState(0);
  const [activeRelay, setActiveRelay] = useState<'PRIMARY' | 'SECONDARY'>('PRIMARY');
  const [rates, setRates] = useState(INITIAL_RATES);

  const [savedRecipients, setSavedRecipients] = useState<Recipient[]>([]);
  const [showRecipientDropdown, setShowRecipientDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [shouldSaveRecipient, setShouldSaveRecipient] = useState(false);
  const [isSavingRecipient, setIsSavingRecipient] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const validationTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (transferType === 'SEPA_DIRECT_DEBIT' && recipientName && recipientIban.replace(/\s/g, '').length >= 4) {
      const last4 = recipientIban.replace(/\s/g, '').slice(-4);
      const year = new Date().getFullYear();
      const generated = `${recipientName.trim().replace(/\s+/g, '-').toUpperCase()}-${last4}-SUB-${year}`;
      setMandateReference(generated);
    }
  }, [transferType, recipientName, recipientIban]);

  useEffect(() => {
    const loadRecipients = async () => {
      try {
        const data = await api.fetchRecipients();
        setSavedRecipients(data);
      } catch (e) {
        console.error('Failed to load recipients', e);
      }
    };
    loadRecipients();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setRates(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(key => {
          if (key !== 'USD') {
            const fluctuation = 1 + (Math.random() * 0.002 - 0.001);
            next[key] = parseFloat((next[key] * fluctuation).toFixed(4));
          }
        });
        return next;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const validateIban = async (iban: string) => {
    const cleanIban = iban.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (cleanIban.length < 8) return;
    setIsValidating(true);
    
    try {
      const result = await api.validateIban(cleanIban);
      
      let finalData: IBANMetadata;
      if (result.isValid === true) {
        setActiveRelay('PRIMARY');
        const countryCode = cleanIban.substring(0, 2);
        const hubInfo = FINANCIAL_HUB_DB[countryCode];
        finalData = {
          isValid: true,
          iban: formatIbanDisplay(iban),
          countryCode: countryCode,
          countryName: hubInfo?.countryName || result.data?.countryName || 'Institutional Territory',
          currency: hubInfo?.currency || result.data?.currency || 'USD',
          centralBankName: hubInfo?.centralBankName || result.data?.centralBankName || 'Central Bank Node',
          centralBankUrl: hubInfo?.centralBankUrl || 'http://www.bis.org/',
          membership: hubInfo?.membership || result.data?.membership || 'non_member',
          isEuMember: hubInfo?.isEuMember || result.data?.isEuMember || 'No',
          isSepa: hubInfo?.isSepa || result.data?.isSepa || 'No',
          isSwift: hubInfo?.isSwift || result.data?.isSwift || 'Yes',
          bankName: result.data?.bankName || 'Verified Correspondent Bank',
          bic: result.data?.bic || 'SWIFXXXX',
          ibanLength: cleanIban.length
        };
      } else if (FINANCIAL_HUB_DB[cleanIban.substring(0, 2)]) {
        setActiveRelay('SECONDARY');
        const countryCode = cleanIban.substring(0, 2);
        const hubInfo = FINANCIAL_HUB_DB[countryCode];
        finalData = {
          isValid: true,
          iban: formatIbanDisplay(iban),
          countryCode: countryCode,
          countryName: hubInfo.countryName,
          currency: hubInfo.currency,
          centralBankName: hubInfo.centralBankName,
          centralBankUrl: hubInfo.centralBankUrl,
          membership: hubInfo.membership,
          isEuMember: hubInfo.isEuMember,
          isSepa: hubInfo.isSepa,
          isSwift: hubInfo.isSwift,
          bankName: 'Manual Entry Verified Hub',
          bic: 'SWIFXXXX',
          ibanLength: hubInfo.ibanLength || cleanIban.length
        };
      } else {
        if (transferType === 'SEPA_DIRECT_DEBIT') {
          setIbanData({
            isValid: true,
            countryCode: cleanIban.substring(0, 2),
            countryName: 'SEPA Zone',
            currency: 'EUR',
            bankName: 'Verified SEPA Institution',
            bic: 'SWIFXXXX',
            isSepa: 'Yes',
            ibanLength: cleanIban.length
          });
        } else {
          setIbanData(null);
        }
        return;
      }

      setIbanData(finalData);
      if (finalData.bic && !bicCode) setBicCode(finalData.bic);

      if (finalData.currency && SUPPORTED_CURRENCIES.includes(finalData.currency)) {
        setCurrency(finalData.currency);
      } else if (finalData.isSepa === 'Yes') {
        setCurrency('EUR');
      }

      if (transferType === 'SEPA_DIRECT_DEBIT') {
        setSelectedMethod('SEPA');
      } else if (finalData.isSepa === 'Yes' && finalData.isSwift === 'Yes') {
        setSelectedMethod(null);
      } else if (finalData.isSepa === 'Yes') {
        setSelectedMethod('SEPA');
      } else if (finalData.isSwift === 'Yes') {
        setSelectedMethod('SWIFT');
      } else {
        setSelectedMethod(null);
      }
    } catch {
      setIbanData(null);
      if (transferType === 'STANDARD') {
        setSelectedMethod(null);
      }
    } finally {
      setIsValidating(false);
    }
  };

  useEffect(() => {
    if (validationTimeout.current) clearTimeout(validationTimeout.current);
    const clean = recipientIban.replace(/\s/g, '');
    if (clean.length >= 8) {
      validationTimeout.current = setTimeout(() => validateIban(recipientIban), 800);
    } else {
      setIbanData(null);
      if (transferType === 'STANDARD') {
        setSelectedMethod(null);
      }
    }
    return () => { if (validationTimeout.current) clearTimeout(validationTimeout.current); };
  }, [recipientIban]);

  const getTimeframe = () => {
    if (selectedMethod === 'HSBC_GLOBAL') {
      return "Instant (Internal Network)";
    }
    if (selectedMethod === 'SEPA') {
      return sepaSpeed === 'instant' ? "Under 10 Seconds" : "Max 1 Business Day";
    }
    return isManual ? "2 to 3 Business Days" : "1 to 5 Business Days";
  };

  const getFee = () => {
    const val = parseFloat(amount || '0');
    if (selectedMethod === 'HSBC_GLOBAL') {
      return (val * 0.01).toFixed(2);
    }
    if (selectedMethod === 'SEPA') {
      const rate = sepaSpeed === 'instant' ? 0.03 : 0.005;
      return (val * rate).toFixed(2);
    }
    return isManual ? "15.00" : "45.00";
  };

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ibanData?.isValid || !selectedMethod) return;

    // Pre-validation: Check if user has enough balance
    const transferAmount = parseFloat(amount || '0');
    const feeAmount = parseFloat(getFee());
    const totalInSelectedCurrency = transferAmount + feeAmount;
    const eurEquivalentValue = (totalInSelectedCurrency / rates[currency]) * 0.92;

    const session = JSON.parse(localStorage.getItem('asdipro_session') || '{}');
    const currentBalance = session.user?.balance || 0;

    if (eurEquivalentValue > currentBalance) {
      onTransferComplete(false, { error: 'Insufficient Liquidity in Clearing Account' });
      return;
    }

    setShowConfirmModal(true);
  };

  const confirmTransfer = async () => {
    setShowConfirmModal(false);
    setIsProcessing(true);
    setProcessStep(0);
    
    // Realistic variable network delay between 2000ms and 5000ms
    const totalDelay = Math.floor(Math.random() * (5000 - 2000 + 1)) + 2000;
    const timeframe = getTimeframe();
    const fee = getFee();

    // Map log steps to the variable delay
    const totalSteps = 7;
    const intervalTime = totalDelay / totalSteps;

    for (let i = 1; i <= totalSteps; i++) {
      await new Promise(r => setTimeout(r, intervalTime));
      setProcessStep(i);
    }
    
    onTransferComplete(true, {
      amount: amount,
      recipient: recipientIban,
      recipientName: recipientName || (ibanData?.bankName || "Verified Participant"),
      recipientAccountNumber: recipientAccountNumber,
      bic: bicCode || (ibanData?.bic || "SWIFXXXX"),
      bank: ibanData?.bankName || "Institutional Node",
      centralBankName: ibanData?.centralBankName || "Reserve Hub",
      currency: currency,
      rate: rates[currency],
      isSepa: selectedMethod === 'SEPA' || transferType === 'SEPA_DIRECT_DEBIT',
      isHsbcGlobal: selectedMethod === 'HSBC_GLOBAL',
      isDirectDebit: transferType === 'SEPA_DIRECT_DEBIT',
      mandateReference: mandateReference,
      timeframe: timeframe,
      fee: fee,
      paymentReason: paymentReason,
      feeInstruction: 'OUR'
    });
    setIsProcessing(false);
    
    // Save recipient if requested
    if (shouldSaveRecipient) {
      await handleSaveRecipient();
    } else {
      // Check if recipient is already saved
      const isAlreadySaved = savedRecipients.some(r => r.iban.replace(/\s/g, '') === recipientIban.replace(/\s/g, ''));
      if (!isAlreadySaved) {
        setShowSavePrompt(true);
      }
    }
  };

  const handleSaveRecipient = async () => {
    setIsSavingRecipient(true);
    try {
      await api.saveRecipient({
        name: recipientName || (ibanData?.bankName || "Verified Participant"),
        iban: recipientIban,
        bic: bicCode || (ibanData?.bic || "SWIFXXXX"),
        account_number: recipientAccountNumber
      });
      const updated = await api.fetchRecipients();
      setSavedRecipients(updated);
      setShowSavePrompt(false);
    } catch (e) {
      console.error('Failed to save recipient', e);
    } finally {
      setIsSavingRecipient(false);
    }
  };

  const selectRecipient = (r: Recipient) => {
    setRecipientIban(r.iban);
    setRecipientName(r.name);
    setBicCode(r.bic);
    if (r.account_number) setRecipientAccountNumber(r.account_number);
    setShowRecipientDropdown(false);
    setSearchQuery('');
    setShouldSaveRecipient(false);
  };

  // Convert to EUR base (Assuming rates are USD-based: 1 USD = 0.92 EUR)
  const eurEquivalent = ((parseFloat(amount || '0') / rates[currency]) * 0.92).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="bg-white dark:bg-[#111] rounded-[2rem] shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden font-['Inter'] transition-colors duration-300">
      <div className="bg-[#002366] dark:bg-blue-700 px-8 py-6 text-white flex justify-between items-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="flex items-center gap-3 relative z-10">
          <div className="bg-white/10 p-2 rounded-xl backdrop-blur-md">
            <Send className="w-5 h-5 text-blue-100" />
          </div>
          <div>
            <h3 className="font-black text-lg uppercase tracking-tight text-white">Institutional Transfer</h3>
            <p className="text-[9px] text-blue-300 dark:text-blue-200 font-bold uppercase tracking-[0.2em]">Cross-Border Clearing Hub</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 relative z-10">
          <div className="flex items-center gap-2 px-3 py-1 bg-black/20 rounded-lg border border-white/5">
            <Server className={`w-3.5 h-3.5 ${activeRelay === 'PRIMARY' ? 'text-green-400' : 'text-amber-400 animate-pulse'}`} />
            <span className="text-[10px] font-mono font-bold text-white uppercase">{activeRelay} RELAY ACTIVE</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleTransfer} className="p-8 space-y-8">
        {/* Transfer Type Selector */}
        <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setTransferType('STANDARD');
              setSelectedMethod(null);
              setIbanData(null);
            }}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${transferType === 'STANDARD' ? 'bg-white dark:bg-[#111] text-[#002366] dark:text-blue-400 shadow-sm' : 'text-gray-400'}`}
          >
            Credit Transfer
          </button>
          <button
            type="button"
            onClick={() => {
              setTransferType('SEPA_DIRECT_DEBIT');
              setSelectedMethod('SEPA');
              setIbanData(null);
              setCurrency('EUR');
            }}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${transferType === 'SEPA_DIRECT_DEBIT' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400'}`}
          >
            SEPA Direct Debit
          </button>
          <button
            type="button"
            onClick={() => {
              setTransferType('HSBC_GLOBAL');
              setSelectedMethod('HSBC_GLOBAL');
              setIbanData({
                isValid: true,
                countryCode: destinationCountry,
                countryName: FINANCIAL_HUB_DB[destinationCountry]?.countryName || 'Hong Kong',
                currency: FINANCIAL_HUB_DB[destinationCountry]?.currency || 'HKD',
                bankName: 'HSBC Global Network',
                bic: 'HSBCHKHXXXX'
              });
              setCurrency(FINANCIAL_HUB_DB[destinationCountry]?.currency || 'HKD');
            }}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${transferType === 'HSBC_GLOBAL' ? 'bg-[#002366] dark:bg-blue-700 text-white shadow-sm' : 'text-gray-400'}`}
          >
            HSBC Global
          </button>
        </div>

        {/* Step 1: Destination */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <label className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5" /> {transferType === 'HSBC_GLOBAL' ? 'HSBC Account Number' : transferType === 'SEPA_DIRECT_DEBIT' ? 'Debtor Account Identifier (IBAN)' : 'Target Account Identifier (IBAN)'}
            </label>
            <div className="relative">
              <button 
                type="button"
                onClick={() => setShowRecipientDropdown(!showRecipientDropdown)}
                className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  showRecipientDropdown 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                    : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                }`}
              >
                <Search className="w-3 h-3" /> {showRecipientDropdown ? 'Close' : 'Saved Recipients'}
              </button>
              
              {showRecipientDropdown && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                      <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search recipients..."
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-xs font-bold outline-none focus:border-blue-600 dark:text-white transition-colors"
                      />
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto custom-scrollbar">
                    {savedRecipients.filter(r => (r.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (r.iban || '').includes(searchQuery.toUpperCase())).length > 0 ? (
                      savedRecipients
                        .filter(r => (r.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (r.iban || '').includes(searchQuery.toUpperCase()))
                        .map(r => (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => selectRecipient(r)}
                            className="w-full px-4 py-3 text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors border-b border-gray-50 dark:border-gray-800 last:border-0"
                          >
                            <p className="text-xs font-black text-gray-900 dark:text-white uppercase truncate">{r.name}</p>
                            <p className="text-[10px] font-mono text-gray-400 dark:text-gray-500 truncate">{r.iban}</p>
                          </button>
                        ))
                    ) : (
                      <div className="p-8 text-center">
                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">No recipients found</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="relative group">
            {transferType === 'HSBC_GLOBAL' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <input 
                    type="text" 
                    value={recipientAccountNumber}
                    onChange={(e) => setRecipientAccountNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. 123-456789-001"
                    className="w-full pl-5 pr-12 py-5 bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-100 dark:border-gray-800 rounded-2xl text-base font-mono font-bold text-black dark:text-white focus:bg-white dark:focus:bg-[#1a1a1a] focus:border-[#002366] dark:focus:border-blue-600 outline-none transition-all"
                    required
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <CheckCircle2 className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                  </div>
                </div>
                <div className="relative">
                  <select
                    value={destinationCountry}
                    onChange={(e) => {
                      setDestinationCountry(e.target.value);
                      const hub = FINANCIAL_HUB_DB[e.target.value];
                      setIbanData({
                        isValid: true,
                        countryCode: e.target.value,
                        countryName: hub?.countryName || 'Hong Kong',
                        currency: hub?.currency || 'HKD',
                        bankName: 'HSBC Global Network',
                        bic: 'HSBCHKHXXXX'
                      });
                      setCurrency(hub?.currency || 'HKD');
                    }}
                    className="w-full px-5 py-5 bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-100 dark:border-gray-800 rounded-2xl text-sm font-bold text-black dark:text-white appearance-none outline-none focus:bg-white dark:focus:bg-[#1a1a1a] focus:border-[#002366] dark:focus:border-blue-600 transition-all"
                  >
                    {Object.entries(FINANCIAL_HUB_DB).map(([code, data]) => (
                      <option key={code} value={code}>{data.countryName}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                </div>
              </div>
            ) : (
              <>
                <input 
                  type="text" 
                  value={recipientIban}
                  onChange={(e) => setRecipientIban(e.target.value.toUpperCase())}
                  placeholder="e.g. DE64 3003 ..."
                  className="w-full pl-5 pr-12 py-5 bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-100 dark:border-gray-800 rounded-2xl text-base font-mono font-bold text-black dark:text-white focus:bg-white dark:focus:bg-[#1a1a1a] focus:border-[#002366] dark:focus:border-blue-600 outline-none transition-all"
                  required
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  {isValidating ? <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" /> : ibanData?.isValid && <CheckCircle2 className="w-6 h-6 text-green-500 dark:text-green-400" />}
                </div>
              </>
            )}
          </div>

          {ibanData && (
            <div className="mt-8 animate-in fade-in slide-in-from-top-4 duration-500">
              <h3 className="text-gray-900 dark:text-white font-bold text-lg mb-4 px-1">IBAN Hub Discovery</h3>
              <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-[14px] border-collapse">
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {[
                      { label: 'Clearing Status', value: 'Authorized' },
                      { label: 'IBAN (Canonical)', value: ibanData.iban },
                      { label: 'Hub Location', value: ibanData.countryName },
                      { label: 'ISO-3166', value: ibanData.countryCode },
                      { label: 'Native Currency', value: ibanData.currency },
                      { label: 'Regulatory Body', value: ibanData.centralBankName },
                      { label: 'Membership', value: ibanData.membership },
                      { label: 'SEPA Status', value: ibanData.isSepa === 'Yes' ? 'Supported' : 'Unavailable' },
                      { label: 'SWIFT Status', value: ibanData.isSwift === 'Yes' ? 'Connected' : 'External Relay' },
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <td className="py-4 px-6 text-gray-600 dark:text-gray-400 font-medium w-[40%] border-r border-gray-100 dark:border-gray-800">{row.label}</td>
                        <td className="py-4 px-6 text-gray-900 dark:text-white font-medium">{row.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Protocol Selection */}
        {transferType === 'STANDARD' && ibanData && ibanData.isSepa === 'Yes' && ibanData.isSwift === 'Yes' && (
          <div className="animate-in slide-in-from-top-2 duration-300">
             <div className="bg-blue-50 dark:bg-blue-900/10 border-2 border-blue-100 dark:border-blue-900/30 rounded-3xl p-6">
                <p className="text-center text-[10px] font-black text-blue-900 dark:text-blue-300 uppercase tracking-widest mb-4">Dual Network Protocol Detected - Select Path</p>
                <div className="grid grid-cols-2 gap-4">
                   <button 
                     type="button"
                     onClick={() => setSelectedMethod('SEPA')}
                     className={`py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${selectedMethod === 'SEPA' ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'bg-white dark:bg-[#1a1a1a] text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'}`}
                   >
                     SEPA Path
                   </button>
                   <button 
                     type="button"
                     onClick={() => setSelectedMethod('SWIFT')}
                     className={`py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${selectedMethod === 'SWIFT' ? 'bg-[#002366] dark:bg-blue-700 text-white shadow-xl shadow-blue-900/20' : 'bg-white dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800'}`}
                   >
                     SWIFT Path
                   </button>
                </div>
             </div>
          </div>
        )}

        {/* Unified Mandatory Information Form (SEPA/SWIFT/HSBC) */}
        {selectedMethod && (
          <div className="animate-in zoom-in-95 duration-500 space-y-6">
             <div className={`border-2 border-dashed rounded-[2rem] p-8 space-y-6 ${selectedMethod === 'HSBC_GLOBAL' ? 'bg-indigo-50/30 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/30' : selectedMethod === 'SEPA' ? 'bg-blue-50/30 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30' : 'bg-amber-50/30 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30'}`}>
                <div className="flex items-center justify-between mb-2">
                   <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${selectedMethod === 'HSBC_GLOBAL' ? 'bg-indigo-600' : selectedMethod === 'SEPA' ? 'bg-blue-600' : 'bg-[#002366] dark:bg-blue-700'}`}><User className="w-4 h-4" /></div>
                      <h4 className="font-black text-xs text-gray-900 dark:text-white uppercase tracking-widest">{transferType === 'SEPA_DIRECT_DEBIT' ? 'Mandatory Debtor Information' : 'Mandatory Recipient Information'}</h4>
                   </div>
                   {transferType === 'SEPA_DIRECT_DEBIT' && (
                      <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter shadow-lg shadow-blue-600/20 flex items-center gap-1.5">
                         <ShieldCheck className="w-3 h-3" /> SEPA CORE Direct Debit
                      </div>
                   )}
                   {selectedMethod === 'HSBC_GLOBAL' && (
                      <div className="bg-indigo-600 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter shadow-lg shadow-indigo-600/20 flex items-center gap-1.5">
                         <Zap className="w-3 h-3" /> HSBC Global Transfer: Instant
                      </div>
                   )}
                   {selectedMethod === 'SWIFT' && (
                      <div className="bg-amber-600 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter shadow-lg shadow-amber-600/20 flex items-center gap-1.5">
                         <ShieldCheck className="w-3 h-3" /> Fee Protocol: OUR (Sender Pays)
                      </div>
                   )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">{transferType === 'SEPA_DIRECT_DEBIT' ? 'Legal Full Name (Debtor)' : 'Legal Full Name (Beneficiary)'}</label>
                      <input 
                        type="text" 
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        placeholder={transferType === 'SEPA_DIRECT_DEBIT' ? "e.g. Acme Corp" : "e.g. Sarah Jenkins S.A."}
                        className="w-full px-4 py-4 bg-white dark:bg-[#1a1a1a] border-2 border-gray-100 dark:border-gray-800 rounded-xl text-sm font-bold text-black dark:text-white focus:border-[#002366] dark:focus:border-blue-600 outline-none transition-colors"
                        required
                      />
                   </div>
                   {transferType === 'SEPA_DIRECT_DEBIT' ? (
                     <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Mandate Reference</label>
                       <input 
                         type="text" 
                         value={mandateReference}
                         onChange={(e) => setMandateReference(e.target.value.toUpperCase())}
                         placeholder="MANDATE-REF-123"
                         className="w-full px-4 py-4 bg-white dark:bg-[#1a1a1a] border-2 border-gray-100 dark:border-gray-800 rounded-xl text-sm font-mono font-bold text-black dark:text-white focus:border-[#002366] dark:focus:border-blue-600 outline-none transition-colors"
                         required
                       />
                     </div>
                   ) : (
                     <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">BIC / SWIFT Routing Code</label>
                       <input 
                         type="text" 
                         value={bicCode}
                         onChange={(e) => setBicCode(e.target.value.toUpperCase())}
                         placeholder="BANKDEFFXXX"
                         className="w-full px-4 py-4 bg-white dark:bg-[#1a1a1a] border-2 border-gray-100 dark:border-gray-800 rounded-xl text-sm font-mono font-bold text-black dark:text-white focus:border-[#002366] dark:focus:border-blue-600 outline-none transition-colors"
                         required
                       />
                     </div>
                   )}
                   <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">{transferType === 'SEPA_DIRECT_DEBIT' ? 'Debtor Account Number' : 'Recipient Account Number'}</label>
                      <input 
                        type="text" 
                        value={recipientAccountNumber}
                        onChange={(e) => setRecipientAccountNumber(e.target.value.toUpperCase())}
                        placeholder="Enter Local Account Number"
                        className="w-full px-4 py-4 bg-white dark:bg-[#1a1a1a] border-2 border-gray-100 dark:border-gray-800 rounded-xl text-sm font-mono font-bold text-black dark:text-white focus:border-[#002366] dark:focus:border-blue-600 outline-none transition-colors"
                        required
                      />
                   </div>
                   <div className="md:col-span-2 flex items-center gap-3 px-1 py-2">
                      <div className="relative flex items-center">
                        <input 
                          type="checkbox" 
                          id="shouldSaveRecipient"
                          checked={shouldSaveRecipient}
                          onChange={(e) => setShouldSaveRecipient(e.target.checked)}
                          className="w-5 h-5 rounded-lg border-2 border-gray-200 dark:border-gray-700 text-blue-600 focus:ring-blue-500 dark:bg-gray-800 transition-all cursor-pointer"
                        />
                      </div>
                      <label htmlFor="shouldSaveRecipient" className="text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest cursor-pointer select-none hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        Save to institutional address book for future clearing
                      </label>
                   </div>
                   <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">Reason for Payment {ibanData?.countryCode === 'PK' && <span className="text-red-500">(MANDATORY FOR SBP)</span>}</label>
                      <div className="relative">
                        <select 
                          value={paymentReason}
                          onChange={(e) => setPaymentReason(e.target.value)}
                          className={`w-full px-4 py-4 bg-white dark:bg-[#1a1a1a] border-2 rounded-xl text-sm font-bold text-black dark:text-white appearance-none outline-none transition-colors ${ibanData?.countryCode === 'PK' ? 'border-amber-200 dark:border-amber-900/50 focus:border-amber-500' : 'border-gray-100 dark:border-gray-800 focus:border-[#002366] dark:focus:border-blue-600'}`}
                        >
                          {PAYMENT_REASONS.map(reason => <option key={reason} value={reason}>{reason}</option>)}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                      </div>
                      {ibanData?.countryCode === 'PK' && (
                        <p className="text-[9px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-tight px-1">
                          Warning: Incorrect codes may result in funds being frozen by the State Bank of Pakistan (SBP).
                        </p>
                      )}
                   </div>
                </div>

                {selectedMethod === 'SEPA' && (
                   <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest px-1">SEPA Protocol Speed</label>
                    <div className="relative">
                      <select 
                        value={sepaSpeed}
                        onChange={(e) => setSepaSpeed(e.target.value as any)}
                        className="w-full px-6 py-4 bg-white dark:bg-[#1a1a1a] border-2 border-gray-100 dark:border-gray-800 rounded-2xl text-xs font-black uppercase text-black dark:text-white appearance-none outline-none focus:border-blue-600 transition-colors"
                      >
                        <option value="standard">Standard (Max 1 Business Day) - 0.5% Fee</option>
                        <option value="instant">Instant (Under 10 Seconds) - 3.0% Fee</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                    </div>
                   </div>
                )}
             </div>
          </div>
        )}

        {/* Financial Details */}
        {selectedMethod && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-2 duration-500">
            <div className="space-y-4">
              <label className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2 px-1">
                <Activity className="w-3.5 h-3.5" /> Principal Amount
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                  placeholder="0.00"
                  className="w-full px-6 py-6 bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-100 dark:border-gray-800 rounded-3xl text-3xl font-black text-black dark:text-white tracking-tighter focus:bg-white dark:focus:bg-[#1a1a1a] focus:border-[#002366] dark:focus:border-blue-600 outline-none transition-all"
                  required
                />
                {amount && (
                   <div className="flex justify-between items-center mt-2 px-2">
                      <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase">Settlement: €{eurEquivalent} EUR</p>
                      <p className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase">Fixed Fee: {getFee()} {currency}</p>
                   </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2 px-1">
                <Wallet className="w-3.5 h-3.5" /> Transfer Currency
              </label>
              <div className="relative">
                <select 
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-6 py-6 bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-100 dark:border-gray-800 rounded-3xl text-3xl font-black text-black dark:text-white tracking-tighter focus:bg-white dark:focus:bg-[#1a1a1a] focus:border-[#002366] dark:focus:border-blue-600 appearance-none outline-none cursor-pointer transition-all"
                >
                  {SUPPORTED_CURRENCIES.map(curr => <option key={curr} value={curr}>{curr}</option>)}
                </select>
                <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400 dark:text-gray-500 pointer-events-none" />
              </div>
              {ibanData?.countryCode === 'PK' && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span className="text-[10px] font-black text-blue-900 dark:text-blue-200 uppercase tracking-widest">Expert Tip: Currency Choice</span>
                  </div>
                  <p className="text-[10px] text-blue-700 dark:text-blue-400 font-medium leading-relaxed">
                    Sending <strong>EUR</strong> usually results in a better exchange rate if the receiving bank (HBL, MCB, Alfalah) handles the conversion. Sending <strong>PKR</strong> gives you certainty on the final amount received.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
      <TransferConfirmationModal 
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmTransfer}
        details={{
          amount: amount,
          currency: currency,
          recipientName: recipientName || (ibanData?.bankName || "Verified Participant"),
          recipientIban: recipientIban,
          bic: bicCode || (ibanData?.bic || "SWIFXXXX"),
          fee: getFee(),
          timeframe: getTimeframe(),
          paymentReason: paymentReason,
          eurEquivalent: eurEquivalent,
          method: selectedMethod || 'STANDARD'
        }}
      />

      {isProcessing && (
          <div className="bg-gray-900 rounded-2xl p-4 font-mono text-[10px] text-green-400 space-y-1.5 border border-gray-800 shadow-inner overflow-hidden">
             <div className="flex items-center justify-between opacity-50 mb-2 border-b border-gray-800 pb-1">
               <div className="flex items-center gap-2">
                 <Terminal className="w-3 h-3 text-green-500" />
                 <span>[NETWORK_SESSION: RELAY_SYNC_ACTIVE]</span>
               </div>
               <span className="text-[8px]">NODE_ID: GIBK-LN-09</span>
             </div>
             
             <div className="space-y-1 transition-all">
                {processStep >= 1 && <div className="animate-in slide-in-from-left duration-300">&gt; AUTHENTICATING {selectedMethod} CHANNEL... <span className="text-white">OK</span></div>}
                {processStep >= 2 && <div className="animate-in slide-in-from-left duration-300">&gt; ESTABLISHING AES-256 TUNNEL... <span className="text-white">OK</span></div>}
                {processStep >= 3 && <div className="animate-in slide-in-from-left duration-300">&gt; {transferType === 'SEPA_DIRECT_DEBIT' ? 'VERIFYING DEBTOR' : 'VERIFYING BENEFICIARY'}: {recipientName.toUpperCase()}... <span className="text-white">OK</span></div>}
                {processStep >= 4 && <div className="animate-in slide-in-from-left duration-300">&gt; COMPLIANCE AML VALIDATION... <span className="text-white">PASSED</span></div>}
                {processStep >= 5 && <div className="animate-in slide-in-from-left duration-300">&gt; ENCRYPTING CLEARING PAYLOAD... <span className="text-white">OK</span></div>}
                {processStep >= 6 && <div className="animate-in slide-in-from-left duration-300">&gt; BROADCASTING TO {ibanData?.countryCode || 'INTL'} NODE... <span className="text-white">OK</span></div>}
                {processStep >= 7 && <div className="animate-in slide-in-from-left duration-300">&gt; FINALIZING GLOBAL LEDGER SYNC... <span className="text-white">OK</span></div>}
                
                {processStep < 7 && (
                  <div className="flex items-center gap-2 text-blue-400 animate-pulse pt-1">
                     <Loader2 className="w-3 h-3 animate-spin" /> 
                     <span>
                        {processStep === 0 && "INITIATING..."}
                        {processStep === 1 && "SECURING TUNNEL..."}
                        {processStep === 2 && "HANDSHAKING..."}
                        {processStep === 3 && "VALIDATING COMPLIANCE..."}
                        {processStep === 4 && "PREPARING PAYLOAD..."}
                        {processStep === 5 && "TRANSMITTING..."}
                        {processStep === 6 && "AWAITING ACK..."}
                     </span>
                  </div>
                )}
             </div>
          </div>
        )}

        <button 
          type="submit"
          disabled={!ibanData?.isValid || !selectedMethod || isProcessing || isValidating || !amount || !recipientName || (selectedMethod !== 'HSBC_GLOBAL' && transferType !== 'SEPA_DIRECT_DEBIT' && !bicCode) || (transferType === 'SEPA_DIRECT_DEBIT' && !mandateReference)}
          className={`w-full py-6 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.25em] shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-40 ${
            selectedMethod === 'HSBC_GLOBAL' ? 'bg-indigo-600 hover:bg-indigo-700' : selectedMethod === 'SEPA' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#002366] hover:bg-blue-900'
          }`}
        >
          {isProcessing ? (
            <div className="flex items-center gap-3">
               <Loader2 className="w-6 h-6 animate-spin" />
               <span>{transferType === 'SEPA_DIRECT_DEBIT' ? 'Clearing Protocol Active: DEBIT' : 'Clearing Protocol Active'}</span>
            </div>
          ) : isValidating ? (
            <div className="flex items-center gap-3">
               <Loader2 className="w-6 h-6 animate-spin" />
               <span>Validating Node...</span>
            </div>
          ) : (
            <span className="flex items-center gap-2">
              {transferType === 'SEPA_DIRECT_DEBIT' ? 'Authorize SEPA Direct Debit' : `Authorize ${selectedMethod === 'HSBC_GLOBAL' ? 'HSBC Global' : selectedMethod} Transmission`} <ChevronRight className="w-5 h-5" />
            </span>
          )}
        </button>

        {showSavePrompt && (
          <div className="mt-6 animate-in slide-in-from-top-4 duration-500">
            <div className="bg-green-50 dark:bg-green-900/10 border-2 border-green-100 dark:border-green-900/30 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-green-600 p-3 rounded-2xl text-white shadow-lg shadow-green-600/20">
                  <Save className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-xs text-green-900 dark:text-green-200 uppercase tracking-widest">Save this Recipient?</h4>
                  <p className="text-[10px] text-green-700 dark:text-green-400 font-bold uppercase tracking-tight">Add to your institutional address book for future clearing.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <button 
                  type="button"
                  onClick={() => setShowSavePrompt(false)}
                  className="flex-1 md:flex-none px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  Discard
                </button>
                <button 
                  type="button"
                  onClick={handleSaveRecipient}
                  disabled={isSavingRecipient}
                  className="flex-1 md:flex-none px-8 py-3 bg-green-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-green-600/20 hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                >
                  {isSavingRecipient ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                  Save Recipient
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default TransferForm;

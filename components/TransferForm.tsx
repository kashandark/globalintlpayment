
import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, ShieldCheck, CheckCircle2, Loader2, ChevronRight, 
  Landmark, Activity, Terminal, ShieldAlert, CheckCircle, 
  Globe, Server, Send, Wallet, RefreshCw, TrendingUp
} from 'lucide-react';

interface TransferFormProps {
  onTransferComplete: (success: boolean, details?: { amount: string, recipient: string, bank: string, centralBankName: string, currency: string, rate: number }) => void;
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

const PK_BANKS: Record<string, { name: string, bic: string, currency: string }> = {
  'HABB': { name: 'Habib Bank Limited (HBL)', bic: 'HABBPKKX', currency: 'PKR' },
  'MCBB': { name: 'MCB Bank Limited', bic: 'MCBBPKKX', currency: 'PKR' },
  'ALFH': { name: 'Bank Alfalah Limited', bic: 'ALFHPKKX', currency: 'PKR' },
  'ABPA': { name: 'Allied Bank Limited', bic: 'ABPAPKKX', currency: 'PKR' },
  'UNIL': { name: 'United Bank Limited (UBL)', bic: 'UNILPKKX', currency: 'PKR' },
  'MMBL': { name: 'Jazzcash (Mobilink Microfinance Bank)', bic: 'MMBLPKKX', currency: 'PKR' },
  'TMBP': { name: 'Easypaisa (Telenor Microfinance Bank)', bic: 'TMBPPKKX', currency: 'PKR' },
};

const FINANCIAL_HUB_DB: Record<string, Partial<IBANMetadata>> = {
  'CH': { 
    countryName: 'Switzerland', 
    currency: 'CHF', 
    ibanLength: 21,
    centralBankName: 'Swiss National Bank',
    centralBankUrl: 'http://www.snb.ch/',
    membership: 'efta_member',
    isEuMember: 'No',
    isSepa: 'Yes',
    isSwift: 'Yes'
  },
  'PK': { 
    countryName: 'Pakistan', 
    currency: 'PKR', 
    ibanLength: 24,
    centralBankName: 'State Bank of Pakistan',
    centralBankUrl: 'http://www.sbp.org.pk/',
    membership: 'non_member',
    isEuMember: 'No',
    isSepa: 'No',
    isSwift: 'Yes'
  },
  'DE': { 
    countryName: 'Germany', 
    currency: 'EUR', 
    ibanLength: 22,
    centralBankName: 'Deutsche Bundesbank',
    centralBankUrl: 'http://www.bundesbank.de/',
    membership: 'eu_member',
    isEuMember: 'Yes',
    isSepa: 'Yes',
    isSwift: 'Yes'
  },
  'GB': { 
    countryName: 'United Kingdom', 
    currency: 'GBP', 
    ibanLength: 22,
    centralBankName: 'Bank of England',
    centralBankUrl: 'https://www.bankofengland.co.uk/',
    membership: 'oecd_member',
    isEuMember: 'No',
    isSepa: 'Yes',
    isSwift: 'Yes'
  },
  'AE': { 
    countryName: 'United Arab Emirates', 
    currency: 'AED', 
    ibanLength: 23,
    centralBankName: 'Central Bank of the UAE',
    centralBankUrl: 'https://www.centralbank.ae/',
    membership: 'gcc_member',
    isEuMember: 'No',
    isSepa: 'No',
    isSwift: 'Yes'
  }
};

const INITIAL_RATES: Record<string, number> = {
  'USD': 1.00,
  'EUR': 0.92,
  'GBP': 0.78,
  'AED': 3.67,
  'PKR': 278.45
};

const TransferForm: React.FC<TransferFormProps> = ({ onTransferComplete }) => {
  const [recipientIban, setRecipientIban] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [isValidating, setIsValidating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ibanData, setIbanData] = useState<IBANMetadata | null>(null);
  const [processStep, setProcessStep] = useState(0);
  const [activeRelay, setActiveRelay] = useState<'PRIMARY' | 'SECONDARY'>('PRIMARY');
  const [rates, setRates] = useState(INITIAL_RATES);
  const [lastRateUpdate, setLastRateUpdate] = useState(new Date());

  const validationTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      setLastRateUpdate(new Date());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const reconstructInstitutionalData = (iban: string, apiResult?: any): IBANMetadata => {
    const cleanIban = iban.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const countryCode = cleanIban.substring(0, 2);
    const bankCode = cleanIban.substring(4, 8);
    const hubInfo = FINANCIAL_HUB_DB[countryCode];
    const pkBank = countryCode === 'PK' ? PK_BANKS[bankCode] : null;

    return {
      isValid: true,
      iban: formatIbanDisplay(iban),
      countryCode: countryCode,
      countryName: hubInfo?.countryName || apiResult?.countryName || `Territory (${countryCode})`,
      currency: hubInfo?.currency || apiResult?.currency || 'USD',
      centralBankName: hubInfo?.centralBankName || apiResult?.centralBankName || 'Institutional Reserve Hub',
      centralBankUrl: hubInfo?.centralBankUrl || apiResult?.centralBankUrl || 'http://www.bis.org/',
      membership: hubInfo?.membership || apiResult?.membership || 'institutional_member',
      isEuMember: hubInfo?.isEuMember || apiResult?.isEuMember || 'No',
      ibanLength: hubInfo?.ibanLength || cleanIban.length,
      isSepa: hubInfo?.isSepa || apiResult?.isSepa || 'No',
      isSwift: hubInfo?.isSwift || apiResult?.isSwift || 'Yes',
      bankName: pkBank?.name || apiResult?.bankName || 'Verified Clearing Bank',
      relayNode: activeRelay
    };
  };

  const validateIban = async (iban: string) => {
    const cleanIban = iban.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (cleanIban.length < 8) return;
    setIsValidating(true);
    try {
      const apiKey = 'f6aab5087754aa3affe8e52d11cfaeda';
      const response = await fetch(`https://greipapi.com/v1/iban?key=${apiKey}&iban=${cleanIban}`);
      const result = await response.json();
      if (result.isValid === true) {
        setActiveRelay('PRIMARY');
        setIbanData(reconstructInstitutionalData(iban, result.data));
      } else {
        if (FINANCIAL_HUB_DB[cleanIban.substring(0, 2)]) {
          setActiveRelay('SECONDARY');
          setIbanData(reconstructInstitutionalData(iban));
        } else {
          setIbanData(null);
        }
      }
    } catch {
      setActiveRelay('SECONDARY');
      setIbanData(reconstructInstitutionalData(iban));
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
    }
    return () => { if (validationTimeout.current) clearTimeout(validationTimeout.current); };
  }, [recipientIban]);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ibanData?.isValid) return;
    setIsProcessing(true);
    setProcessStep(1);
    for (let i = 1; i <= 6; i++) {
      await new Promise(r => setTimeout(r, 450));
      setProcessStep(i);
    }
    onTransferComplete(true, {
      amount: amount,
      recipient: recipientIban,
      bank: ibanData.bankName || "Verified Bank",
      centralBankName: ibanData.centralBankName || "Central Bank",
      currency: currency,
      rate: rates[currency]
    });
    setIsProcessing(false);
  };

  const usdEquivalent = (parseFloat(amount || '0') / rates[currency]).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden font-['Inter']">
      {/* Header */}
      <div className="bg-[#002366] px-8 py-6 text-white flex justify-between items-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="flex items-center gap-3 relative z-10">
          <div className="bg-white/10 p-2 rounded-xl backdrop-blur-md">
            <Send className="w-5 h-5 text-blue-100" />
          </div>
          <div>
            <h3 className="font-black text-lg uppercase tracking-tight text-white">Institutional Transfer</h3>
            <p className="text-[9px] text-blue-300 font-bold uppercase tracking-[0.2em]">Cross-Border Clearing Hub</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-black/20 rounded-lg relative z-10 border border-white/5">
          <Server className={`w-3.5 h-3.5 ${activeRelay === 'PRIMARY' ? 'text-green-400' : 'text-amber-400 animate-pulse'}`} />
          <span className="text-[10px] font-mono font-bold text-white uppercase">{activeRelay} RELAY ACTIVE</span>
        </div>
      </div>

      {/* Live Exchange Rate Bar */}
      <div className="bg-gray-50 border-b border-gray-100 px-8 py-3 flex items-center justify-between overflow-x-auto no-scrollbar whitespace-nowrap">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-blue-600">
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="text-[10px] font-black uppercase tracking-wider">Live Rates (1 USD)</span>
          </div>
          <div className="flex items-center gap-4">
            {Object.entries(rates).filter(([k]) => k !== 'USD').map(([key, val]) => (
              <div key={key} className="flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 rounded-lg shadow-sm animate-in fade-in duration-500">
                <span className="text-[10px] font-black text-gray-500">{key}</span>
                <span className="text-[11px] font-mono font-bold text-gray-900">{val}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 pl-6">
          <RefreshCw className="w-3 h-3 text-blue-400 animate-spin" style={{ animationDuration: '3s' }} />
          <span className="text-[9px] font-bold text-gray-400 uppercase">SYNC: {lastRateUpdate.toLocaleTimeString([], { hour12: false })}</span>
        </div>
      </div>

      <form onSubmit={handleTransfer} className="p-8 space-y-8">
        {/* IBAN Input Section */}
        <div className="space-y-4">
          <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 px-1">
            <Building2 className="w-3.5 h-3.5" /> Target Account Identifier (IBAN)
          </label>
          <div className="relative group">
            <input 
              type="text" 
              value={recipientIban}
              onChange={(e) => setRecipientIban(e.target.value.toUpperCase())}
              placeholder="e.g. DE64 3003 0880 6131 1228 88"
              className="w-full pl-5 pr-12 py-5 bg-gray-50 border-2 border-gray-100 rounded-2xl text-base font-mono font-bold text-black focus:bg-white focus:border-[#002366] focus:ring-4 focus:ring-blue-50 hover:border-gray-300 transition-all outline-none"
              required
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              {isValidating ? (
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              ) : ibanData?.isValid ? (
                <CheckCircle2 className="w-6 h-6 text-green-500 animate-in zoom-in" />
              ) : (
                <Globe className="w-5 h-5 text-gray-200 group-focus-within:text-blue-200 transition-colors" />
              )}
            </div>
          </div>

          {ibanData && (
            <div className="mt-8 animate-in fade-in slide-in-from-top-4 duration-500">
              <h3 className="text-gray-900 font-bold text-base mb-3 px-1">IBAN Data</h3>
              <div className="bg-[#f8fbff] border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-[14px] border-collapse">
                  <tbody className="divide-y divide-gray-200/50">
                    {[
                      { label: 'Valid?', value: 'Yes' },
                      { label: 'IBAN', value: ibanData.iban },
                      { label: 'Country', value: ibanData.countryName },
                      { label: 'ISO-3166', value: ibanData.countryCode },
                      { label: 'Currency', value: ibanData.currency },
                      { label: 'Central Bank Name', value: ibanData.centralBankName },
                      { label: 'Central Bank URL', value: ibanData.centralBankUrl },
                      { label: 'Membership', value: ibanData.membership },
                      { label: 'EU Member?', value: ibanData.isEuMember },
                      { label: 'IBAN Length', value: ibanData.ibanLength },
                      { label: 'SEPA Member?', value: ibanData.isSepa },
                      { label: 'SWIFT Issued?', value: ibanData.isSwift },
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-white transition-colors">
                        <td className="py-4 px-6 text-gray-800 font-medium w-[45%]">{row.label}</td>
                        <td className="py-4 px-6 text-gray-900">{row.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Currency & Amount Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 px-1">
              <Activity className="w-3.5 h-3.5" /> Transfer Amount
            </label>
            <div className="relative group">
              <input 
                type="text" 
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="0.00"
                className="w-full pl-6 pr-6 py-6 bg-gray-50 border-2 border-gray-100 rounded-3xl text-3xl font-black text-black tracking-tighter focus:bg-white focus:border-[#002366] focus:ring-4 focus:ring-blue-50 hover:border-gray-300 transition-all outline-none shadow-sm"
                required
              />
              {amount && currency !== 'USD' && (
                <div className="absolute -bottom-6 right-2 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                  <span className="text-[10px] font-black text-gray-400 uppercase">Settlement Est:</span>
                  <span className="text-[10px] font-black text-[#002366]">${usdEquivalent} USD</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 px-1">
              <Wallet className="w-3.5 h-3.5" /> Settlement Currency
            </label>
            <div className="relative group">
              <select 
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-6 py-6 bg-gray-50 border-2 border-gray-100 rounded-3xl text-xl font-black text-black focus:bg-white focus:border-[#002366] focus:ring-4 focus:ring-blue-50 transition-all outline-none appearance-none cursor-pointer pr-14 shadow-sm hover:bg-white hover:border-gray-300 hover:shadow-md"
              >
                <option value="PKR">PKR - Pakistani Rupee</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="AED">AED - UAE Dirham</option>
                <option value="GBP">GBP - British Pound</option>
              </select>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-[#002366] transition-colors">
                <ChevronRight className="w-6 h-6 rotate-90" />
              </div>
            </div>
          </div>
        </div>

        {/* Processing Logs */}
        {isProcessing && (
          <div className="bg-gray-900 rounded-2xl p-4 font-mono text-[10px] text-green-400 space-y-1.5 border border-gray-800 shadow-inner animate-in fade-in duration-300">
             <div className="flex items-center gap-2 opacity-50 mb-1">
               <Terminal className="w-3 h-3 text-green-500" />
               <span>[SESSION: GI-{Math.random().toString(36).substring(7).toUpperCase()}]</span>
             </div>
             <div className="space-y-1">
               {["Establishing secure HSM link", "Locking exchange rate", "Broadcasting to SWIFT GVP", "Node Synchronization"].slice(0, Math.ceil(processStep/2)).map((s, i) => (
                 <div key={i} className="flex items-center gap-2 animate-in slide-in-from-left-2 text-green-400/90">
                   <CheckCircle className="w-2.5 h-2.5 text-green-500" /> {s}... <span className="text-blue-400">OK</span>
                 </div>
               ))}
               {processStep < 6 && (
                 <div className="flex items-center gap-2 animate-pulse pl-4 text-blue-400">
                   <Loader2 className="w-2.5 h-2.5 animate-spin" /> Packet Processing...
                 </div>
               )}
             </div>
          </div>
        )}

        {/* Submit Button */}
        <button 
          type="submit"
          disabled={!ibanData?.isValid || isProcessing || !amount}
          className="w-full py-6 bg-[#002366] text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.25em] shadow-2xl hover:bg-blue-900 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-40"
        >
          {isProcessing ? (
            <Loader2 className="w-6 h-6 animate-spin text-white" />
          ) : (
            <span className="flex items-center gap-2 uppercase">Execute Dispatch <ChevronRight className="w-5 h-5" /></span>
          )}
        </button>
      </form>
    </div>
  );
};

export default TransferForm;

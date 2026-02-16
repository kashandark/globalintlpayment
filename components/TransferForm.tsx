
import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, ShieldCheck, CheckCircle2, Loader2, ChevronRight, 
  Landmark, Activity, Terminal, ShieldAlert, CheckCircle, 
  Globe, Server, Send, Wallet, RefreshCw, TrendingUp, Zap, Clock, User, ChevronDown
} from 'lucide-react';

interface TransferFormProps {
  onTransferComplete: (success: boolean, details?: { 
    amount: string, 
    recipient: string, 
    recipientName: string,
    bic: string,
    bank: string, 
    centralBankName: string, 
    currency: string, 
    rate: number, 
    isSepa: boolean, 
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
  'AE': { countryName: 'United Arab Emirates', currency: 'AED', ibanLength: 23, centralBankName: 'Central Bank of the UAE', centralBankUrl: 'https://www.centralbank.ae/', membership: 'gcc_member', isEuMember: 'No', isSepa: 'No', isSwift: 'Yes' }
};

const INITIAL_RATES: Record<string, number> = {
  'USD': 1.00,
  'EUR': 0.92,
  'GBP': 0.78,
  'AED': 3.67,
  'PKR': 278.45,
  'CHF': 0.89
};

const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'AED', 'PKR', 'CHF'];

const PAYMENT_REASONS = [
  'Invoice Settlement',
  'Professional Services',
  'Real Estate Purchase',
  'Inter-Institutional Transfer',
  'Capital Investment',
  'Salary / Payroll Posting',
  'Consultancy Services',
  'Software Licensing',
  'Marketing Retainer'
];

const TransferForm: React.FC<TransferFormProps> = ({ onTransferComplete }) => {
  const [recipientIban, setRecipientIban] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [bicCode, setBicCode] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [paymentReason, setPaymentReason] = useState(PAYMENT_REASONS[0]);
  
  const [selectedMethod, setSelectedMethod] = useState<'SEPA' | 'SWIFT' | null>(null);
  const [sepaSpeed, setSepaSpeed] = useState<'standard' | 'instant'>('standard');
  const [isManual, setIsManual] = useState(false);

  const [isValidating, setIsValidating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ibanData, setIbanData] = useState<IBANMetadata | null>(null);
  const [processStep, setProcessStep] = useState(0);
  const [activeRelay, setActiveRelay] = useState<'PRIMARY' | 'SECONDARY'>('PRIMARY');
  const [rates, setRates] = useState(INITIAL_RATES);

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
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const validateIban = async (iban: string) => {
    const cleanIban = iban.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (cleanIban.length < 8) return;
    setIsValidating(true);
    
    try {
      const apiKey = 'f6aab5087754aa3affe8e52d11cfaeda';
      const response = await fetch(`https://greipapi.com/v1/iban?key=${apiKey}&iban=${cleanIban}`);
      const result = await response.json();
      
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
        setIbanData(null);
        return;
      }

      setIbanData(finalData);
      if (finalData.bic && !bicCode) setBicCode(finalData.bic);

      if (finalData.currency && SUPPORTED_CURRENCIES.includes(finalData.currency)) {
        setCurrency(finalData.currency);
      } else if (finalData.isSepa === 'Yes') {
        setCurrency('EUR');
      }

      if (finalData.isSepa === 'Yes' && finalData.isSwift === 'Yes') {
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
      setSelectedMethod(null);
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
      setSelectedMethod(null);
    }
    return () => { if (validationTimeout.current) clearTimeout(validationTimeout.current); };
  }, [recipientIban]);

  const getTimeframe = () => {
    if (selectedMethod === 'SEPA') {
      return sepaSpeed === 'instant' ? "Under 10 Seconds" : "Max 1 Business Day";
    }
    return isManual ? "2 to 3 Business Days" : "1 to 5 Business Days";
  };

  const getFee = () => {
    const val = parseFloat(amount || '0');
    if (selectedMethod === 'SEPA') {
      const rate = sepaSpeed === 'instant' ? 0.03 : 0.005;
      return (val * rate).toFixed(2);
    }
    return isManual ? "15.00" : "45.00";
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ibanData?.isValid || !selectedMethod) return;
    
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
      recipientName: recipientName || (ibanData.bankName || "Verified Participant"),
      bic: bicCode || (ibanData.bic || "SWIFXXXX"),
      bank: ibanData.bankName || "Institutional Node",
      centralBankName: ibanData.centralBankName || "Reserve Hub",
      currency: currency,
      rate: rates[currency],
      isSepa: selectedMethod === 'SEPA',
      timeframe: timeframe,
      fee: fee,
      paymentReason: paymentReason,
      feeInstruction: 'OUR'
    });
    setIsProcessing(false);
  };

  // Convert to EUR base (Assuming rates are USD-based: 1 USD = 0.92 EUR)
  const eurEquivalent = ((parseFloat(amount || '0') / rates[currency]) * 0.92).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden font-['Inter']">
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
        <div className="flex flex-col items-end gap-2 relative z-10">
          <div className="flex items-center gap-2 px-3 py-1 bg-black/20 rounded-lg border border-white/5">
            <Server className={`w-3.5 h-3.5 ${activeRelay === 'PRIMARY' ? 'text-green-400' : 'text-amber-400 animate-pulse'}`} />
            <span className="text-[10px] font-mono font-bold text-white uppercase">{activeRelay} RELAY ACTIVE</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleTransfer} className="p-8 space-y-8">
        {/* Step 1: Destination (IBAN) */}
        <div className="space-y-4">
          <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 px-1">
            <Building2 className="w-3.5 h-3.5" /> Target Account Identifier (IBAN)
          </label>
          <div className="relative group">
            <input 
              type="text" 
              value={recipientIban}
              onChange={(e) => setRecipientIban(e.target.value.toUpperCase())}
              placeholder="e.g. DE64 3003 ..."
              className="w-full pl-5 pr-12 py-5 bg-gray-50 border-2 border-gray-100 rounded-2xl text-base font-mono font-bold text-black focus:bg-white focus:border-[#002366] outline-none transition-all"
              required
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              {isValidating ? <Loader2 className="w-5 h-5 text-blue-600 animate-spin" /> : ibanData?.isValid && <CheckCircle2 className="w-6 h-6 text-green-500" />}
            </div>
          </div>

          {ibanData && (
            <div className="mt-8 animate-in fade-in slide-in-from-top-4 duration-500">
              <h3 className="text-gray-900 font-bold text-lg mb-4 px-1">IBAN Hub Discovery</h3>
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-[14px] border-collapse">
                  <tbody className="divide-y divide-gray-100">
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
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-6 text-gray-600 font-medium w-[40%] border-r border-gray-100">{row.label}</td>
                        <td className="py-4 px-6 text-gray-900 font-medium">{row.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Protocol Selection */}
        {ibanData && ibanData.isSepa === 'Yes' && ibanData.isSwift === 'Yes' && (
          <div className="animate-in slide-in-from-top-2 duration-300">
             <div className="bg-blue-50 border-2 border-blue-100 rounded-3xl p-6">
                <p className="text-center text-[10px] font-black text-blue-900 uppercase tracking-widest mb-4">Dual Network Protocol Detected - Select Path</p>
                <div className="grid grid-cols-2 gap-4">
                   <button 
                     type="button"
                     onClick={() => setSelectedMethod('SEPA')}
                     className={`py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${selectedMethod === 'SEPA' ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'bg-white text-blue-600 border border-blue-200'}`}
                   >
                     SEPA Path
                   </button>
                   <button 
                     type="button"
                     onClick={() => setSelectedMethod('SWIFT')}
                     className={`py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${selectedMethod === 'SWIFT' ? 'bg-[#002366] text-white shadow-xl shadow-blue-900/20' : 'bg-white text-gray-600 border border-gray-200'}`}
                   >
                     SWIFT Path
                   </button>
                </div>
             </div>
          </div>
        )}

        {/* Unified Mandatory Information Form (SEPA/SWIFT) */}
        {selectedMethod && (
          <div className="animate-in zoom-in-95 duration-500 space-y-6">
             <div className={`border-2 border-dashed rounded-[2rem] p-8 space-y-6 ${selectedMethod === 'SEPA' ? 'bg-blue-50/30 border-blue-100' : 'bg-amber-50/30 border-amber-100'}`}>
                <div className="flex items-center justify-between mb-2">
                   <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${selectedMethod === 'SEPA' ? 'bg-blue-600' : 'bg-[#002366]'}`}><User className="w-4 h-4" /></div>
                      <h4 className="font-black text-xs text-gray-900 uppercase tracking-widest">Mandatory Recipient Information</h4>
                   </div>
                   {selectedMethod === 'SWIFT' && (
                      <div className="bg-amber-600 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter shadow-lg shadow-amber-600/20 flex items-center gap-1.5">
                         <ShieldCheck className="w-3 h-3" /> Fee Protocol: OUR (Sender Pays)
                      </div>
                   )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Legal Full Name (Beneficiary)</label>
                      <input 
                        type="text" 
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        placeholder="e.g. Sarah Jenkins S.A."
                        className="w-full px-4 py-4 bg-white border-2 border-gray-100 rounded-xl text-sm font-bold text-black focus:border-[#002366] outline-none"
                        required
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">BIC / SWIFT Routing Code</label>
                      <input 
                        type="text" 
                        value={bicCode}
                        onChange={(e) => setBicCode(e.target.value.toUpperCase())}
                        placeholder="BANKDEFFXXX"
                        className="w-full px-4 py-4 bg-white border-2 border-gray-100 rounded-xl text-sm font-mono font-bold text-black focus:border-[#002366] outline-none"
                        required
                      />
                   </div>
                   <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Reason for Payment</label>
                      <div className="relative">
                        <select 
                          value={paymentReason}
                          onChange={(e) => setPaymentReason(e.target.value)}
                          className="w-full px-4 py-4 bg-white border-2 border-gray-100 rounded-xl text-sm font-bold text-black appearance-none outline-none focus:border-[#002366]"
                        >
                          {PAYMENT_REASONS.map(reason => <option key={reason} value={reason}>{reason}</option>)}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                   </div>
                </div>

                {selectedMethod === 'SEPA' && (
                   <div className="space-y-2 pt-2 border-t border-gray-100">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">SEPA Protocol Speed</label>
                    <div className="relative">
                      <select 
                        value={sepaSpeed}
                        onChange={(e) => setSepaSpeed(e.target.value as any)}
                        className="w-full px-6 py-4 bg-white border-2 border-gray-100 rounded-2xl text-xs font-black uppercase text-black appearance-none outline-none focus:border-blue-600"
                      >
                        <option value="standard">Standard (Max 1 Business Day) - 0.5% Fee</option>
                        <option value="instant">Instant (Under 10 Seconds) - 3.0% Fee</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
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
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 px-1">
                <Activity className="w-3.5 h-3.5" /> Principal Amount
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                  placeholder="0.00"
                  className="w-full px-6 py-6 bg-gray-50 border-2 border-gray-100 rounded-3xl text-3xl font-black text-black tracking-tighter focus:bg-white focus:border-[#002366] outline-none transition-all"
                  required
                />
                {amount && (
                   <div className="flex justify-between items-center mt-2 px-2">
                      <p className="text-[10px] font-black text-blue-600 uppercase">Settlement: €{eurEquivalent} EUR</p>
                      <p className="text-[10px] font-black text-red-600 uppercase">Fixed Fee: {getFee()} {currency}</p>
                   </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 px-1">
                <Wallet className="w-3.5 h-3.5" /> Transfer Currency
              </label>
              <div className="relative">
                <select 
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-6 py-6 bg-gray-50 border-2 border-gray-100 rounded-3xl text-3xl font-black text-black tracking-tighter focus:bg-white focus:border-[#002366] appearance-none outline-none cursor-pointer"
                >
                  {SUPPORTED_CURRENCIES.map(curr => <option key={curr} value={curr}>{curr}</option>)}
                </select>
                <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        )}

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
                {processStep >= 1 && <div className="animate-in slide-in-from-left duration-300">> AUTHENTICATING {selectedMethod} CHANNEL... <span className="text-white">OK</span></div>}
                {processStep >= 2 && <div className="animate-in slide-in-from-left duration-300">> ESTABLISHING AES-256 TUNNEL... <span className="text-white">OK</span></div>}
                {processStep >= 3 && <div className="animate-in slide-in-from-left duration-300">> VERIFYING BENEFICIARY: {recipientName.toUpperCase()}... <span className="text-white">OK</span></div>}
                {processStep >= 4 && <div className="animate-in slide-in-from-left duration-300">> COMPLIANCE AML VALIDATION... <span className="text-white">PASSED</span></div>}
                {processStep >= 5 && <div className="animate-in slide-in-from-left duration-300">> ENCRYPTING CLEARING PAYLOAD... <span className="text-white">OK</span></div>}
                {processStep >= 6 && <div className="animate-in slide-in-from-left duration-300">> BROADCASTING TO {ibanData?.countryCode || 'INTL'} NODE... <span className="text-white">OK</span></div>}
                {processStep >= 7 && <div className="animate-in slide-in-from-left duration-300">> FINALIZING GLOBAL LEDGER SYNC... <span className="text-white">OK</span></div>}
                
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
          disabled={!ibanData?.isValid || !selectedMethod || isProcessing || !amount || !recipientName || !bicCode}
          className={`w-full py-6 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.25em] shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-40 ${
            selectedMethod === 'SEPA' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#002366] hover:bg-blue-900'
          }`}
        >
          {isProcessing ? (
            <div className="flex items-center gap-3">
               <Loader2 className="w-6 h-6 animate-spin" />
               <span>Clearing Protocol Active</span>
            </div>
          ) : (
            <span className="flex items-center gap-2">
              Authorize {selectedMethod} Transmission <ChevronRight className="w-5 h-5" />
            </span>
          )}
        </button>
      </form>
    </div>
  );
};

export default TransferForm;

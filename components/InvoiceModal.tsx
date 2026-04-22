
import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Printer, ShieldCheck, QrCode, 
  Layers, ZoomIn, ZoomOut, CheckCircle, Globe, FileDown, Zap, Clock, Shield
} from 'lucide-react';
import { Transaction, UserAccount } from '../api';

interface InvoiceModalProps {
  transaction: Transaction;
  onClose: () => void;
  initialTab?: 'receipt' | 'swift' | 'remittance' | 'debitNote' | 'full';
  user?: {
    name: string;
    bankEntity?: string;
    iban?: string;
    swiftCode?: string;
    accountNumber?: string;
    accounts?: UserAccount[];
  } | null;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  'USD': '$',
  'EUR': '€',
  'GBP': '£',
  'AED': 'د.إ',
  'PKR': '₨',
  'CHF': 'Fr.',
  'HKD': 'HK$',
  'QAR': 'ر.ق',
};

const InvoiceModal: React.FC<InvoiceModalProps> = ({ transaction, onClose, initialTab = 'receipt', user }) => {
  const [zoom, setZoom] = useState(0.65); 
  const containerRef = useRef<HTMLDivElement>(null);
  const printableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth - 80;
        const a4WidthPx = 794; 
        const targetZoom = Math.min(1, containerWidth / a4WidthPx);
        setZoom(Math.max(0.3, targetZoom * 0.95));
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDownloadPDF = async () => {
    const element = printableRef.current;
    if (!element) return;
    const originalTransform = element.style.transform;
    element.style.transform = 'none';
    element.classList.remove('invoice-preview-mode');
    const opt = {
      margin: 0,
      filename: `Institutional_Bundle_${transaction.recipient?.replace(/\s/g, '') || transaction.referenceId || transaction.id}.pdf`,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        letterRendering: true, 
        backgroundColor: '#ffffff',
        scrollY: 0
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'] }
    };
    const html2pdf = (window as any).html2pdf;
    if (html2pdf) {
      await html2pdf().set(opt).from(element).save();
      element.style.transform = originalTransform;
      element.classList.add('invoice-preview-mode');
    }
  };

  const symbol = CURRENCY_SYMBOLS[transaction.currency] || '$';
  const amountValue = parseFloat(transaction.amount?.replace(/,/g, '') || '0.00');
  const feeValue = parseFloat(transaction.fee?.replace(/,/g, '') || '0.00');
  const formattedAmount = amountValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const totalSettlementVal = transaction.totalSettlement || (amountValue + feeValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const displayFee = transaction.fee || "0.00";
  const isOut = transaction.type === 'out';

  // Sender Details (Dynamic from user or fallback to hardcoded if not provided)
  // If transaction has an accountId, try to find that specific account's details
  const transactionAccount = user?.accounts?.find(acc => acc.id === transaction.accountId);
  
  const USER_ACCOUNT_NAME = transactionAccount?.account_name || user?.bankEntity || user?.name || "SJ LLC";
  const USER_ACCOUNT_BANK = transactionAccount?.bank_entity || user?.bankEntity || "HSBC TRINKAUS & BURKHARDT";
  const USER_ACCOUNT_IBAN = transactionAccount?.iban || user?.iban || "DE07 3003 0880 5230 3145 96";
  const USER_ACCOUNT_BIC = transactionAccount?.swift_code || user?.swiftCode || "TUBDDEDDXXX";
  const USER_ACCOUNT_NO = transactionAccount?.account_number || user?.accountNumber || "5230314596";

  const senderName = isOut ? USER_ACCOUNT_NAME : (transaction.recipientName || transaction.name).toUpperCase();
  const senderIban = isOut ? USER_ACCOUNT_IBAN : (transaction.recipient || "N/A");
  const senderBic = isOut ? USER_ACCOUNT_BIC : (transaction.bic || "SWIFXXXX");

  const beneficiaryName = isOut ? (transaction.recipientName || transaction.name).toUpperCase() : USER_ACCOUNT_NAME;
  const beneficiaryIban = isOut ? (transaction.recipient || "N/A") : USER_ACCOUNT_IBAN;
  const beneficiaryBic = isOut ? (transaction.bic || "SWIFXXXX") : USER_ACCOUNT_BIC;

  const PageWrapper = ({ children }: { children?: React.ReactNode }) => (
    <div className="bg-white relative block p-0 overflow-hidden printable-page" style={{ width: '210mm', height: '297mm', pageBreakAfter: 'always', pageBreakInside: 'avoid' }}>
      {children}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-0 md:p-4 overflow-hidden">
      <div className="fixed inset-0 bg-gray-900/95 backdrop-blur-md no-print" onClick={onClose}></div>
      <div className="relative bg-[#f1f5f9] dark:bg-[#0a0a0a] w-full max-w-[98vw] lg:max-w-7xl h-full md:h-[95vh] overflow-hidden md:rounded-[2.5rem] flex flex-col shadow-2xl">
        
        <div className="bg-white dark:bg-[#111] border-b dark:border-gray-800 px-8 py-4 flex items-center justify-between no-print z-50">
          <div className="flex items-center gap-4">
             <button onClick={() => setZoom(z => Math.max(0.3, z-0.1))} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"><ZoomOut className="w-5 h-5 text-gray-500 dark:text-gray-400" /></button>
             <span className="text-[10px] font-black text-gray-400 dark:text-gray-500">{Math.round(zoom * 100)}%</span>
             <button onClick={() => setZoom(z => Math.min(2.0, z+0.1))} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"><ZoomIn className="w-5 h-5 text-gray-500 dark:text-gray-400" /></button>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleDownloadPDF} className="flex items-center gap-3 px-8 py-3 bg-[#002366] dark:bg-blue-700 text-white text-[11px] font-black rounded-2xl hover:bg-blue-900 dark:hover:bg-blue-600 shadow-xl uppercase tracking-widest transition-all">
              <FileDown className="w-4 h-4" /> GENERATE PDF BUNDLE
            </button>
            <button onClick={onClose} className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 bg-gray-50 dark:bg-gray-800 rounded-xl transition-all"><X className="w-6 h-6" /></button>
          </div>
        </div>

        <div ref={containerRef} className="flex-1 overflow-auto bg-gray-400/30 dark:bg-black/40 flex flex-col items-center py-20 px-4 custom-scrollbar no-print">
          <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }} className="flex flex-col gap-0 invoice-printable-target invoice-preview-mode shadow-2xl" ref={printableRef}>
            
            {/* Page 1: Official Payment Voucher */}
            <PageWrapper>
              <div className="pt-10 px-12 flex justify-between items-start border-b-8 border-[#002366] pb-6">
                <div className="flex flex-col">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-[#002366] flex items-center justify-center font-bold text-white rounded-lg text-xl">G</div>
                    <span className="text-3xl font-black text-[#002366] tracking-tight">GLOBAL INT <span className="text-blue-500">BANKING</span></span>
                  </div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Institutional Settlement Bureau</p>
                </div>
                <div className="text-right">
                  <div className="inline-block border-2 border-black px-6 py-2">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Digital Auth Code</p>
                    <p className="font-mono text-xs font-black">{transaction.referenceId}</p>
                    {transaction.utr && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">UTR Reference</p>
                        <p className="font-mono text-[10px] font-black text-blue-600">{transaction.utr}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-12 pt-10">
                <h1 className="text-center text-2xl font-black mb-8 uppercase tracking-[0.4em] text-gray-900 border-b-2 border-gray-100 pb-4">Payment Voucher</h1>
                
                <div className="grid grid-cols-2 gap-x-12 gap-y-8">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Ordering Customer</h4>
                      <p className="text-sm font-black text-gray-900">{senderName}</p>
                      <p className="text-[10px] font-mono text-gray-500">{senderIban}</p>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Originating Node</h4>
                      <p className="text-sm font-black text-gray-900">{isOut ? USER_ACCOUNT_BANK : 'GIBK Main Liquidity Pool'}</p>
                      <p className="text-[10px] font-mono text-gray-500">BIC: {senderBic}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">{transaction.isDirectDebit ? 'Debtor Identity' : 'Beneficiary Identity'}</h4>
                      <p className="text-sm font-black text-gray-900">{beneficiaryName}</p>
                      <p className="text-[10px] font-mono text-gray-500">{transaction.isHsbcGlobal ? 'HSBC INTERNAL' : beneficiaryIban}</p>
                      {(transaction.recipientAccountNumber || transaction.isHsbcGlobal) && (
                        <p className="text-[10px] font-mono text-gray-400">ACC: {transaction.recipientAccountNumber || 'N/A'}</p>
                      )}
                      {transaction.isDirectDebit && transaction.mandateReference && (
                        <p className="text-[10px] font-black text-blue-600 mt-1 uppercase tracking-tighter">MANDATE: {transaction.mandateReference}</p>
                      )}
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Destination Node</h4>
                      <p className="text-sm font-black text-gray-900">{!isOut ? USER_ACCOUNT_BANK : 'Correspondent Bank Hub'}</p>
                      <p className="text-[10px] font-mono text-gray-500">BIC: {beneficiaryBic}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 bg-[#f8fafc] p-8 rounded-3xl border border-gray-100">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Purpose of Remittance</h4>
                      <p className="text-sm font-black text-[#002366]">{transaction.paymentReason || 'Institutional Settlement'}</p>
                    </div>
                    <div className="text-right">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Transmission Date</h4>
                      <p className="text-sm font-black text-gray-900">{transaction.date}</p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center text-gray-500">
                      <span className="text-[11px] font-black uppercase tracking-widest">Net Principal Value</span>
                      <span className="text-lg font-black">{symbol}{formattedAmount}</span>
                    </div>
                    <div className="flex justify-between items-center text-red-600">
                      <span className="text-[11px] font-black uppercase tracking-widest">Clearing & Settlement Fees</span>
                      <span className="text-sm font-black">+{symbol}{transaction.fee}</span>
                    </div>
                    <div className="flex justify-between items-center pt-4 mt-2 border-t-2 border-black">
                      <span className="text-xs font-black uppercase tracking-[0.3em] text-[#002366]">Total Settlement Value</span>
                      <span className="text-3xl font-black text-[#002366]">{symbol}{totalSettlementVal}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-10 absolute bottom-0 left-0 right-0 flex justify-between items-end bg-gray-50 border-t border-gray-100">
                 <div className="text-[9px] font-bold text-gray-400 uppercase leading-relaxed max-w-md">
                   This document serves as formal confirmation of funds dispatch. Authenticated via the Global Int clearing protocol. Subject to correspondent bank credit cycles. ISO-20022 Compliant.
                 </div>
                 <div className="flex items-center gap-6">
                   <div className="text-right">
                     <p className="text-[8px] font-black text-gray-400 uppercase">Verification QR</p>
                     <p className="text-[8px] font-mono text-blue-600">SEC-HASH: {Math.random().toString(36).slice(2, 12).toUpperCase()}</p>
                   </div>
                   <QrCode className="w-16 h-16 opacity-30" />
                 </div>
              </div>
            </PageWrapper>

            {/* Page 2: High-Fidelity Advice (SWIFT MT103 / SEPA SCT) */}
            <PageWrapper>
              <div className="p-12 font-mono text-[11px] h-full flex flex-col bg-white">
                 <div className="flex justify-between items-center border-b-2 border-black pb-4 mb-6">
                    <div className="flex items-center gap-2">
                       <Shield className="w-5 h-5 text-[#002366]" />
                       <span className="font-black text-lg uppercase tracking-tight">
                         {transaction.isRaast ? 'Raast Instant Transfer Advice' : transaction.isDirectDebit ? 'SEPA Direct Debit Advice (SDD)' : transaction.isHsbcGlobal ? 'HSBC Global Transfer Advice' : transaction.isSepa ? 'SEPA Credit Transfer Advice (SCT)' : 'SWIFT MT103 Transmission Advice'}
                       </span>
                    </div>
                    <span className="font-black text-gray-400">PAGE 02 OF 03</span>
                 </div>
 
                 <div className="space-y-4">
                    <div className="bg-gray-100 p-4 border border-gray-200">
                       <p className="font-black mb-2 flex justify-between">
                         <span>APPLICATION ID: {transaction.isRaast ? 'RAAST_INST' : transaction.isHsbcGlobal ? 'HSBC_GLOBAL' : transaction.isSepa ? 'SCT_INST' : 'SWIFT_FIN'}</span>
                         <span>NODE: {isOut ? (transaction.isRaast ? 'SBP-RAAST-PK' : transaction.isHsbcGlobal ? 'HSBC-HK-01' : transaction.isSepa ? 'EBA-CLEAR-EU' : 'HSBC-TR-GER') : (['GIBK-LN-09', 'GIBK-DX-05', 'GIBK-SH-10', 'GIBK-RY-15', 'GIBK-KA-16', 'GIBK-DB-14'][Math.floor(Math.random() * 6)])}</span>
                       </p>
                       <p className="text-[10px] text-gray-500">SESSION: {Math.random().toString().slice(2, 10)} | AUTH_LVL: INSTITUTIONAL_TIER_1</p>
                    </div>

                    <div className="space-y-3">
                       <div className="bg-black text-white p-2 font-black text-[10px] uppercase tracking-widest">-- Message Text Block 4 --</div>
                       
                       <div className="grid grid-cols-[160px_1fr] gap-x-4 gap-y-2 px-2">
                          {transaction.isDirectDebit && (
                             <>
                               <div className="font-bold text-gray-400">:21: MANDATE REFERENCE</div>
                               <div className="font-black text-blue-600">{transaction.mandateReference}</div>
                             </>
                           )}
                           <div className="font-bold text-gray-400">:20: SENDER REFERENCE</div>
                          <div className="font-black">{transaction.referenceId}</div>

                          {transaction.utr && (
                            <>
                              <div className="font-bold text-gray-400">:21: UTR REFERENCE</div>
                              <div className="font-black text-blue-600">{transaction.utr}</div>
                            </>
                          )}

                          <div className="font-bold text-gray-400">:32A: VALUE DATE/CURR/AMNT</div>
                          <div className="font-black">{transaction.date.replace(/,/g, '')} / {transaction.currency} / {totalSettlementVal}</div>

                          <div className="font-bold text-gray-400">:50K: ORDERING CUSTOMER</div>
                          <div className="font-black leading-relaxed">
                             {senderName}<br/>
                             IBAN: {senderIban}<br/>
                             BIC: {senderBic}
                          </div>

                          <div className="font-bold text-gray-400">:59: BENEFICIARY CUSTOMER</div>
                          <div className="font-black leading-relaxed">
                             {beneficiaryName}<br/>
                             {transaction.isHsbcGlobal ? 'HSBC INTERNAL NETWORK' : `IBAN: ${beneficiaryIban}`}<br/>
                             ACC: {transaction.recipientAccountNumber || 'N/A'}<br/>
                             BIC: {beneficiaryBic}
                          </div>

                          <div className="font-bold text-gray-400">:70: REMITTANCE INFO</div>
                          <div className="font-black">{transaction.paymentReason || 'REMITTANCE PER CONTRACT'}</div>

                          <div className="font-bold text-gray-400">:71A: CHARGES DETAILS</div>
                          <div className="font-black">{transaction.feeInstruction || 'OUR'} (SENDER PAYS ALL FEES)</div>

                          <div className="font-bold text-gray-400">:71F: SENDER'S CHARGES</div>
                          <div className="font-black">{transaction.currency} {transaction.fee}</div>

                          <div className="font-bold text-gray-400">:72: SENDER TO RCVR INFO</div>
                          <div className="font-black leading-relaxed text-blue-700">
                             /IBN/ CLEARED VIA {transaction.isHsbcGlobal ? 'HSBC GLOBAL INTERNAL NETWORK' : transaction.isSepa ? 'SEPA INSTANT NODE' : 'GLOBAL SWIFT HUB'}<br/>
                             /SET/ TOTAL DEBITED FROM POOL: {symbol}{totalSettlementVal}
                          </div>
                       </div>
                    </div>

                    <div className="pt-6 space-y-3">
                       <div className="bg-gray-50 border border-gray-200 p-6 rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white">
                                <CheckCircle className="w-6 h-6" />
                             </div>
                             <div>
                                <p className="font-black text-green-600">TRANSMISSION POSTED</p>
                                <p className="text-[10px] text-gray-500 uppercase font-black">ACK Code: {Math.random().toString(36).slice(2, 8).toUpperCase()}</p>
                             </div>
                          </div>
                          <div className="text-right">
                             <p className="text-[10px] font-black text-gray-400 uppercase">Est. Settlement Window</p>
                             <p className="font-black text-[#002366]">{transaction.timeframe}</p>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="mt-auto border-t border-dashed border-gray-300 pt-8 flex justify-between items-center">
                    <div className="flex items-center gap-2 opacity-30">
                       <Globe className="w-4 h-4" />
                       <span className="font-black text-[9px] uppercase">ISO-20022 Messaging Standard Active</span>
                    </div>
                    <div className="border-4 border-gray-200 px-8 py-2 font-black italic text-gray-300 text-lg rotate-[-5deg]">BANKING COPY</div>
                 </div>
              </div>
            </PageWrapper>

            {/* Page 3: Structured Debit Note */}
            <PageWrapper>
              <div className="p-12 flex flex-col h-full bg-[#fcfcfc]">
                 <div className="h-4 bg-[#002366] w-full mb-8"></div>
                 
                 <div className="flex justify-between items-start mb-10">
                    <div className="space-y-2">
                       <h1 className="text-5xl font-black text-[#002366] uppercase tracking-tighter">Debit Note</h1>
                       {transaction.utr && <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">UTR: {transaction.utr}</p>}
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] ml-1">Asset Clearance Advice</p>
                    </div>
                    <div className="text-right space-y-1">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Document ID</p>
                       <p className="text-lg font-black font-mono">DN-{transaction.id}</p>
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pt-2">Processing Date</p>
                       <p className="text-sm font-black">{transaction.date}</p>
                    </div>
                 </div>

                 <div className="space-y-8 px-2">
                    <div className="grid grid-cols-2 gap-12">
                       <div className="space-y-4">
                          <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Debited Account</h4>
                          <div className="space-y-1">
                             <p className="text-sm font-black text-gray-900">{isOut ? USER_ACCOUNT_NAME : beneficiaryName}</p>
                             <p className="text-[11px] font-mono text-gray-500">{isOut ? USER_ACCOUNT_IBAN : beneficiaryIban}</p>
                             <p className="text-[10px] font-mono text-gray-400">ACC: {isOut ? USER_ACCOUNT_NO : 'N/A'}</p>
                          </div>
                       </div>
                       <div className="space-y-4">
                          <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Payment Details</h4>
                          <div className="space-y-1">
                             <p className="text-sm font-black text-gray-900">{isOut ? beneficiaryName : USER_ACCOUNT_NAME}</p>
                             <p className="text-[11px] font-mono text-gray-500">{isOut ? beneficiaryIban : USER_ACCOUNT_IBAN}</p>
                             <p className="text-[10px] font-mono text-gray-400">ACC: {isOut ? (transaction.recipientAccountNumber || 'N/A') : USER_ACCOUNT_NO}</p>
                             <p className="text-[11px] font-black text-[#002366] mt-1">{transaction.paymentReason}</p>
                          </div>
                       </div>
                    </div>

                    <div className="bg-white border-2 border-[#002366] rounded-[2rem] p-8 shadow-2xl shadow-[#002366]/5">
                       <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 text-center">Final Settlement Breakdown</h4>
                       <div className="space-y-4 font-mono">
                          <div className="flex justify-between items-center text-gray-500">
                             <span className="text-xs uppercase font-bold">Base Principal</span>
                             <span className="text-lg font-black">{symbol}{formattedAmount}</span>
                          </div>
                          <div className="flex justify-between items-center text-gray-500">
                             <span className="text-xs uppercase font-bold">Settlement Fee (Instruction: {transaction.feeInstruction || 'OUR'})</span>
                             <span className="text-lg font-black">+{symbol}{transaction.fee}</span>
                          </div>
                          <div className="pt-6 border-t-2 border-dashed border-gray-200 flex justify-between items-center">
                             <span className="text-lg font-black text-[#002366] uppercase">Total Asset Deduction</span>
                             <div className="text-right">
                                <span className="text-4xl font-black text-[#002366] tracking-tighter">{symbol}{totalSettlementVal}</span>
                                <p className="text-[10px] font-black text-gray-400 uppercase mt-2">Deducted from Tier-1 Liquidity Pool</p>
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="p-6 border-l-8 border-[#002366] bg-blue-50/50 rounded-r-2xl">
                       <p className="text-[10px] font-bold text-[#002366] uppercase leading-loose tracking-wide">
                          Notification: This debit note confirms the immediate deduction of {symbol}{totalSettlementVal} from the originating liquidity pool. All associated fees have been settled by the sender as per institutional protocol {transaction.feeInstruction || 'OUR'}. This action is final and recorded in the Global Int distributed ledger.
                       </p>
                    </div>
                 </div>

                 <div className="mt-auto flex justify-center pt-6">
                    <div className="border-8 border-[#002366] p-6 bg-white shadow-2xl rotate-[-2deg] transition-transform hover:rotate-0 cursor-default">
                       <span className="text-5xl font-black text-[#002366] italic uppercase tracking-tighter">AUTHENTICATED</span>
                    </div>
                 </div>
              </div>
            </PageWrapper>

          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;

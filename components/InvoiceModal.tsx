
import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Printer, ShieldCheck, QrCode, 
  Layers, ZoomIn, ZoomOut, CheckCircle, Globe, FileDown
} from 'lucide-react';
import { Transaction } from '../App';

interface InvoiceModalProps {
  transaction: Transaction;
  onClose: () => void;
  initialTab?: 'receipt' | 'swift' | 'remittance' | 'debitNote' | 'full';
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  'USD': '$',
  'EUR': '€',
  'GBP': '£',
  'AED': 'د.إ',
  'PKR': '₨',
};

const InvoiceModal: React.FC<InvoiceModalProps> = ({ transaction, onClose }) => {
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
    
    // Save current transformation state
    const originalTransform = element.style.transform;
    const filename = `Institutional_Bundle_${transaction.referenceId || transaction.id}.pdf`;
    
    // Preparation: Remove UI transformations and margins for a clean capture
    element.style.transform = 'none';
    element.classList.remove('invoice-preview-mode');

    const opt = {
      margin: 0,
      filename: filename,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { 
        scale: 2, 
        useCORS: true,
        letterRendering: true,
        scrollY: 0,
        scrollX: 0,
        backgroundColor: '#ffffff',
        logging: false
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
      // Strict pagebreak configuration to prevent overlapping
      pagebreak: { mode: ['css', 'legacy'], before: '.printable-page' }
    };

    const html2pdf = (window as any).html2pdf;
    if (html2pdf) {
      try {
        await html2pdf().set(opt).from(element).save();
      } catch (err) {
        console.error("PDF Generation failed:", err);
      } finally {
        // Restore UI state
        element.style.transform = originalTransform;
        element.classList.add('invoice-preview-mode');
      }
    } else {
      window.print();
      element.style.transform = originalTransform;
      element.classList.add('invoice-preview-mode');
    }
  };

  const symbol = CURRENCY_SYMBOLS[transaction.currency] || '$';
  const amountValue = parseFloat(transaction.amount.replace(/,/g, '') || '0.00');
  const formattedAmount = amountValue.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const isOut = transaction.type === 'out';
  const USER_ACCOUNT_NAME = "GLOBAL INT LIQUIDITY FUND S.A.";
  const USER_ACCOUNT_IBAN = "DE64 3003 0880 6131 1228 88";
  const USER_ACCOUNT_BIC = "GIBKDEFFXXX";

  const senderName = isOut ? USER_ACCOUNT_NAME : transaction.name.toUpperCase();
  const senderIban = isOut ? USER_ACCOUNT_IBAN : (transaction.recipient || "N/A");
  const senderBic = isOut ? USER_ACCOUNT_BIC : "SWIFXXXX";

  const beneficiaryName = isOut ? transaction.name.toUpperCase() : USER_ACCOUNT_NAME;
  const beneficiaryIban = isOut ? (transaction.recipient || "N/A") : USER_ACCOUNT_IBAN;
  const beneficiaryBic = isOut ? "SWIFXXXX" : USER_ACCOUNT_BIC;

  const usdAmountValue = transaction.usdAmount || (transaction.currency === 'USD' ? amountValue : (transaction.exchangeRate ? amountValue / transaction.exchangeRate : amountValue));
  const exchangeRateValue = transaction.exchangeRate || 1.0;

  const balanceAfterValue = transaction.balanceAfter !== undefined 
    ? transaction.balanceAfter 
    : 990405989.50;
    
  const balanceBeforeValue = isOut 
    ? (balanceAfterValue + usdAmountValue) 
    : (balanceAfterValue - usdAmountValue);

  const availableFundsAfter = balanceAfterValue.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  const formattedTotalBase = balanceBeforeValue.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const formattedUsdSettlement = usdAmountValue.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const bankPattern = 'url("data:image/svg+xml,%3Csvg width=\'140\' height=\'140\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M50 0 L100 50 L50 100 L0 50 Z\' fill=\'%23002366\' fill-opacity=\'0.03\'/%3E%3C/svg%3E")';

  const PageWrapper = ({ children, last = false }: { children?: React.ReactNode, last?: boolean }) => (
    <div 
      className="bg-white relative flex flex-col p-0 overflow-hidden printable-page"
      style={{ 
        width: '210mm', 
        height: '297mm', 
        minHeight: '297mm',
        maxHeight: '297mm',
        pageBreakAfter: last ? 'auto' : 'always',
        color: '#000000',
        boxSizing: 'border-box',
        border: 'none',
        display: 'block'
      }}
    >
      {children}
    </div>
  );

  const ConfirmationReceipt = () => (
    <PageWrapper>
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: bankPattern, backgroundSize: '140px 140px' }}></div>
      <div className="pt-20 px-20 flex justify-between items-start relative z-10">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-[#002366] p-2 rounded-lg">
               <div className="w-8 h-8 border-2 border-white rounded flex items-center justify-center font-bold text-white">G</div>
            </div>
            <span className="text-3xl font-black tracking-tighter text-[#002366]">GLOBAL INT <span className="text-gray-400 font-normal">BANKING</span></span>
          </div>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">ISO-20022 Verified Clearing Document</p>
        </div>
        <div className="w-48 h-20 border border-gray-300 flex items-center justify-center text-[9px] font-bold text-gray-400 text-center uppercase px-4 leading-tight">
          Institutional Security Seal<br/>[GIBK-992-SEC]
        </div>
      </div>
      
      <div className="px-24 pt-16 flex-1 relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-2xl font-black tracking-[0.3em] border-b-2 border-black inline-block px-12 pb-2 uppercase">Official Payment Voucher</h1>
        </div>
        
        <div className="border-[3px] border-black p-8 mb-8 bg-white relative">
          <div className={`absolute -top-4 -left-4 ${isOut ? 'bg-black' : 'bg-green-700'} text-white px-4 py-1 font-black text-[10px] tracking-widest`}>STATUS: {isOut ? 'DISPATCHED' : 'RECEIVED'}</div>
          <p className="font-mono text-base font-bold text-center leading-relaxed">
            Transaction successfully authorized and reconciled at 20:19:56 GMT<br/>
            Processing date: <span className="underline decoration-2">{transaction.date}</span>
          </p>
          <CheckCircle className="absolute top-1/2 -translate-y-1/2 right-6 w-10 h-10 text-green-600 opacity-20" />
        </div>

        <div className="space-y-6 max-w-2xl mx-auto text-[14px] font-mono leading-tight">
          <div className="grid grid-cols-[240px_1fr] border-b border-gray-100 pb-3">
            <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Ordering Entity</span>
            <span className="text-right font-black text-lg">{senderName}</span>
          </div>
          <div className="grid grid-cols-[240px_1fr] border-b border-gray-100 pb-3">
            <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Beneficiary Participant</span>
            <span className="text-right font-black text-lg">{beneficiaryName}</span>
          </div>
          <div className="grid grid-cols-[240px_1fr] py-6 border-y-4 border-black font-black text-4xl my-6">
            <span className="text-[12px] uppercase tracking-[0.5em] flex items-center">Transfer Value</span>
            <span className={`text-right ${!isOut && 'text-green-700'}`}>{symbol} {formattedAmount}</span>
          </div>
          
          {transaction.currency !== 'USD' && (
            <div className="bg-gray-50 p-4 border border-gray-200 rounded-lg space-y-2 mb-6">
              <div className="grid grid-cols-[240px_1fr]">
                <span className="text-gray-500 font-bold uppercase tracking-widest text-[9px]">Settlement Est (USD)</span>
                <span className="text-right font-black text-blue-900">${formattedUsdSettlement}</span>
              </div>
              <div className="grid grid-cols-[240px_1fr]">
                <span className="text-gray-500 font-bold uppercase tracking-widest text-[9px]">Conversion Rate</span>
                <span className="text-right font-bold text-[10px]">1 USD = {exchangeRateValue.toFixed(4)} {transaction.currency}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-[240px_1fr] items-center">
             <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Swift Transmission Ref</span>
             <div className="text-right bg-gray-100 h-12 ml-auto w-full border border-gray-300 flex items-center justify-end px-4 font-black text-blue-800 text-lg font-mono">
               {transaction.referenceId || "FTX-75388684"}
             </div>
          </div>
        </div>

        <div className="mt-28 text-center text-xl font-serif font-bold italic opacity-40">
          Global International Banking - Tier 1 Clearing Hub
        </div>
      </div>

      <div className="mt-auto p-12 flex flex-col gap-6">
        <div className="h-[4px] bg-[#002366] w-full"></div>
        <div className="flex justify-between items-end">
          <div className="text-[9px] font-black uppercase leading-tight space-y-1 opacity-60">
            <p>Corporate HQ: Canary Wharf, London E14 5LB, United Kingdom</p>
            <p>SWIFT/BIC: GIBKGB2L • FCA Registered No: 122888</p>
          </div>
          <div className="w-20 h-20 bg-gray-50 border border-gray-200 flex items-center justify-center">
             <QrCode className="w-16 h-16 opacity-10" />
          </div>
        </div>
      </div>
    </PageWrapper>
  );

  const SwiftAdvice = () => (
    <PageWrapper>
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
        <div className="text-[180px] font-black border-[30px] border-black p-12 rotate-[-45deg] whitespace-nowrap">{isOut ? 'MT103 CONFIRMED' : 'MT103 RECEIVED'}</div>
      </div>
      <div className="relative z-10 flex flex-col h-full p-16 uppercase tracking-tight font-mono text-[10px] font-black">
        <div className="flex justify-between items-start mb-10 border-b-2 border-black pb-4">
          <div className="space-y-1">
             <p className="text-[12px] tracking-[0.2em] font-black">S.W.I.F.T. NETWORK REPORT - MT103 SINGLE CUSTOMER CREDIT TRANSFER</p>
             <p className="text-sm font-bold opacity-70">DATE OF TRANSMISSION: {transaction.date} / 20:19:56 GMT</p>
          </div>
          <div className="flex flex-col items-end gap-2">
             <div className="border-2 border-black px-4 py-1 font-black text-[12px] bg-black text-white">{isOut ? 'REMITTER COPY' : 'BENEFICIARY COPY'}</div>
             <p className="text-[8px] opacity-50">PAGE 01 OF 01</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-6 bg-gray-50 p-4 border border-gray-200">
           <div className="space-y-1">
              <p className="text-blue-900 underline">-- SENDING INSTITUTION --</p>
              <p>BIC: {senderBic}</p>
              <p>NAME: {isOut ? 'GLOBAL INT BANKING GROUP' : transaction.name.toUpperCase()}</p>
           </div>
           <div className="space-y-1 text-right">
              <p className="text-blue-900 underline">-- RECEIVING INSTITUTION --</p>
              <p>BIC: {beneficiaryBic}</p>
              <p>NAME: {isOut ? beneficiaryName.split(' ')[0] : 'GLOBAL INT BANKING GROUP'} CLEARING NODE</p>
           </div>
        </div>

        <div className="border-2 border-black p-8 relative min-h-[500px] bg-white flex flex-col font-mono text-[12px] leading-relaxed">
           <div className="text-center font-black mb-10 border-b border-gray-300 pb-2 tracking-[0.4em] text-[13px] text-gray-400">MESSAGE BLOCK 4 - CONTENT</div>
           
           <div className="space-y-4">
             <div className="grid grid-cols-[180px_1fr]">
               <div className="font-bold">:20: SENDER'S REF</div>
               <div className="font-black bg-gray-100 px-2 border border-gray-300 w-fit">{transaction.referenceId || "FTX-75388684"}</div>
             </div>

             <div className="grid grid-cols-[180px_1fr]">
               <div className="font-bold">:32A: VALUE DATE/AMNT</div>
               <div className="font-black">
                  {transaction.date.replace(/,/g, '').split(' ').join('')} / {transaction.currency} / {formattedAmount}
               </div>
             </div>

             <div className="grid grid-cols-[180px_1fr] pl-10 border-l-2 border-gray-100 py-2">
               <div className="text-gray-500">ORIGINAL CURR</div><div className="font-black">{transaction.currency}</div>
               <div className="text-gray-500">TRANSFER AMNT</div><div className="font-black text-xl">{symbol}{formattedAmount}</div>
               {transaction.currency !== 'USD' && (
                 <>
                   <div className="text-gray-500">X-RATE (USD)</div><div className="font-black">1.00 USD / {exchangeRateValue.toFixed(4)} {transaction.currency}</div>
                   <div className="text-gray-500">SETTLEMENT (USD)</div><div className="font-black text-blue-900">${formattedUsdSettlement}</div>
                 </>
               )}
             </div>

             <div className="grid grid-cols-[180px_1fr] mt-6">
               <div className="font-bold">:50K: ORDERING CUST</div>
               <div className="font-black leading-tight">
                  {senderName}<br/>
                  IBAN: {senderIban}
               </div>
             </div>

             <div className="grid grid-cols-[180px_1fr] mt-4">
               <div className="font-bold">:59: BENEFICIARY</div>
               <div className="font-black leading-tight">
                  {beneficiaryName}<br/>
                  IBAN: {beneficiaryIban}
               </div>
             </div>

             <div className="grid grid-cols-[180px_1fr] mt-4">
               <div className="font-bold">:71A: CHARGES</div>
               <div className="font-black">OUR (SENDER PAYS ALL)</div>
             </div>
           </div>
           
           <div className="mt-auto border-t-2 border-dashed border-gray-300 pt-6">
              <div className="flex justify-between items-end">
                 <div className="space-y-1 text-[10px]">
                    <p>TRANSMISSION ID: {Math.random().toString(36).substring(2, 12).toUpperCase()}</p>
                    <p>SYSTEM HASH: SHA-256- {Math.random().toString(16).substring(2, 20).toUpperCase()}</p>
                 </div>
                 <div className="text-right">
                    <p className="font-black text-[12px] mb-1">NETWORK CONFIRMATION</p>
                    <div className="inline-block border-2 border-green-600 text-green-600 px-6 py-1 font-black tracking-widest rotate-[-5deg]">TRANS: OK</div>
                 </div>
              </div>
           </div>
        </div>

        <div className="mt-8 text-center text-[10px] tracking-[0.6em] text-gray-400 font-black">
           -- END OF SWIFT TRANSMISSION REPORT --
        </div>
      </div>
    </PageWrapper>
  );

  const RemittanceAdvice = () => (
    <PageWrapper>
      <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{ backgroundImage: bankPattern, backgroundSize: '160px 160px' }}></div>
      <div className="flex-1 flex flex-col p-20 relative z-10 font-mono">
        <div className="flex justify-between items-start mb-16">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <div className="bg-[#002366] p-1.5 rounded-lg"><div className="w-6 h-6 border-2 border-white rounded flex items-center justify-center font-bold text-white text-xs">G</div></div>
              <span className="text-3xl font-black tracking-tighter text-[#002366]">GLOBAL INT</span>
            </div>
          </div>
          <div className="text-right space-y-1">
             <h1 className="text-2xl font-black text-black uppercase tracking-widest border-b-2 border-black pb-1">Remittance Advice</h1>
             <p className="text-[10px] font-bold text-gray-500">Voucher Ref: {transaction.referenceId || "GIB-7729"}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-12 mb-12">
           <div className="bg-gray-50 p-6 border-l-4 border-[#002366]">
              <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Originating Party</h2>
              <div className="space-y-1 text-sm font-black">
                 <p className="text-lg">{senderName}</p>
                 <p className="text-gray-600 font-mono text-xs">{senderIban}</p>
              </div>
           </div>
           <div className="bg-gray-50 p-6 border-l-4 border-black">
              <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Counterparty (Beneficiary)</h2>
              <div className="space-y-1 text-sm font-black">
                 <p className="text-lg">{beneficiaryName}</p>
                 <p className="text-gray-600 font-mono text-xs">{beneficiaryIban}</p>
              </div>
           </div>
        </div>

        <div className="border-[4px] border-black p-10 mb-8 bg-white flex flex-col items-center justify-center gap-4 font-black text-black shadow-lg">
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase tracking-[0.4em] mb-2 text-gray-400">Validated Amount ({transaction.currency})</span>
            <span className={`text-6xl tracking-tighter ${!isOut && 'text-green-700'}`}>{symbol}{formattedAmount}</span>
          </div>
          {transaction.currency !== 'USD' && (
            <div className="border-t border-gray-200 w-full pt-4 flex flex-col items-center">
               <span className="text-[10px] uppercase tracking-[0.4em] mb-1 text-gray-400">Settlement Est (USD)</span>
               <span className="text-2xl text-blue-900">${formattedUsdSettlement}</span>
               <span className="text-[9px] text-gray-400 mt-1 uppercase font-bold">1 USD = {exchangeRateValue.toFixed(4)} {transaction.currency}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-6 mb-16">
           <div className="border border-gray-200 p-4 text-center">
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2">Request Date</p>
              <p className="font-bold text-xs">{transaction.date}</p>
           </div>
           <div className="border border-gray-200 p-4 text-center">
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2">Settlement Type</p>
              <p className="font-bold text-xs">{isOut ? 'RTGS / URGENT' : 'WIRE RECEIPT'}</p>
           </div>
           <div className="border border-gray-200 p-4 text-center">
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2">Network Hub</p>
              <p className="font-bold text-xs">LDN-CLE-09</p>
           </div>
        </div>

        <div className="flex justify-between items-end mt-auto mb-10">
           <div className="text-center w-64 border-t-2 border-gray-100 pt-4">
              <div className="font-serif italic text-3xl mb-1 text-black">A. Dos Santos</div>
              <div className="font-black text-[11px] uppercase mb-1">Armando Dos Santos</div>
           </div>
           
           <div className="relative border-4 border-[#002366] p-4 text-[#002366] rotate-[-5deg] font-black text-center bg-white shadow-2xl">
              <div className="flex items-center justify-center gap-2 mb-1">
                 <div className="w-4 h-4 bg-[#002366] rotate-45"></div>
                 <span className="text-lg font-black italic">CERTIFIED</span>
              </div>
              <div className="text-[8px] leading-tight font-black uppercase">Institutional<br/>Clearance Unit</div>
           </div>

           <div className="text-center w-64 border-t-2 border-gray-100 pt-4">
              <div className="font-serif italic text-3xl mb-1 text-black">M. Khan</div>
              <div className="font-black text-[11px] uppercase mb-1">Murtaza Khan</div>
           </div>
        </div>
      </div>
    </PageWrapper>
  );

  const DebitNote = ({ last = false }: { last?: boolean }) => (
    <PageWrapper last={last}>
      <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{ backgroundImage: bankPattern, backgroundSize: '160px 160px' }}></div>
      <div className="p-16 flex flex-col h-full font-mono text-[11px] text-black bg-white relative z-10">
        <div className="absolute top-0 left-0 right-0 h-10 bg-[#002366]"></div>
        
        <div className="mt-8 flex justify-between items-end border-b-[6px] border-[#002366] pb-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center">
              <div className="bg-[#002366] p-2 rounded-lg mr-4">
                 <div className="w-8 h-8 border-2 border-white rounded flex items-center justify-center font-bold text-white text-base">G</div>
              </div>
              <h1 className="text-3xl font-black tracking-widest uppercase text-[#002366]">{isOut ? 'DEBIT ADVICE' : 'CREDIT ADVICE'}</h1>
            </div>
            <div className="w-[3px] h-12 bg-gray-200"></div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-gray-400 uppercase">System Class</span>
              <span className="font-black text-base">GIBK.CORE.MT103</span>
            </div>
          </div>
          <div className="text-right">
             <p className="font-black text-[11px] opacity-40">INSTITUTIONAL LEDGER ENTRY</p>
             <p className="font-black text-lg">POSTING DATE: {transaction.date}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-8">
          <div className="border-2 border-black p-4 bg-gray-50">
            <p className="font-black text-[10px] uppercase text-gray-400 mb-2 underline decoration-black">Liquidity Source Node</p>
            <p className="text-[16px] font-black font-mono tracking-tighter">{USER_ACCOUNT_IBAN}</p>
          </div>
          <div className="border-2 border-black p-4 bg-gray-50">
             <p className="font-black text-[10px] uppercase text-gray-400 mb-2 underline decoration-black">Transaction Specification</p>
             <p className="text-[14px] font-black uppercase tracking-tight">MULTI-CURRENCY SETTLEMENT</p>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_2fr] gap-4 mt-4 h-full max-h-[300px]">
          <div className="border-2 border-black p-6 flex flex-col bg-white">
            <p className="font-black underline mb-4 text-[11px] uppercase tracking-widest">Entry Balance</p>
            <div className="bg-[#002366] text-white p-3 font-black text-center text-[12px] mb-4 shadow-md">POSTED: {transaction.currency}</div>
            <div className="space-y-4 font-black text-[11px]">
               <div className="flex justify-between text-gray-400 uppercase text-[9px]"><span>Original Amount</span></div>
               <div className="flex justify-between text-lg border-b border-gray-100 pb-2"><span>{symbol} {formattedAmount}</span></div>
               {transaction.currency !== 'USD' && (
                 <>
                   <div className="flex justify-between text-gray-400 uppercase text-[9px]"><span>X-Rate Applied</span></div>
                   <div className="flex justify-between text-[10px]"><span>1 USD = {exchangeRateValue.toFixed(4)} {transaction.currency}</span></div>
                 </>
               )}
            </div>
          </div>
          <div className="border-2 border-black p-8 bg-gray-50 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#002366] opacity-[0.03] rounded-full -mr-16 -mt-16"></div>
            <p className="font-black underline mb-6 text-[12px] uppercase tracking-widest">Post-Execution Accounting (USD)</p>
            <div className="space-y-4 text-lg font-black flex-1">
              <div className="flex justify-between text-gray-500 text-sm"><span>Pre-Auth Balance</span><span>: {formattedTotalBase}</span></div>
              <div className={`flex justify-between ${isOut ? 'text-red-700' : 'text-green-700'} text-base`}>
                <span>Settlement ({transaction.currency} → USD)</span>
                <span>: {isOut ? '-' : '+'} {formattedUsdSettlement}</span>
              </div>
              <div className="flex justify-between pt-6 border-t-4 border-black font-black text-2xl text-[#002366]">
                <span>Total Balance</span>
                <span>: {availableFundsAfter}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-auto pt-6 flex items-end justify-between border-t-2 border-gray-200">
           <div className="flex flex-col gap-3">
              <p className="font-black text-[10px] uppercase tracking-[0.2em] text-gray-400">Clearing Progress</p>
              <div className="flex gap-1 h-8 bg-gray-100 p-1 border-2 border-black w-72 items-center">
                 {[...Array(20)].map((_, i) => <div key={i} className="flex-1 bg-[#002366] h-full"></div>)}
                 <span className="text-[10px] font-black ml-3">100%</span>
              </div>
           </div>
           <div className="flex items-center gap-8">
              <div className="relative flex flex-col items-center">
                 <QrCode className="w-24 h-24 opacity-10" />
              </div>
              <div className="border-4 border-[#002366] text-[#002366] rounded-full px-10 py-3 font-black italic text-xl shadow-2xl bg-white uppercase tracking-[0.2em]">IBAN-VERIFIED</div>
           </div>
        </div>
      </div>
    </PageWrapper>
  );

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-0 md:p-4 overflow-hidden invoice-modal-overlay">
      <div className="fixed inset-0 bg-gray-900/95 backdrop-blur-md no-print" onClick={onClose}></div>
      <div className="relative bg-[#f1f5f9] w-full max-w-[98vw] lg:max-w-7xl h-[100vh] md:h-[95vh] overflow-hidden md:rounded-[2.5rem] shadow-2xl flex flex-col animate-in fade-in zoom-in duration-300 border border-white/20">
        
        {/* Navigation / Toolbar */}
        <div className="bg-white border-b border-gray-200 px-4 md:px-10 py-4 flex flex-col md:flex-row items-center justify-between no-print shadow-md z-50 gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="bg-[#002366] p-1.5 rounded-lg">
                <Layers className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-xs font-black text-[#002366] uppercase tracking-[0.1em]">Consolidated Institutional Bundle</h3>
            </div>
            <div className="h-6 w-px bg-gray-200"></div>
            <div className="flex items-center gap-2">
              <button onClick={() => setZoom(z => Math.max(0.3, z - 0.1))} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><ZoomOut className="w-4 h-4 text-gray-500" /></button>
              <div className="bg-gray-50 px-3 py-1 rounded-lg border border-gray-200 min-w-[50px] text-center">
                <span className="text-[10px] font-black text-gray-500">{Math.round(zoom * 100)}%</span>
              </div>
              <button onClick={() => setZoom(z => Math.min(2.0, z + 0.1))} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><ZoomIn className="w-4 h-4 text-gray-500" /></button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleDownloadPDF}
              className="flex items-center gap-3 px-6 md:px-10 py-3 bg-[#002366] text-white text-[11px] font-black rounded-2xl hover:bg-blue-900 transition-all shadow-xl shadow-blue-900/20 uppercase tracking-[0.15em] active:scale-95"
            >
              <FileDown className="w-4 h-4" />
              GENERATE DOCUMENT (PDF)
            </button>
            <button 
              onClick={() => window.print()}
              className="p-3 bg-gray-50 text-gray-500 hover:text-gray-900 rounded-2xl border border-gray-200"
              title="Print Bundle"
            >
              <Printer className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-600 transition-all bg-gray-50 rounded-xl hover:bg-red-50"><X className="w-6 h-6" /></button>
          </div>
        </div>

        {/* Invoice Viewer */}
        <div ref={containerRef} className="flex-1 overflow-auto bg-gray-400/30 flex flex-col items-center py-10 md:py-20 px-4 md:px-10 custom-scrollbar no-print">
          <div 
            style={{ 
              transform: `scale(${zoom})`, 
              transformOrigin: 'top center',
              transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            className="flex flex-col gap-0 invoice-printable-container invoice-printable-target invoice-preview-mode"
            ref={printableRef}
          >
            <ConfirmationReceipt />
            <SwiftAdvice />
            <RemittanceAdvice />
            <DebitNote last={true} />
          </div>
        </div>

        <div className="px-12 py-4 bg-white border-t border-gray-200 flex items-center justify-between no-print shrink-0 hidden md:flex">
          <div className="flex items-center gap-4">
            <div className="bg-blue-50 p-2 rounded-xl border border-blue-100"><ShieldCheck className="w-5 h-5 text-blue-600" /></div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Institutional Integrity Reconciled • MT103 Transmission Receipt • ISO-20022 Compliant</span>
          </div>
          <div className="flex items-center gap-2">
             <Globe className="w-4 h-4 text-gray-300" />
             <span className="text-[10px] font-black text-gray-300 uppercase">SWIFT-ID: GIBK-CORE-PROD-Z88</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;

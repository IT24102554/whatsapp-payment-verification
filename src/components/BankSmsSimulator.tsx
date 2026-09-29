import React, { useState } from 'react';
import { BankSMS, BusinessConfig, SMEOrder, VerificationResult } from '../types';
import {
  Smartphone,
  PlusCircle,
  Send,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

interface BankSmsSimulatorProps {
  smsList: BankSMS[];
  config: BusinessConfig;
  orders?: SMEOrder[];
  verifications?: VerificationResult[];
  onSendSms: (sms: {
    bankName: string;
    senderPhoneOrHeader: string;
    amount: number;
    accountNumberMasked: string;
    referenceNumber: string;
    rawMessage: string;
  }) => Promise<number>;
}

export const BankSmsSimulator: React.FC<BankSmsSimulatorProps> = ({
  smsList,
  config,
  orders = [],
  verifications = [],
  onSendSms,
}) => {
  // Allow selecting ANY order (defaults to Nimash ORD-8923 if present)
  const defaultOrderId = orders.find((o) => o.id === 'ord-103')?.id || orders[0]?.id || '';
  const [selectedOrderId, setSelectedOrderId] = useState<string>(defaultOrderId);

  const selectedOrder = orders.find((o) => o.id === selectedOrderId) || orders[0];

  // Bank SMS form states
  const [bankName, setBankName] = useState('Hatton National Bank (HNB)');
  const [senderHeader, setSenderHeader] = useState('HNB Alert');
  const [amount, setAmount] = useState<number>(32000);
  const [accountMask, setAccountMask] = useState('XXXX9876');
  const [refNumber, setRefNumber] = useState('CEFTS-992144');
  const [customMsg, setCustomMsg] = useState(
    'HNB Alert: Your A/C *******9876 has been credited with LKR 32,000.00 on 28/09/2026 19:15 by CEFTS from NIMASH FERNANDO. Ref: CEFTS-992144.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  // When user selects a different customer from the dropdown, update the preset generator
  const handleSelectOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    const ord = orders.find((o) => o.id === orderId);
    if (!ord) return;

    // Check if this order was paid with an assigned bank or Commercial Bank default
    const isHnb = ord.assignedBusinessAccount === 'XXXX9876';
    const isSampath = ord.assignedBusinessAccount === 'XXXX1122';
    
    const chosenBank = isHnb
      ? 'Hatton National Bank (HNB)'
      : isSampath
      ? 'Sampath Bank PLC'
      : 'Commercial Bank of Ceylon';
      
    const chosenHeader = isHnb ? 'HNB Alert' : isSampath ? 'SampathBank' : 'COMBANK';
    const mask = ord.assignedBusinessAccount || 'XXXX1234';
    const generatedRef = `CEFTS-${Math.floor(100000 + Math.random() * 900000)}`;

    setBankName(chosenBank);
    setSenderHeader(chosenHeader);
    setAmount(ord.orderAmount);
    setAccountMask(mask);
    setRefNumber(generatedRef);
    setCustomMsg(
      `${chosenHeader}: A/C *******${mask.replace('XXXX', '')} credited with ${ord.currency} ${ord.orderAmount.toLocaleString()}.00 by CEFTS from ${ord.customerName.toUpperCase()}. Ref: ${generatedRef}. Rem: ${ord.uniquePaymentRef}`
    );
  };

  const handleFillSelectedOrderPreset = () => {
    if (!selectedOrder) return;
    handleSelectOrder(selectedOrder.id);
  };

  const handleSimulateSms = async () => {
    setIsSubmitting(true);
    setSuccessCount(null);
    try {
      const resolved = await onSendSms({
        bankName,
        senderPhoneOrHeader: senderHeader,
        amount: Number(amount),
        accountNumberMasked: accountMask,
        referenceNumber: refNumber,
        rawMessage: customMsg,
      });
      setSuccessCount(resolved);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Bank SMS Feed (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/80 shadow-xs p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
              <Smartphone className="w-4 h-4 text-emerald-600" />
              <span>Inbound Bank SMS Feed ({smsList.length})</span>
            </span>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-mono font-bold">
              Gateway Active
            </span>
          </div>

          <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
            {smsList.map((sms) => (
              <div
                key={sms.id}
                className="p-3 rounded-lg border border-slate-200/80 bg-slate-50/50 space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900">{sms.bankName}</span>
                    <span className="text-[10px] font-mono text-slate-500 bg-white border border-slate-200 px-1 rounded">
                      {sms.senderPhoneOrHeader}
                    </span>
                  </div>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      sms.isUsed
                        ? 'bg-slate-200 text-slate-600'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {sms.isUsed ? 'Matched' : 'Unmatched'}
                  </span>
                </div>

                <div className="p-2 bg-slate-900 text-emerald-300 font-mono text-xs rounded">
                  "{sms.rawMessage}"
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-0.5">
                  <span>
                    Amount: <strong className="text-slate-800">{sms.currency} {sms.amount.toLocaleString()}</strong>
                  </span>
                  <span>Ref: {sms.referenceNumber}</span>
                  <span>{new Date(sms.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Simulate Inbound SMS (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Dynamic Customer Selector for Delayed SMS */}
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 space-y-2.5 text-xs">
            <span className="font-bold text-emerald-950 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
              <span>Simulate Delayed Bank SMS for Any Customer</span>
            </span>
            <p className="text-emerald-800 text-[11px]">
              Select which customer order you want to simulate an incoming bank SMS for:
            </p>

            {/* Dropdown to pick ANY customer */}
            <select
              value={selectedOrderId}
              onChange={(e) => handleSelectOrder(e.target.value)}
              className="w-full p-2 bg-white border border-emerald-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {orders.map((ord) => (
                <option key={ord.id} value={ord.id}>
                  {ord.customerName} ({ord.orderNumber}) — {ord.currency} {ord.orderAmount.toLocaleString()}
                </option>
              ))}
            </select>

            {selectedOrder && (
              <button
                onClick={handleFillSelectedOrderPreset}
                className="w-full text-xs font-semibold text-emerald-900 bg-emerald-200/70 hover:bg-emerald-200 border border-emerald-300 px-3 py-1.5 rounded-lg transition-colors flex items-center justify-center space-x-1.5"
              >
                <span>Fill Bank SMS for {selectedOrder.customerName} ({selectedOrder.currency} {selectedOrder.orderAmount.toLocaleString()})</span>
              </button>
            )}
          </div>

          {/* Form */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs space-y-3">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
              <PlusCircle className="w-4 h-4 text-emerald-600" />
              <span>Send Simulated Bank SMS</span>
            </span>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Bank Name</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. Commercial Bank of Ceylon or HNB"
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Sender Header</label>
                  <input
                    type="text"
                    value={senderHeader}
                    onChange={(e) => setSenderHeader(e.target.value)}
                    placeholder="e.g. COMBANK or HNB Alert"
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Amount ({config.defaultCurrency})
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Account Mask</label>
                  <input
                    type="text"
                    value={accountMask}
                    onChange={(e) => setAccountMask(e.target.value)}
                    placeholder="e.g. XXXX1234"
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Reference Number / UTR</label>
                  <input
                    type="text"
                    value={refNumber}
                    onChange={(e) => setRefNumber(e.target.value)}
                    placeholder="e.g. 839201 or CEFTS-123456"
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">SMS Message Body</label>
                <textarea
                  rows={3}
                  value={customMsg}
                  onChange={(e) => setCustomMsg(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>

              <button
                disabled={isSubmitting}
                onClick={handleSimulateSms}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-lg text-xs flex items-center justify-center space-x-1.5 transition-colors shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Inject SMS into Gateway</span>
              </button>

              {successCount !== null && (
                <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-800 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    SMS injected successfully! {successCount > 0 ? `Auto-approved ${successCount} pending order(s).` : 'Added to feed.'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

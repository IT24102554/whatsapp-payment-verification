import React, { useState } from 'react';
import {
  VerificationResult,
  VerificationDecision,
  SMEOrder,
  BankSMS,
} from '../types';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Upload,
  Search,
  MessageCircle,
  CreditCard,
  User,
  ArrowRight,
} from 'lucide-react';

interface ReviewConsoleProps {
  verifications: VerificationResult[];
  orders: SMEOrder[];
  bankSmsPool: BankSMS[];
  onManualOverride: (verificationId: string, newDecision: VerificationDecision, reason: string) => void;
  onVerifyNewSlip: (orderId: string, imageBase64: string) => void;
  onSelectTestCase: (testCaseId: string) => void;
}

export const ReviewConsole: React.FC<ReviewConsoleProps> = ({
  verifications,
  orders,
  onManualOverride,
  onVerifyNewSlip,
}) => {
  const [selectedId, setSelectedId] = useState<string>(verifications[0]?.id || '');
  const [filter, setFilter] = useState<'ALL' | 'APPROVED' | 'REJECTED' | 'NEEDS_VERIFICATION'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadOrderId, setUploadOrderId] = useState(orders[0]?.id || '');
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);

  const currentVerification = verifications.find((v) => v.id === selectedId) || verifications[0];

  const filteredList = verifications.filter((v) => {
    if (filter !== 'ALL' && v.decision !== filter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        v.customerName.toLowerCase().includes(q) ||
        v.orderNumber.toLowerCase().includes(q) ||
        (v.extractedData.referenceNumber || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const approvedCount = verifications.filter((v) => v.decision === 'APPROVED').length;
  const rejectedCount = verifications.filter((v) => v.decision === 'REJECTED').length;
  const pendingCount = verifications.filter((v) => v.decision === 'NEEDS_VERIFICATION').length;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const submitCustomSlip = () => {
    if (uploadedImagePreview && uploadOrderId) {
      onVerifyNewSlip(uploadOrderId, uploadedImagePreview);
      setUploadModalOpen(false);
      setUploadedImagePreview(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      {/* Clean Top Stat Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-slate-900">{pendingCount}</div>
            <div className="text-xs text-slate-500 font-medium">Needs Review</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-emerald-700">{approvedCount}</div>
            <div className="text-xs text-slate-500 font-medium">Approved (Safe to Ship)</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-rose-700">{rejectedCount}</div>
            <div className="text-xs text-slate-500 font-medium">Rejected / Declined</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Review Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Queue (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col h-[700px]">
          <div className="p-3.5 border-b border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                Payment Submissions ({filteredList.length})
              </span>
              <button
                onClick={() => setUploadModalOpen(true)}
                className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-lg flex items-center space-x-1 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Slip</span>
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by customer, order, or UTR..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex space-x-1 text-[11px] font-medium pt-0.5">
              <button
                onClick={() => setFilter('ALL')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  filter === 'ALL'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('NEEDS_VERIFICATION')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  filter === 'NEEDS_VERIFICATION'
                    ? 'bg-amber-600 text-white'
                    : 'text-amber-800 hover:bg-amber-50'
                }`}
              >
                Review ({pendingCount})
              </button>
              <button
                onClick={() => setFilter('APPROVED')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  filter === 'APPROVED'
                    ? 'bg-emerald-600 text-white'
                    : 'text-emerald-800 hover:bg-emerald-50'
                }`}
              >
                Approved ({approvedCount})
              </button>
              <button
                onClick={() => setFilter('REJECTED')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  filter === 'REJECTED'
                    ? 'bg-rose-600 text-white'
                    : 'text-rose-800 hover:bg-rose-50'
                }`}
              >
                Rejected ({rejectedCount})
              </button>
            </div>
          </div>

          {/* Queue List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-1.5 space-y-1">
            {filteredList.map((ver) => {
              const isSelected = ver.id === currentVerification?.id;
              return (
                <div
                  key={ver.id}
                  onClick={() => setSelectedId(ver.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-emerald-50/70 border-emerald-300'
                      : 'border-transparent hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-slate-900">{ver.customerName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{ver.orderNumber}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-900 font-mono">
                        {ver.expectedData.currency} {ver.extractedData.amount?.toLocaleString() || '---'}
                      </div>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                          ver.decision === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ver.decision === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {ver.decision === 'NEEDS_VERIFICATION' ? 'Review' : ver.decision}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-1">
                    {ver.primaryReason}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Payment Detail Inspector (8 cols) */}
        {currentVerification ? (
          <div className="lg:col-span-8 space-y-4">
            {/* Status Header Banner */}
            <div
              className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                currentVerification.decision === 'APPROVED'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : currentVerification.decision === 'REJECTED'
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${
                    currentVerification.decision === 'APPROVED'
                      ? 'bg-emerald-600'
                      : currentVerification.decision === 'REJECTED'
                      ? 'bg-rose-600'
                      : 'bg-amber-500'
                  }`}
                >
                  {currentVerification.decision === 'APPROVED' ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : currentVerification.decision === 'REJECTED' ? (
                    <XCircle className="w-5 h-5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="text-base font-bold">
                    {currentVerification.decision === 'APPROVED'
                      ? 'Payment Approved — Safe to Dispatch'
                      : currentVerification.decision === 'REJECTED'
                      ? 'Payment Rejected — Do Not Ship'
                      : 'Verification Required'}
                  </div>
                  <p className="text-xs text-slate-700 mt-0.5">
                    {currentVerification.primaryReason}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={() =>
                    onManualOverride(
                      currentVerification.id,
                      'APPROVED',
                      'Staff confirmed funds in bank account'
                    )
                  }
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  Approve
                </button>
                <button
                  onClick={() =>
                    onManualOverride(
                      currentVerification.id,
                      'REJECTED',
                      'Declined by staff officer'
                    )
                  }
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 text-rose-700 border border-slate-300 rounded-lg text-xs font-semibold"
                >
                  Reject
                </button>
              </div>
            </div>

            {/* Side-by-Side: Customer Slip vs System Conclusion */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Customer Slip (5 cols) */}
              <div className="md:col-span-5 bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Customer Submission</span>
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    {currentVerification.orderNumber}
                  </span>
                </div>

                {/* Slip Image */}
                <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center">
                  <img
                    src={currentVerification.slipImageUrl}
                    alt="Payment Slip"
                    className="max-h-64 object-contain"
                  />
                </div>

                {/* Order Contract Info */}
                <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Customer</span>
                    <span className="font-semibold text-slate-900">{currentVerification.customerName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">WhatsApp Phone</span>
                    <span className="font-mono text-slate-700">{currentVerification.customerPhone}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Expected Total</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {currentVerification.expectedData.currency}{' '}
                      {currentVerification.expectedData.amount.toLocaleString()}.00
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Payment Token</span>
                    <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 rounded">
                      {currentVerification.expectedData.uniquePaymentRef}
                    </span>
                  </div>
                </div>
              </div>

              {/* Verification & SMS Evidence (7 cols) */}
              <div className="md:col-span-7 bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs space-y-3">
                <span className="text-xs font-bold text-slate-800 block pb-2 border-b border-slate-100">
                  Verification Breakdown
                </span>

                {/* Extracted Fields */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Extracted Amount</span>
                    <span
                      className={`text-sm font-bold font-mono ${
                        currentVerification.extractedData.amount === currentVerification.expectedData.amount
                          ? 'text-emerald-700'
                          : 'text-rose-600'
                      }`}
                    >
                      {currentVerification.extractedData.currency || 'Rs.'}{' '}
                      {currentVerification.extractedData.amount?.toLocaleString() || 'Unreadable'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Transaction Ref / UTR</span>
                    <span className="text-sm font-bold font-mono text-slate-900">
                      {currentVerification.extractedData.referenceNumber || 'Not Found'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Receiving Account</span>
                    <span className="font-mono font-medium text-slate-700">
                      {currentVerification.extractedData.receivingAccount || 'Unknown'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Bank Organization</span>
                    <span className="font-medium text-slate-800">
                      {currentVerification.extractedData.bankName || 'Bank Transfer'}
                    </span>
                  </div>
                </div>

                {/* Verification Checklist */}
                <div className="space-y-1.5 pt-1">
                  {currentVerification.rulesEvaluated.slice(0, 4).map((rule) => (
                    <div
                      key={rule.id}
                      className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        {rule.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        )}
                        <span className="font-medium text-slate-800">{rule.name}</span>
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          rule.passed
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {rule.passed ? 'Matched' : 'Failed'}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Bank SMS Evidence Card */}
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 flex items-center space-x-1">
                      <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Bank SMS Confirmation</span>
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        currentVerification.matchedSms
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {currentVerification.matchedSms ? 'Confirmed' : 'Pending SMS'}
                    </span>
                  </div>
                  {currentVerification.matchedSms ? (
                    <div className="font-mono text-[11px] text-slate-700 bg-white p-2 rounded border border-slate-200">
                      "{currentVerification.matchedSms.rawMessage}"
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500">
                      Waiting for bank SMS alert. Payment held safely in review.
                    </p>
                  )}
                </div>

                {/* WhatsApp Customer Response */}
                <div className="p-3 rounded-lg bg-emerald-950 text-white text-xs space-y-1">
                  <div className="font-semibold text-emerald-300 flex items-center space-x-1 text-[11px]">
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp Bot Reply to Customer:</span>
                  </div>
                  <p className="text-emerald-100 italic text-[11px]">
                    "{currentVerification.customerWhatsAppReply}"
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Upload Slip Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900">Upload Payment Slip</h3>
              <button
                onClick={() => setUploadModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-base"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Select Order
                </label>
                <select
                  value={uploadOrderId}
                  onChange={(e) => setUploadOrderId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                >
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.orderNumber} — {o.customerName} ({o.currency} {o.orderAmount.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Slip Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
              </div>

              {uploadedImagePreview && (
                <div className="border border-slate-200 rounded-lg p-1 bg-slate-50">
                  <img
                    src={uploadedImagePreview}
                    alt="Preview"
                    className="max-h-40 mx-auto object-contain rounded"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-1">
              <button
                onClick={() => setUploadModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                disabled={!uploadedImagePreview}
                onClick={submitCustomSlip}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg"
              >
                Verify Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

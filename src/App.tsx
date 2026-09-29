import React, { useState, useEffect } from 'react';
import { Navbar, ActiveTabType } from './components/Navbar';
import { ReviewConsole } from './components/ReviewConsole';
import { WhatsAppSimulator } from './components/WhatsAppSimulator';
import { BankSmsSimulator } from './components/BankSmsSimulator';
import { BenchmarkSuite } from './components/BenchmarkSuite';
import { SettingsModal } from './components/SettingsModal';
import {
  SMEOrder,
  BankSMS,
  VerificationResult,
  BusinessConfig,
  VerificationDecision,
} from './types';
import {
  INITIAL_ORDERS,
  INITIAL_BANK_SMS,
  DEFAULT_BUSINESS_CONFIG,
  getPresetTestCases,
} from './data/mockData';
import { runRuleBasedVerification } from './services/verificationEngine';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTabType>('console');
  const [orders, setOrders] = useState<SMEOrder[]>([...INITIAL_ORDERS]);
  const [bankSmsPool, setBankSmsPool] = useState<BankSMS[]>([...INITIAL_BANK_SMS]);
  const [verifications, setVerifications] = useState<VerificationResult[]>([]);
  const [config, setConfig] = useState<BusinessConfig>({ ...DEFAULT_BUSINESS_CONFIG });
  const [hasGeminiApiKey, setHasGeminiApiKey] = useState<boolean>(true);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Initialize data from API or fallback
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [configRes, ordersRes, smsRes, historyRes] = await Promise.all([
          fetch('/api/config').then((r) => r.json()),
          fetch('/api/orders').then((r) => r.json()),
          fetch('/api/sms').then((r) => r.json()),
          fetch('/api/history').then((r) => r.json()),
        ]);

        if (configRes?.config) setConfig(configRes.config);
        if (configRes?.hasGeminiApiKey !== undefined) setHasGeminiApiKey(configRes.hasGeminiApiKey);
        if (ordersRes?.orders) setOrders(ordersRes.orders);
        if (smsRes?.smsList) setBankSmsPool(smsRes.smsList);
        if (historyRes?.history && historyRes.history.length > 0) {
          setVerifications(historyRes.history);
        } else {
          seedInitialVerifications();
        }
      } catch (err) {
        console.warn('API fetch warning, using local state:', err);
        seedInitialVerifications();
      }
    };

    fetchData();
  }, []);

  const seedInitialVerifications = () => {
    const testCases = getPresetTestCases();
    const seeded: VerificationResult[] = [];

    // Seed Normal (Approved)
    const normal = runRuleBasedVerification({
      order: testCases[0].order,
      slipImage: testCases[0].imageUrl || '',
      extractedData: testCases[0].mockSlipData as any,
      config: DEFAULT_BUSINESS_CONFIG,
      bankSmsPool: INITIAL_BANK_SMS,
      historyLedger: [],
    });
    seeded.push(normal);

    // Seed Underpaid (Rejected)
    const underpaid = runRuleBasedVerification({
      order: testCases[1].order,
      slipImage: testCases[1].imageUrl || '',
      extractedData: testCases[1].mockSlipData as any,
      config: DEFAULT_BUSINESS_CONFIG,
      bankSmsPool: INITIAL_BANK_SMS,
      historyLedger: [normal],
    });
    seeded.push(underpaid);

    // Seed Delayed SMS (Needs Verification - Nimash)
    const delayed = runRuleBasedVerification({
      order: testCases[10].order,
      slipImage: testCases[10].imageUrl || '',
      extractedData: testCases[10].mockSlipData as any,
      config: DEFAULT_BUSINESS_CONFIG,
      bankSmsPool: INITIAL_BANK_SMS.filter((s) => s.referenceNumber !== 'CEFTS-992144'),
      historyLedger: [normal, underpaid],
    });
    seeded.push(delayed);

    // Seed Rashmi Bandara (ORD-8926 - Needs Verification)
    const rashmiOrder = orders.find((o) => o.id === 'ord-106') || testCases[0].order;
    const rashmiPending = runRuleBasedVerification({
      order: rashmiOrder,
      slipImage: testCases[9].imageUrl || '',
      extractedData: {
        bankName: 'Commercial Bank of Ceylon',
        senderName: 'Rashmi Bandara',
        receivingAccount: 'XXXX1234',
        amount: 50000,
        currency: 'LKR',
        referenceNumber: 'CEFTS-500892',
        transactionTimestamp: '2026-09-28T20:00:00.000Z',
        remarksOrPurpose: 'BS-8926',
        readabilityScore: 98,
        isTampered: false,
        tamperSignals: [],
      },
      config: DEFAULT_BUSINESS_CONFIG,
      bankSmsPool: INITIAL_BANK_SMS.filter((s) => s.referenceNumber !== '992817' && s.amount !== 50000),
      historyLedger: [normal, underpaid, delayed],
    });
    seeded.push(rashmiPending);

    setVerifications(seeded);
  };

  // Verify slip handler
  const handleVerifySlip = async (
    orderId: string,
    slipImage: string,
    mockSlipData?: any
  ): Promise<VerificationResult | void> => {
    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          slipImage,
          mockExtractedData: mockSlipData,
        }),
      });

      const data = await res.json();
      if (data?.verification) {
        setVerifications((prev) => [data.verification, ...prev]);

        // Refresh orders if paid
        if (data.verification.decision === 'APPROVED') {
          setOrders((prev) =>
            prev.map((o) => (o.id === orderId ? { ...o, status: 'PAID' } : o))
          );
        }
        return data.verification;
      }
    } catch (e) {
      console.warn('Backend verify error, running local fallback:', e);
      const targetOrder = orders.find((o) => o.id === orderId) || orders[0];
      const localResult = runRuleBasedVerification({
        order: targetOrder,
        slipImage,
        extractedData: mockSlipData,
        config,
        bankSmsPool,
        historyLedger: verifications,
      });
      setVerifications((prev) => [localResult, ...prev]);
      if (localResult.decision === 'APPROVED') {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: 'PAID' } : o))
        );
      }
      return localResult;
    }
  };

  // Manual override handler
  const handleManualOverride = async (
    verificationId: string,
    newDecision: VerificationDecision,
    reason: string
  ) => {
    try {
      await fetch('/api/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verificationId,
          newDecision,
          overrideReason: reason,
        }),
      });
    } catch (e) {
      console.warn('Override backend sync error:', e);
    }

    setVerifications((prev) =>
      prev.map((v) => {
        if (v.id === verificationId) {
          return {
            ...v,
            decision: newDecision,
            manualOverride: {
              overriddenBy: 'Staff Officer (Manual Review)',
              previousDecision: v.decision,
              newDecision,
              overrideReason: reason,
              timestamp: new Date().toISOString(),
            },
          };
        }
        return v;
      })
    );
  };

  // Bank SMS send simulator handler
  const handleSendBankSms = async (newSmsData: any): Promise<number> => {
    try {
      const res = await fetch('/api/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSmsData),
      });
      const data = await res.json();
      if (data?.sms) {
        setBankSmsPool((prev) => [data.sms, ...prev]);

        // Refresh verifications and orders
        const historyRes = await fetch('/api/history').then((r) => r.json());
        if (historyRes?.history) setVerifications(historyRes.history);

        const ordersRes = await fetch('/api/orders').then((r) => r.json());
        if (ordersRes?.orders) setOrders(ordersRes.orders);

        return data.autoResolvedCount || 0;
      }
    } catch (e) {
      console.warn('Bank SMS simulation fallback:', e);
      const newSms: BankSMS = {
        id: `sms-${Date.now()}`,
        bankName: newSmsData.bankName,
        senderPhoneOrHeader: newSmsData.senderPhoneOrHeader,
        amount: Number(newSmsData.amount),
        currency: config.defaultCurrency,
        accountNumberMasked: newSmsData.accountNumberMasked,
        referenceNumber: newSmsData.referenceNumber,
        timestamp: new Date().toISOString(),
        rawMessage: newSmsData.rawMessage,
        isUsed: false,
      };
      setBankSmsPool((prev) => [newSms, ...prev]);
    }
    return 0;
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">
      {/* Top Navbar with WhatsApp Emerald Green theme */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openSettings={() => setSettingsOpen(true)}
        hasGeminiApiKey={hasGeminiApiKey}
      />

      {/* Main Content Areas */}
      <main className="flex-1 pb-12">
        {activeTab === 'console' && (
          <ReviewConsole
            verifications={verifications}
            orders={orders}
            bankSmsPool={bankSmsPool}
            onManualOverride={handleManualOverride}
            onVerifyNewSlip={(orderId, img) => handleVerifySlip(orderId, img)}
            onSelectTestCase={() => {}}
          />
        )}

        {activeTab === 'whatsapp' && (
          <WhatsAppSimulator
            orders={orders}
            bankSmsPool={bankSmsPool}
            onVerifySlip={handleVerifySlip}
          />
        )}

        {activeTab === 'sms' && (
          <BankSmsSimulator
            smsList={bankSmsPool}
            config={config}
            orders={orders}
            verifications={verifications}
            onSendSms={handleSendBankSms}
          />
        )}

        {activeTab === 'benchmark' && (
          <BenchmarkSuite config={config} />
        )}
      </main>

      {/* Clean Minimal Footer */}
      <footer className="bg-white border-t border-slate-200 py-3 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-800">BuildStart PayVerify™</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-600">Automated Bank Transfer Verification</span>
          </div>
          <div className="text-[11px] text-slate-400">
            © 2026 BuildStart Lanka (Pvt) Ltd
          </div>
        </div>
      </footer>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        config={config}
        onSaveConfig={(newConfig) => {
          setConfig(newConfig);
          fetch('/api/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newConfig),
          }).catch(console.warn);
        }}
      />
    </div>
  );
}

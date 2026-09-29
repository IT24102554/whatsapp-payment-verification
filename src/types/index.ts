export type VerificationDecision = 'APPROVED' | 'REJECTED' | 'NEEDS_VERIFICATION';

export type PaymentScenarioId =
  | 'normal'
  | 'wrong_amount_under'
  | 'wrong_amount_over'
  | 'wrong_account'
  | 'duplicate_exact'
  | 'reused_diff_order'
  | 'same_payment_diff_image'
  | 'old_payment'
  | 'edited_suspicious'
  | 'unclear_image'
  | 'conflicting_evidence'
  | 'missing_sms_delayed'
  | 'multiple_customers_collision';

export interface SMEOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  orderAmount: number;
  currency: string;
  items: string[];
  createdAt: string; // ISO string
  status: 'PENDING_PAYMENT' | 'PAID' | 'VERIFYING' | 'CANCELLED';
  uniquePaymentRef: string; // e.g., "BS-8902" provided by WhatsApp agent to customer
  assignedBusinessAccount: string;
}

export interface BankSMS {
  id: string;
  bankName: string;
  senderPhoneOrHeader: string; // e.g. "HBL-Alert", "MeezanBank", "SCB-Notify"
  amount: number;
  currency: string;
  accountNumberMasked: string; // e.g. "XXXX1234"
  referenceNumber: string; // e.g. "839201"
  timestamp: string; // ISO string
  rawMessage: string;
  matchedOrderId?: string;
  isUsed: boolean;
}

export interface ExtractedSlipData {
  bankName?: string;
  senderName?: string;
  senderAccount?: string;
  receivingAccount?: string;
  amount?: number;
  currency?: string;
  referenceNumber?: string;
  transactionTimestamp?: string;
  remarksOrPurpose?: string;
  readabilityScore: number; // 0 to 100
  isTampered: boolean;
  tamperSignals: string[];
  rawOcrText?: string;
}

export interface VerificationRuleCheck {
  id: string;
  name: string;
  passed: boolean;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  description: string;
  observed: string;
  expected: string;
}

export interface VerificationResult {
  id: string;
  submissionId: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  timestamp: string;
  decision: VerificationDecision;
  confidenceScore: number; // 0 to 100%
  primaryReason: string;
  nextAction: string;
  customerWhatsAppReply: string;
  
  // Pipeline Performance & Cost
  pipelineTierResolved: 'TIER_0_CACHE_HASH' | 'TIER_1_HEURISTIC_SMS' | 'TIER_2_GEMINI_VISION';
  processingTimeMs: number;
  estimatedCostUsd: number;
  savingsVsNaiveAiUsd: number;

  // Extracted vs Expected
  extractedData: ExtractedSlipData;
  expectedData: {
    amount: number;
    currency: string;
    accountNumber: string;
    customerName: string;
    uniquePaymentRef: string;
    orderDate: string;
  };

  // Rule Audit
  rulesEvaluated: VerificationRuleCheck[];

  // Matched Evidence
  matchedSmsId?: string;
  matchedSms?: BankSMS;
  imageHash: string;
  duplicateOfSubmissionId?: string;
  
  // Image URL/Data URL
  slipImageUrl: string;
  
  // Human Reviewer actions
  manualOverride?: {
    overriddenBy: string;
    previousDecision: VerificationDecision;
    newDecision: VerificationDecision;
    overrideReason: string;
    timestamp: string;
  };
}

export interface BusinessConfig {
  businessName: string;
  defaultCurrency: string;
  registeredAccounts: {
    bankName: string;
    accountTitle: string;
    accountNumber: string;
    accountMask: string;
    iban: string;
  }[];
  smsGracePeriodMinutes: number; // How long to wait before declaring SMS missing
  allowedAmountTolerance: number; // 0 for exact match
  autoApproveConfidenceThreshold: number; // e.g. 85%
  enableTamperDetection: boolean;
}

export interface TestCase {
  id: PaymentScenarioId;
  title: string;
  subtitle: string;
  category: 'NORMAL' | 'FRAUD_ATTEMPT' | 'DATA_MISMATCH' | 'SYSTEM_UNCERTAINTY';
  expectedDecision: VerificationDecision;
  description: string;
  order: SMEOrder;
  mockSms?: BankSMS;
  mockSlipData: Partial<ExtractedSlipData>;
  scenarioNotes: string;
  imageUrl?: string;
}

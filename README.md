# WhatsApp Bank Transfer Payment Verification Engine for Sri Lankan SMEs

An automated verification engine for Sri Lankan bank transfer receipts (CEFTS/SLIPS) sent via WhatsApp, featuring rule-based checks, duplicate detection, bank SMS cross-referencing, and AI vision extraction.

---

## 1. Setup Instructions

### Local Setup (GitHub / IntelliJ / VS Code)
1. **Clone the repository**:
   ```bash
   git clone <YOUR_GITHUB_REPO_URL>
   cd <REPO_FOLDER>
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Run development server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

4. **(Optional) Environment Variables**:
   Create a `.env` file in the root folder if using live Gemini Vision AI:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

### Netlify Deployment
1. Connect your GitHub repository to [Netlify](https://app.netlify.com/).
2. Set Build Settings:
   - **Build Command:** `npm run build`
   - **Publish Directory:** `dist`
3. Click **Deploy Site**.

---

## 2. Architecture Overview

The system uses a tiered verification pipeline designed for high accuracy and low cost:

```
[Customer Slip via WhatsApp]
           │
           ▼
[Tier 0: Hash Deduplication] ──(Duplicate found)──► REJECTED ($0.00 Cost)
           │ (Unique slip)
           ▼
[Tier 1: Data Extraction] (Regex / OCR / Gemini Flash Vision)
           │
           ▼
[Tier 2: Rule Evaluation]
• Beneficiary account match
• Exact amount match
• 24h date freshness
• Unique UTR / Reference check
• Tamper & font check
           │
           ▼
[Tier 3: Bank SMS Ground Truth] (Cross-reference with ComBank/HNB/Sampath alerts)
           │
           ▼
[Decision Engine] ──► APPROVED / NEEDS_VERIFICATION / REJECTED
```

### Core Components:
- **WhatsApp Simulator:** Simulates customer chat and sends automated bilingual responses.
- **Review Console:** Merchant dashboard with metrics, transaction history, audit trails, and manual override.
- **Bank SMS Gateway:** Simulates real-time inbound bank transaction SMS notifications.
- **Benchmark Suite:** Automated testing across 11 test cases and edge cases.

---

## 3. Major Design Decisions

1. **Deterministic Rules Over Black-Box AI:** LLM is used only for text extraction; financial approval/rejection decisions are made strictly by deterministic code rules.
2. **Explicit Uncertainty (`NEEDS_VERIFICATION`):** Low-readability slips or delayed SMS receipts are flagged for review rather than guessing or wrongly rejecting customers.
3. **Bank SMS as Ground Truth:** Bank alert SMS notifications are treated as authoritative source of truth.
4. **Polite, Non-Accusatory Bot Messages:** Customer replies clearly guide the user without exposing internal fraud triggers.

---

## 4. Verification Approach

Every slip is verified against order data using a 3-factor correlation:
1. **Unique Reference Code:** Each order has a unique token (e.g. `BS-8921`) that customers put in the bank transfer remarks.
2. **Beneficiary Account Mask:** Validates that money was sent to the business's registered bank account.
3. **Exact Amount Match:** Zero tolerance for shortfalls; underpayments are identified and requested.
4. **Disambiguation:** Uses UTR, sender name, and reference tokens to handle identical payments from different customers.

---

## 5. Fraud-Handling Approach

| Fraud Type | Detection Method | System Action |
|---|---|---|
| **Duplicate Slip** | Image hash (pHash/SHA-256) matches existing ledger | **REJECTED** instantly at $0.00 AI cost |
| **Reused Reference (UTR)** | CEFTS reference already redeemed on another order | **REJECTED** as reused payment |
| **Edited / Manipulated Slip** | Font mismatch, uneven baseline, SMS amount mismatch | **REJECTED** with high fraud risk flag |
| **Old / Expired Slip** | Slip timestamp > 24 hours older than order | **REJECTED** with request for fresh receipt |
| **Wrong Bank Account** | Receiving account does not match merchant's accounts | **REJECTED** with notice of wrong account |

---

## 6. Cost Considerations

- **Tier 0 Deduplication ($0.000):** Duplicates are rejected via hash matching in < 5ms without calling paid AI APIs.
- **Deterministic First ($0.000):** Regex and heuristic matching short-circuit most common cases.
- **Lightweight Vision ($0.0015):** When AI extraction is needed, compressed images are sent to `gemini-2.5-flash`.
- **Result:** Over **90% cost reduction** compared to naive multi-modal AI systems.

---

## 7. Known Limitations

1. **SMS Delays:** Commercial bank SMS delays place orders in `NEEDS_VERIFICATION` until the SMS arrives or staff manually verifies.
2. **Handwritten Deposit Slips:** Paper deposit slips with illegible handwriting require manual verification.
3. **Prototype In-Memory Store:** The current demo stores records in memory; a production rollout requires Redis and PostgreSQL.
4. **Closed-Loop Wallets:** Third-party wallets without national CEFTS reference numbers cannot be auto-reconciled against bank SMS.

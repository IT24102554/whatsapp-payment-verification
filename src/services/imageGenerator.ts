/**
 * Utility to generate realistic bank transfer slip images for testing & simulation.
 * Returns standard PNG Data URLs with authentic banking layouts, typography, stamps,
 * and optional simulation artifacts (tampering, blur, cropping).
 */

export interface SlipRenderOptions {
  bankName: string;
  senderName: string;
  receiverTitle: string;
  receiverAccount: string;
  amount: number;
  currency: string;
  refNumber: string;
  dateTime: string;
  remarks?: string;
  isTampered?: boolean;
  tamperType?: 'altered_amount' | 'cut_paste_ref' | 'mismatched_font';
  isBlurry?: boolean;
  isCropped?: boolean;
}

export function generateBankSlipDataUrl(options: SlipRenderOptions): string {
  // If window/document is available (browser environment), render via Canvas for ultra-crisp output
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = 460;
    canvas.height = 680;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Background (clean mobile bank app receipt style)
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Card Container
      ctx.fillStyle = '#ffffff';
      ctx.roundRect(20, 20, 420, 640, 16);
      ctx.fill();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Sri Lankan Bank Brand Header Bar
      const isComBank = options.bankName.includes('Commercial Bank') || options.bankName.includes('COMBANK');
      const isHNB = options.bankName.includes('HNB') || options.bankName.includes('Hatton');
      const isSampath = options.bankName.includes('Sampath');
      const isBOC = options.bankName.includes('BOC') || options.bankName.includes('Bank of Ceylon');
      
      const headerColor = isComBank
        ? '#002b66'
        : isHNB
        ? '#004b87'
        : isSampath
        ? '#c2410c'
        : isBOC
        ? '#92400e'
        : '#065f46';
      
      ctx.fillStyle = headerColor;
      ctx.roundRect(20, 20, 420, 90, [16, 16, 0, 0]);
      ctx.fill();

      // Bank Logo / Title
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
      ctx.fillText(options.bankName, 44, 58);

      ctx.font = '11px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillText('LankaPay CEFTS Funds Transfer • Digital Banking Receipt', 44, 80);

      // Success Checkmark Icon Badge
      ctx.fillStyle = '#ecfdf5';
      ctx.beginPath();
      ctx.arc(230, 145, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Checkmark drawing
      ctx.beginPath();
      ctx.moveTo(222, 145);
      ctx.lineTo(228, 152);
      ctx.lineTo(240, 138);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Transfer Successful Header
      ctx.fillStyle = '#065f46';
      ctx.font = 'bold 15px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Transfer Successful', 230, 190);

      // Amount Display
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 30px system-ui, sans-serif';
      
      // Tampering Simulation on Amount
      if (options.isTampered && options.tamperType === 'altered_amount') {
        // Draw normal currency
        ctx.textAlign = 'right';
        ctx.fillText(options.currency + ' ', 170, 232);
        
        // Draw altered amount with visible font disparity, pixel patch box!
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(175, 200, 170, 42); // Suspicious digital cut-box
        ctx.strokeStyle = '#cbd5e1';
        ctx.strokeRect(175, 200, 170, 42);

        ctx.fillStyle = '#000000';
        ctx.font = 'bold 34px "Courier New", monospace'; // Clashing fake font!
        ctx.textAlign = 'left';
        ctx.fillText(options.amount.toLocaleString(), 185, 234);
      } else {
        ctx.textAlign = 'center';
        ctx.fillText(`${options.currency} ${options.amount.toLocaleString()}.00`, 230, 232);
      }

      // Divider Line
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(44, 255);
      ctx.lineTo(416, 255);
      ctx.stroke();

      // Key Details Grid
      ctx.textAlign = 'left';
      let y = 285;
      const rowGap = 34;

      const drawRow = (label: string, value: string, isSuspicious?: boolean) => {
        ctx.fillStyle = '#64748b';
        ctx.font = '13px system-ui, sans-serif';
        ctx.fillText(label, 44, y);

        ctx.textAlign = 'right';
        if (isSuspicious) {
          ctx.fillStyle = '#dc2626';
          ctx.font = 'bold 13px "Courier New", monospace';
          ctx.fillText(value + ' ⚠️', 416, y);
        } else {
          ctx.fillStyle = '#1e293b';
          ctx.font = '600 13px system-ui, sans-serif';
          ctx.fillText(value, 416, y);
        }
        ctx.textAlign = 'left';
        y += rowGap;
      };

      drawRow('Sender Name', options.senderName);
      drawRow('To Beneficiary', options.receiverTitle);
      drawRow('Receiving Account', options.receiverAccount);
      drawRow('Date & Time', options.dateTime);
      
      const isRefTampered = options.isTampered && options.tamperType === 'cut_paste_ref';
      drawRow('Transaction Ref / UTR', options.refNumber, isRefTampered);
      
      if (options.remarks) {
        drawRow('Purpose / Remarks', options.remarks);
      }

      // Security Seal / Watermark Stamp
      ctx.save();
      ctx.translate(330, 560);
      ctx.rotate(-0.18);
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.45)';
      ctx.lineWidth = 2;
      ctx.strokeRect(-60, -20, 120, 40);
      ctx.fillStyle = 'rgba(16, 185, 129, 0.45)';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('VERIFIED SYSTEM', 0, -2);
      ctx.fillText('BANK ELECTRONIC RECORD', 0, 12);
      ctx.restore();

      // Bottom notice
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('This is a computer generated payment advice.', 230, 620);
      ctx.fillText('For support, contact your bank or WhatsApp vendor.', 230, 638);

      // Simulating blur filter if requested
      if (options.isBlurry) {
        // Overlay a semi-transparent blur haze to degrade readability
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#334155';
        ctx.font = 'italic 16px sans-serif';
        ctx.fillText('[Low Contrast / Optical Camera Glare Simulator]', 230, 340);
      }

      return canvas.toDataURL('image/png');
    }
  }

  // Fallback SVG data URL (works in SSR and pure Node)
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="460" height="680" viewBox="0 0 460 680">
      <rect width="460" height="680" fill="#f8fafc"/>
      <rect x="20" y="20" width="420" height="640" rx="16" fill="#ffffff" stroke="#e2e8f0"/>
      <path d="M 20 36 C 20 27 27 20 36 20 L 424 20 C 433 20 440 27 440 36 L 440 110 L 20 110 Z" fill="#006a4e"/>
      <text x="44" y="60" fill="#ffffff" font-family="system-ui, sans-serif" font-size="22" font-weight="bold">${options.bankName}</text>
      <text x="44" y="82" fill="rgba(255,255,255,0.85)" font-family="system-ui, sans-serif" font-size="12">Digital Funds Transfer Receipt • Mobile Banking</text>
      <circle cx="230" cy="150" r="24" fill="#ecfdf5" stroke="#10b981" stroke-width="2"/>
      <path d="M 222 150 L 228 156 L 240 144" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round"/>
      <text x="230" y="195" fill="#065f46" font-family="system-ui, sans-serif" font-size="15" font-weight="bold" text-anchor="middle">Transfer Successful</text>
      <text x="230" y="235" fill="#0f172a" font-family="system-ui, sans-serif" font-size="30" font-weight="bold" text-anchor="middle">${options.currency} ${options.amount.toLocaleString()}.00</text>
      <line x1="44" y1="260" x2="416" y2="260" stroke="#e2e8f0" stroke-width="1"/>
      <text x="44" y="295" fill="#64748b" font-family="system-ui, sans-serif" font-size="13">Sender Name</text>
      <text x="416" y="295" fill="#1e293b" font-family="system-ui, sans-serif" font-size="13" font-weight="600" text-anchor="end">${options.senderName}</text>
      <text x="44" y="330" fill="#64748b" font-family="system-ui, sans-serif" font-size="13">To Beneficiary</text>
      <text x="416" y="330" fill="#1e293b" font-family="system-ui, sans-serif" font-size="13" font-weight="600" text-anchor="end">${options.receiverTitle}</text>
      <text x="44" y="365" fill="#64748b" font-family="system-ui, sans-serif" font-size="13">Receiving Account</text>
      <text x="416" y="365" fill="#1e293b" font-family="system-ui, sans-serif" font-size="13" font-weight="600" text-anchor="end">${options.receiverAccount}</text>
      <text x="44" y="400" fill="#64748b" font-family="system-ui, sans-serif" font-size="13">Date &amp; Time</text>
      <text x="416" y="400" fill="#1e293b" font-family="system-ui, sans-serif" font-size="13" font-weight="600" text-anchor="end">${options.dateTime}</text>
      <text x="44" y="435" fill="#64748b" font-family="system-ui, sans-serif" font-size="13">Transaction Ref / UTR</text>
      <text x="416" y="435" fill="#1e293b" font-family="system-ui, sans-serif" font-size="13" font-weight="600" text-anchor="end">${options.refNumber}</text>
      <text x="44" y="470" fill="#64748b" font-family="system-ui, sans-serif" font-size="13">Remarks / Order Code</text>
      <text x="416" y="470" fill="#006a4e" font-family="system-ui, sans-serif" font-size="13" font-weight="bold" text-anchor="end">${options.remarks || 'N/A'}</text>
      <text x="230" y="625" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">BuildStart Electronic WhatsApp Payment Advice</text>
    </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

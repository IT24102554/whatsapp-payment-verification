import React, { useState } from 'react';
import { SMEOrder, BankSMS, VerificationResult } from '../types';
import { getPresetTestCases } from '../data/mockData';
import {
  Send,
  Paperclip,
  CheckCheck,
  Phone,
  Video,
  MoreVertical,
  Smile,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';

interface WhatsAppSimulatorProps {
  orders: SMEOrder[];
  bankSmsPool: BankSMS[];
  onVerifySlip: (orderId: string, imageBase64: string, mockSlipData?: any) => Promise<VerificationResult | void>;
}

interface ChatMessage {
  id: string;
  sender: 'customer' | 'bot';
  text?: string;
  image?: string;
  timestamp: string;
}

export const WhatsAppSimulator: React.FC<WhatsAppSimulatorProps> = ({
  orders,
  onVerifySlip,
}) => {
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orders[0]?.id || '');
  const activeOrder = orders.find((o) => o.id === selectedOrderId) || orders[0];
  const testCases = getPresetTestCases();

  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({
    [orders[0]?.id || 'ord-101']: [
      {
        id: 'msg-1',
        sender: 'customer',
        text: `Hi BuildStart! I want to confirm my order for ${orders[0]?.items?.join(', ')}. How do I pay?`,
        timestamp: '18:31',
      },
      {
        id: 'msg-2',
        sender: 'bot',
        text: `Hello ${orders[0]?.customerName}! 👋 Thank you for ordering with BuildStart Lanka.\n\nYour Order Number is *${orders[0]?.orderNumber}* for a total of *${orders[0]?.currency} ${orders[0]?.orderAmount.toLocaleString()}.00*.\n\nPlease transfer to our bank account via CEFTS / Online Banking:\n• *Bank:* Commercial Bank of Ceylon (COMBANK)\n• *Account Title:* BuildStart Lanka (Pvt) Ltd\n• *A/C Number:* 1000123456 (XXXX1234)\n• *Branch:* Kollupitiya Branch (001)\n• *Payment Remark:* ${orders[0]?.uniquePaymentRef}\n\nOnce completed, please send your payment slip here!`,
        timestamp: '18:32',
      },
    ],
  });

  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const currentChat = messages[selectedOrderId] || [
    {
      id: 'default-welcome',
      sender: 'bot',
      text: `Hello ${activeOrder?.customerName}! Your order *${activeOrder?.orderNumber}* is ready. Total: *${activeOrder?.currency} ${activeOrder?.orderAmount.toLocaleString()}.00*. Please transfer and send your receipt.`,
      timestamp: '19:00',
    },
  ];

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    const newMsg: ChatMessage = {
      id: `cust-${Date.now()}`,
      sender: 'customer',
      text: inputMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => ({
      ...prev,
      [selectedOrderId]: [...(prev[selectedOrderId] || []), newMsg],
    }));
    setInputMessage('');

    setTimeout(() => {
      const botReply: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: 'Thank you! If you have made the transfer, please send your payment slip screenshot.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => ({
        ...prev,
        [selectedOrderId]: [...(prev[selectedOrderId] || []), botReply],
      }));
    }, 500);
  };

  const handleSendSlipPreset = async (testCaseId: string) => {
    const tc = testCases.find((t) => t.id === testCaseId);
    if (!tc || !tc.imageUrl) return;

    setIsProcessing(true);

    const customerMsg: ChatMessage = {
      id: `cust-slip-${Date.now()}`,
      sender: 'customer',
      text: 'Here is my payment slip!',
      image: tc.imageUrl,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => ({
      ...prev,
      [selectedOrderId]: [...(prev[selectedOrderId] || []), customerMsg],
    }));

    try {
      const result = await onVerifySlip(activeOrder.id, tc.imageUrl, tc.mockSlipData);
      if (result) {
        const botMsg: ChatMessage = {
          id: `bot-resp-${Date.now()}`,
          sender: 'bot',
          text: result.customerWhatsAppReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => ({
          ...prev,
          [selectedOrderId]: [...(prev[selectedOrderId] || []), botMsg],
        }));
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* WhatsApp Mobile Frame (7 cols) */}
        <div className="lg:col-span-7 flex justify-center">
          <div className="w-full max-w-[420px] bg-slate-900 rounded-[36px] p-3 shadow-xl border border-slate-800">
            {/* Phone Screen */}
            <div className="bg-[#efeae2] rounded-[28px] overflow-hidden flex flex-col h-[640px] relative">
              {/* WhatsApp App Header */}
              <div className="bg-[#075E54] text-white px-3.5 py-2.5 flex items-center justify-between shadow-xs">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-xs text-white">
                    BS
                  </div>
                  <div>
                    <div className="font-bold text-xs flex items-center space-x-1">
                      <span>BuildStart Retail</span>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                    </div>
                    <div className="text-[10px] text-emerald-200">
                      Verified Business Account
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-emerald-200">
                  <Video className="w-4 h-4 cursor-pointer hover:text-white" />
                  <Phone className="w-4 h-4 cursor-pointer hover:text-white" />
                  <MoreVertical className="w-4 h-4 cursor-pointer hover:text-white" />
                </div>
              </div>

              {/* Order Context */}
              <div className="bg-emerald-50/90 border-b border-emerald-200/50 px-3 py-1.5 flex items-center justify-between text-[11px] text-emerald-950 font-medium">
                <span>{activeOrder.orderNumber} ({activeOrder.currency} {activeOrder.orderAmount.toLocaleString()})</span>
                <span className="font-mono text-[10px] bg-emerald-200/70 text-emerald-900 px-1.5 rounded">
                  Ref: {activeOrder.uniquePaymentRef}
                </span>
              </div>

              {/* Chat Messages */}
              <div
                className="flex-1 overflow-y-auto p-3 space-y-2.5"
                style={{
                  backgroundImage: `radial-gradient(#cbd5e1 0.75px, transparent 0.75px)`,
                  backgroundSize: '12px 12px',
                }}
              >
                {currentChat.map((msg) => {
                  const isBot = msg.sender === 'bot';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg p-2.5 text-xs shadow-2xs ${
                          isBot
                            ? 'bg-white text-slate-800 rounded-tl-none'
                            : 'bg-[#d9fdd3] text-slate-900 rounded-tr-none'
                        }`}
                      >
                        {msg.image && (
                          <div className="mb-2 rounded overflow-hidden border border-slate-200">
                            <img
                              src={msg.image}
                              alt="Payment Slip"
                              className="w-full max-h-48 object-cover bg-slate-100"
                            />
                          </div>
                        )}

                        {msg.text && (
                          <div className="whitespace-pre-line leading-relaxed text-[12px]">
                            {msg.text}
                          </div>
                        )}

                        <div className="flex items-center justify-end space-x-1 mt-1 text-[9px] text-slate-400">
                          <span>{msg.timestamp}</span>
                          {!isBot && <CheckCheck className="w-3.5 h-3.5 text-blue-500" />}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {isProcessing && (
                  <div className="flex items-center space-x-2 bg-white/90 text-slate-600 p-2 rounded-lg text-xs w-max">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    <span>Checking payment slip...</span>
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="bg-[#f0f2f5] px-2.5 py-2 flex items-center space-x-2 border-t border-slate-200">
                <Smile className="w-5 h-5 text-slate-500 cursor-pointer" />
                <Paperclip className="w-5 h-5 text-slate-500 cursor-pointer" />
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 bg-white border-none rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none"
                />
                <button
                  onClick={handleSendMessage}
                  className="w-8 h-8 rounded-full bg-[#00a884] hover:bg-[#008f6f] text-white flex items-center justify-center transition-colors shadow-xs"
                >
                  <Send className="w-3.5 h-3.5 ml-0.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Quick Customer Conversation & Test Slips (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs space-y-3">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Customer Conversation
            </span>
            <select
              value={selectedOrderId}
              onChange={(e) => setSelectedOrderId(e.target.value)}
              className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
            >
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.customerName} ({o.orderNumber}) — {o.currency} {o.orderAmount.toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs space-y-3">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Send Sample Slip to Bot
            </span>
            <p className="text-xs text-slate-500">
              Select any scenario to see how the WhatsApp agent responds:
            </p>

            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {testCases.map((tc) => (
                <div
                  key={tc.id}
                  onClick={() => handleSendSlipPreset(tc.id)}
                  className="p-2.5 rounded-lg border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/30 cursor-pointer transition-all flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-xs text-slate-800">{tc.title}</div>
                    <div className="text-[11px] text-slate-500 line-clamp-1">{tc.subtitle}</div>
                  </div>
                  <button className="text-xs font-semibold text-emerald-700 flex items-center space-x-1 shrink-0 ml-2">
                    <span>Send</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import {
  ShieldCheck,
  LayoutDashboard,
  MessageSquare,
  Smartphone,
  Sparkles,
  Settings,
} from 'lucide-react';

export type ActiveTabType = 'console' | 'whatsapp' | 'sms' | 'benchmark';

interface NavbarProps {
  activeTab: ActiveTabType;
  setActiveTab: (tab: ActiveTabType) => void;
  openSettings: () => void;
  hasGeminiApiKey: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  openSettings,
}) => {
  return (
    <header className="bg-emerald-950 text-white border-b border-emerald-900/60 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base tracking-tight text-white">BuildStart</span>
                <span className="text-[11px] uppercase tracking-wider bg-emerald-800/80 text-emerald-200 px-2 py-0.5 rounded font-semibold">
                  PayVerify
                </span>
              </div>
              <p className="text-[11px] text-emerald-400 hidden sm:block">
                WhatsApp Payment Verification
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('console')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'console'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-emerald-200 hover:bg-emerald-900 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Review Queue</span>
            </button>

            <button
              onClick={() => setActiveTab('whatsapp')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'whatsapp'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-emerald-200 hover:bg-emerald-900 hover:text-white'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp Chat</span>
            </button>

            <button
              onClick={() => setActiveTab('sms')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'sms'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-emerald-200 hover:bg-emerald-900 hover:text-white'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Bank SMS Feed</span>
            </button>

            <button
              onClick={() => setActiveTab('benchmark')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'benchmark'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-emerald-200 hover:bg-emerald-900 hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Test Suite & Benchmarks</span>
            </button>
          </nav>

          {/* Settings */}
          <div className="flex items-center">
            <button
              onClick={openSettings}
              className="p-2 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-900 transition-colors"
              title="Bank Accounts &amp; Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

import React, { useState } from 'react';
import { BusinessConfig } from '../types';
import { Building, CreditCard, Shield, Clock, Plus, Trash2, X, Check } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: BusinessConfig;
  onSaveConfig: (newConfig: BusinessConfig) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [localConfig, setLocalConfig] = useState<BusinessConfig>({ ...config });
  const [savedToast, setSavedToast] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveConfig(localConfig);
    setSavedToast(true);
    setTimeout(() => {
      setSavedToast(false);
      onClose();
    }, 800);
  };

  const handleAccountChange = (index: number, field: string, value: string) => {
    const updated = [...localConfig.registeredAccounts];
    updated[index] = { ...updated[index], [field]: value };
    setLocalConfig({ ...localConfig, registeredAccounts: updated });
  };

  const addAccount = () => {
    setLocalConfig({
      ...localConfig,
      registeredAccounts: [
        ...localConfig.registeredAccounts,
        {
          bankName: 'New Bank',
          accountTitle: localConfig.businessName,
          accountNumber: '0000000000',
          accountMask: 'XXXX0000',
          iban: 'LK00COMB0000000000000000',
        },
      ],
    });
  };

  const removeAccount = (index: number) => {
    if (localConfig.registeredAccounts.length <= 1) return;
    const updated = localConfig.registeredAccounts.filter((_, i) => i !== index);
    setLocalConfig({ ...localConfig, registeredAccounts: updated });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                SME Merchant Configuration
              </h2>
              <p className="text-[11px] text-slate-500">
                Bank accounts whitelist, SMS grace periods, and verification thresholds
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {/* Business Name & Currency */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Business Name</label>
              <input
                type="text"
                value={localConfig.businessName}
                onChange={(e) => setLocalConfig({ ...localConfig, businessName: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Currency Prefix</label>
              <input
                type="text"
                value={localConfig.defaultCurrency}
                onChange={(e) => setLocalConfig({ ...localConfig, defaultCurrency: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Registered Bank Accounts Whitelist */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center space-x-1.5">
                <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                <span>Whitelisted Receiving Bank Accounts (Anti Wrong-Account Fraud)</span>
              </span>
              <button
                type="button"
                onClick={addAccount}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add Bank</span>
              </button>
            </div>

            <div className="space-y-2">
              {localConfig.registeredAccounts.map((acc, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center"
                >
                  <div>
                    <label className="text-[10px] text-slate-400 block">Bank Name</label>
                    <input
                      type="text"
                      value={acc.bankName}
                      onChange={(e) => handleAccountChange(idx, 'bankName', e.target.value)}
                      className="w-full p-1.5 border border-slate-300 rounded bg-white text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block">Account Mask</label>
                    <input
                      type="text"
                      value={acc.accountMask}
                      onChange={(e) => handleAccountChange(idx, 'accountMask', e.target.value)}
                      className="w-full p-1.5 border border-slate-300 rounded bg-white text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block">IBAN</label>
                    <input
                      type="text"
                      value={acc.iban}
                      onChange={(e) => handleAccountChange(idx, 'iban', e.target.value)}
                      className="w-full p-1.5 border border-slate-300 rounded bg-white text-xs font-mono"
                    />
                  </div>
                  <div className="flex items-center justify-end sm:justify-center pt-2 sm:pt-4">
                    <button
                      type="button"
                      disabled={localConfig.registeredAccounts.length <= 1}
                      onClick={() => removeAccount(idx)}
                      className="text-rose-600 hover:text-rose-800 disabled:opacity-30 p-1"
                      title="Remove Account"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Thresholds & Tolerance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <label className="font-semibold text-slate-800 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>SMS Grace Period (Minutes)</span>
              </label>
              <p className="text-[11px] text-slate-500">
                Time to wait before declaring Bank SMS missing if slip is genuine.
              </p>
              <input
                type="number"
                value={localConfig.smsGracePeriodMinutes}
                onChange={(e) =>
                  setLocalConfig({ ...localConfig, smsGracePeriodMinutes: Number(e.target.value) })
                }
                className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <label className="font-semibold text-slate-800 flex items-center space-x-1">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                <span>Auto-Approve Confidence Threshold (%)</span>
              </label>
              <p className="text-[11px] text-slate-500">
                Minimum confidence score required for auto-approval without manual review.
              </p>
              <input
                type="number"
                value={localConfig.autoApproveConfidenceThreshold}
                onChange={(e) =>
                  setLocalConfig({
                    ...localConfig,
                    autoApproveConfidenceThreshold: Number(e.target.value),
                  })
                }
                className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          {savedToast ? (
            <span className="text-xs font-bold text-emerald-700 flex items-center space-x-1">
              <Check className="w-4 h-4" />
              <span>Settings Saved Successfully!</span>
            </span>
          ) : (
            <span />
          )}

          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

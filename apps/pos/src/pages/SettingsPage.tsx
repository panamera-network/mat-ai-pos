import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@mat-ai/backoffice';
import {
  LogOut, Store, Percent, Printer, User, Shield, Bell, CreditCard, AlertTriangle,
} from 'lucide-react';
import { Input, Select } from '@mat-ai/ui';

interface FallbackSettings {
  fallbackChannel: 'whatsapp' | 'telegram' | 'sms' | 'none';
  whatsappNumber: string;
  telegramBotToken: string;
  telegramChatId: string;
}

interface BridgeSettings {
  bridgeHost: string;
  bridgePort: number;
  kdsName: string;
  kdsIp: string;
}

interface PrinterSettings {
  printerMode: 'browser' | 'escpos-network';
  printerHost: string;
  printerPort: number;
}

export function SettingsPage() {
  const { staff, logout } = useAuthStore();
  const roleName = staff?.role?.name || 'Unknown';
  const navigate = useNavigate();

  // Fallback settings state (same as original)
  const [fallbackSettings, setFallbackSettings] = useState<FallbackSettings>(() => {
    const saved = localStorage.getItem('mat-pos-settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          fallbackChannel: parsed.fallbackChannel || 'none',
          whatsappNumber: parsed.whatsappNumber || '',
          telegramBotToken: parsed.telegramBotToken || '',
          telegramChatId: parsed.telegramChatId || '',
        };
      } catch {
        // fall through to default
      }
    }
    return {
      fallbackChannel: 'none',
      whatsappNumber: '',
      telegramBotToken: '',
      telegramChatId: '',
    };
  });

  const [bridgeSettings, setBridgeSettings] = useState<BridgeSettings>(() => {
    const saved = localStorage.getItem('mat-pos-settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          bridgeHost: parsed.bridgeHost || parsed.wsHost || 'localhost',
          bridgePort: Number(parsed.bridgePort || parsed.wsPort || 8080),
          kdsName: parsed.kdsName || 'Main Kitchen',
          kdsIp: parsed.kdsIp || parsed.bridgeHost || parsed.wsHost || 'localhost',
        };
      } catch {
        // fall through to default
      }
    }
    return {
      bridgeHost: 'localhost',
      bridgePort: 8080,
      kdsName: 'Main Kitchen',
      kdsIp: 'localhost',
    };
  });

  const [printerSettings, setPrinterSettings] = useState<PrinterSettings>(() => {
    const saved = localStorage.getItem('mat-pos-settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          printerMode: parsed.printerMode || 'browser',
          printerHost: parsed.printerHost || '',
          printerPort: Number(parsed.printerPort || 9100),
        };
      } catch {
        // fall through to default
      }
    }
    return {
      printerMode: 'browser',
      printerHost: '',
      printerPort: 9100,
    };
  });

  const savePosSettings = (partial: Partial<FallbackSettings & BridgeSettings & PrinterSettings>) => {
    let current = {};
    try {
      current = JSON.parse(localStorage.getItem('mat-pos-settings') || '{}');
    } catch {
      current = {};
    }
    localStorage.setItem('mat-pos-settings', JSON.stringify({ ...current, ...partial }));
  };

  const handleFallbackChange = (field: keyof FallbackSettings, value: string) => {
    const updated = { ...fallbackSettings, [field]: value };
    setFallbackSettings(updated);
    savePosSettings(updated);
  };

  const handleBridgeChange = (field: keyof BridgeSettings, value: string | number) => {
    const updated = { ...bridgeSettings, [field]: value };
    if (field === 'kdsIp') {
      updated.bridgeHost = String(value || 'localhost');
      updated.bridgePort = 8080;
    }
    setBridgeSettings(updated);
    savePosSettings(updated);
  };

  const handlePrinterChange = (field: keyof PrinterSettings, value: string | number) => {
    const updated = { ...printerSettings, [field]: value };
    setPrinterSettings(updated);
    savePosSettings(updated);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const settingsGroups = [
    {
      title: 'Business',
      items: [
        { icon: Store, label: 'Business Info', desc: 'Name, address, contact' },
        { icon: Percent, label: 'Tax & Charges', desc: 'SST, service charge' },
        { icon: CreditCard, label: 'Payment Methods', desc: 'Cash, card, e-wallet' },
      ],
    },
    {
      title: 'Hardware',
      items: [
        { icon: Printer, label: 'Printer Settings', desc: 'Receipt printer config' },
        { icon: Bell, label: 'Notifications', desc: 'Alerts and sounds' },
      ],
    },
    {
      title: 'Security',
      items: [
        { icon: Shield, label: 'Staff PIN', desc: 'Manage access codes' },
        { icon: User, label: 'Roles', desc: `${roleName} — ${staff?.name || 'Guest'}`, disabled: false },
      ],
    },
  ];

  const fallbackOptions = [
    { value: 'whatsapp', label: 'WhatsApp (Default)' },
    { value: 'telegram', label: 'Telegram' },
    { value: 'sms', label: 'SMS' },
    { value: 'none', label: 'Disable Fallback' },
  ];

  const printerModeOptions = [
    { value: 'browser', label: 'Browser Print' },
    { value: 'escpos-network', label: 'ESC/POS Network Printer' },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      <h1 className="text-xl md:text-2xl font-bold text-gray-900">Settings</h1>

      {/* User Profile Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 md:p-6 flex items-center gap-4 border-b border-gray-100">
          <div className="w-14 h-14 md:w-16 md:h-16 bg-blue-100 rounded-2xl flex items-center justify-center">
            <User className="w-7 h-7 md:w-8 md:h-8 text-blue-600" />
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">{staff?.name || 'Admin'}</p>
            <p className="text-sm text-gray-500">{roleName} - {staff?.employmentType?.replace('_', ' ') || ''}</p>
          </div>
        </div>
      </div>

      {/* Settings Groups */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {settingsGroups.map((group) => (
          <div key={group.title} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 md:px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">{group.title}</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {group.items.map((item) => (
                <button key={item.label} className="w-full flex items-center gap-3 md:gap-4 p-4 md:px-6 hover:bg-gray-50 transition-colors text-left">
                  <item.icon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.label}</p>
                    <p className="text-xs text-gray-500 hidden sm:block">{item.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Printer Settings */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 md:px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Printer className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Printer</h2>
            <p className="text-xs text-gray-500">Browser print by default, or route ESC/POS printing through POS Bridge.</p>
          </div>
        </div>
        <div className="p-4 md:p-6 grid md:grid-cols-3 gap-4">
          <Select
            label="Printer Mode"
            value={printerSettings.printerMode}
            onChange={(e) => handlePrinterChange('printerMode', e.target.value)}
            options={printerModeOptions}
            fullWidth
          />
          <Input
            label="Printer Host"
            value={printerSettings.printerHost}
            onChange={(e) => handlePrinterChange('printerHost', e.target.value)}
            placeholder="192.168.1.50"
            disabled={printerSettings.printerMode === 'browser'}
            fullWidth
          />
          <Input
            label="Printer Port"
            type="number"
            value={printerSettings.printerPort}
            onChange={(e) => handlePrinterChange('printerPort', Number(e.target.value) || 9100)}
            disabled={printerSettings.printerMode === 'browser'}
            fullWidth
          />
        </div>
      </div>

      {/* KDS Terminal Settings */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 md:px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Bell className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">KDS Terminal</h2>
            <p className="text-xs text-gray-500">Kitchen screen registered from POS.</p>
          </div>
        </div>
        <div className="p-4 md:p-6 grid md:grid-cols-2 gap-4">
          <Input
            label="Name"
            value={bridgeSettings.kdsName}
            onChange={(e) => handleBridgeChange('kdsName', e.target.value)}
            placeholder="Main Kitchen"
            fullWidth
          />
          <Input
            label="IP Address"
            value={bridgeSettings.kdsIp}
            onChange={(e) => handleBridgeChange('kdsIp', e.target.value)}
            placeholder="192.168.100.107"
            fullWidth
          />
        </div>
      </div>

      {/* Offline Fallback Settings */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 md:px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <h2 className="font-semibold text-gray-900">Offline Fallback</h2>
        </div>
        <div className="p-4 md:p-6 space-y-4">
          <Select
            label="Fallback Channel"
            value={fallbackSettings.fallbackChannel}
            onChange={(e) => handleFallbackChange('fallbackChannel', e.target.value)}
            options={fallbackOptions}
            fullWidth
          />

          {fallbackSettings.fallbackChannel === 'whatsapp' && (
            <Input
              label="WhatsApp Number (with country code)"
              value={fallbackSettings.whatsappNumber}
              onChange={(e) => handleFallbackChange('whatsappNumber', e.target.value)}
              placeholder="60123456789"
              fullWidth
            />
          )}

          {fallbackSettings.fallbackChannel === 'telegram' && (
            <div className="space-y-3">
              <Input
                label="Bot Token"
                value={fallbackSettings.telegramBotToken}
                onChange={(e) => handleFallbackChange('telegramBotToken', e.target.value)}
                placeholder="123456:ABC-DEF..."
                fullWidth
              />
              <Input
                label="Chat ID"
                value={fallbackSettings.telegramChatId}
                onChange={(e) => handleFallbackChange('telegramChatId', e.target.value)}
                placeholder="-1001234567890"
                fullWidth
              />
            </div>
          )}

          {fallbackSettings.fallbackChannel === 'sms' && (
            <div className="p-3 bg-gray-50 rounded-xl text-sm text-gray-500">
              SMS fallback coming soon. Please use WhatsApp or Telegram for now.
            </div>
          )}
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full md:w-auto md:px-8 flex items-center justify-center gap-2 py-4 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors"
      >
        <LogOut className="w-5 h-5" />
        Logout
      </button>
    </div>
  );
}

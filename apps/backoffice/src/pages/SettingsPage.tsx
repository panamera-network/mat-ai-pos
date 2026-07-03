import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@mat-ai/backoffice';
import type { PaymentType, TaxRate, Device } from '@mat-ai/types';
import {
  Store, Palette, Bell, Shield, CreditCard, 
  ChevronRight, Save, Upload, Plus, Trash2, Smartphone,
  Receipt, Percent, Gift, MessageCircle, Send, Monitor
} from 'lucide-react';

interface SettingsSection {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
}

const sections: SettingsSection[] = [
  { id: 'general', label: 'General', icon: Store, description: 'Restaurant name, logo, and basic info' },
  { id: 'appearance', label: 'Appearance', icon: Palette, description: 'Theme colors and branding' },
  { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Email, WhatsApp, Telegram alerts' },
  { id: 'payment', label: 'Payment Type', icon: CreditCard, description: 'Manage payment methods' },
  { id: 'tax', label: 'Tax', icon: Percent, description: 'Tax rates and e-invoice settings' },
  { id: 'receipt', label: 'Receipt', icon: Receipt, description: 'Receipt template and settings' },
  { id: 'loyalty', label: 'Loyalty', icon: Gift, description: 'Loyalty program settings' },
  { id: 'device', label: 'Device', icon: Smartphone, description: 'POS device activation' },
  { id: 'security', label: 'Security', icon: Shield, description: 'Password, 2FA, and access control' },
  { id: 'billing', label: 'Billing', icon: CreditCard, description: 'Subscription and billing' },
];

export const SettingsPage: React.FC = () => {
  useAuthStore();
  const [activeSection, setActiveSection] = useState('general');
  
  // General
  const [restaurantName, setRestaurantName] = useState('MAT.ai Restaurant');
  const [restaurantLogo, setRestaurantLogo] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  
  // Appearance
  const [primaryColor, setPrimaryColor] = useState('#2563eb');
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('light');
  
  // Notifications
  const [notifications, setNotifications] = useState({
    lowStock: true,
    newOrder: true,
    dailySummary: false,
    staffClockIn: false,
    whatsappFallback: false,
    telegramFallback: false,
  });
  
  // Payment Types (using centralized PaymentType)
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([
    { id: '1', name: 'Cash', isActive: true },
    { id: '2', name: 'Credit Card', isActive: true },
    { id: '3', name: 'Touch n Go', isActive: true },
    { id: '4', name: 'GrabPay', isActive: true },
  ]);
  const [newPaymentType, setNewPaymentType] = useState('');
  
  // Tax Rates (using centralized TaxRate)
  const [taxRates, setTaxRates] = useState<TaxRate[]>([
    { id: '1', name: 'SST', rate: 6, isActive: true },
    { id: '2', name: 'Service Charge', rate: 10, isActive: false },
  ]);
  const [newTaxName, setNewTaxName] = useState('');
  const [newTaxRate, setNewTaxRate] = useState('');
  
  // Receipt
  const [receiptHeader, setReceiptHeader] = useState('MAT.ai Restaurant');
  const [receiptFooter, setReceiptFooter] = useState('Thank you for dining with us!');
  const [receiptLogo] = useState('');
  const [showCustomerInfo, setShowCustomerInfo] = useState(true);
  const [showQrCode, setShowQrCode] = useState(false);
  const [enableEinvoice, setEnableEinvoice] = useState(false);
  
  // Loyalty
  const [loyaltyEnabled, setLoyaltyEnabled] = useState(false);
  const [pointsPerRm, setPointsPerRm] = useState('1');
  const [redemptionRate, setRedemptionRate] = useState('100');
  
  // Devices (using centralized Device)
  const [devices, setDevices] = useState<Device[]>([
    { id: '1', name: 'POS Counter 1', outlet: 'MAT.ai HQ', status: 'active', lastSeen: '2 min ago', deviceType: 'pos' },
    { id: '2', name: 'POS Counter 2', outlet: 'MAT.ai HQ', status: 'active', lastSeen: '5 min ago', deviceType: 'pos' },
    { id: '3', name: 'KDS Station 1', outlet: 'MAT.ai HQ', status: 'inactive', lastSeen: '2 hours ago', deviceType: 'kds' },
  ]);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceOutlet, setNewDeviceOutlet] = useState('');
  const [newDeviceType, setNewDeviceType] = useState<'pos' | 'kds' | 'printer' | 'tablet'>('pos');
  
  // Security
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Load saved settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('mat-ai-settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.restaurantName) setRestaurantName(parsed.restaurantName);
        if (parsed.restaurantLogo) setRestaurantLogo(parsed.restaurantLogo);
        if (parsed.address) setAddress(parsed.address);
        if (parsed.phone) setPhone(parsed.phone);
        if (parsed.primaryColor) setPrimaryColor(parsed.primaryColor);
        if (parsed.theme) setTheme(parsed.theme);
        if (parsed.receiptHeader) setReceiptHeader(parsed.receiptHeader);
        if (parsed.receiptFooter) setReceiptFooter(parsed.receiptFooter);
        if (parsed.showCustomerInfo !== undefined) setShowCustomerInfo(parsed.showCustomerInfo);
        if (parsed.showQrCode !== undefined) setShowQrCode(parsed.showQrCode);
        if (parsed.loyaltyEnabled !== undefined) setLoyaltyEnabled(parsed.loyaltyEnabled);
        if (parsed.pointsPerRm) setPointsPerRm(parsed.pointsPerRm);
        if (parsed.redemptionRate) setRedemptionRate(parsed.redemptionRate);
      } catch (_error) {
        console.warn('Unable to parse saved backoffice settings.');
      }
    }
  }, []);

  const handleSave = () => {
    const settings = {
      restaurantName, restaurantLogo, address, phone,
      primaryColor, theme,
      receiptHeader, receiptFooter, showCustomerInfo, showQrCode,
      loyaltyEnabled, pointsPerRm, redemptionRate,
    };
    localStorage.setItem('mat-ai-settings', JSON.stringify(settings));
    alert('Settings saved!');
  };

  // Payment Type handlers
  const addPaymentType = () => {
    if (!newPaymentType.trim()) return;
    setPaymentTypes([...paymentTypes, { id: Date.now().toString(), name: newPaymentType.trim(), isActive: true }]);
    setNewPaymentType('');
  };
  const togglePaymentType = (id: string) => {
    setPaymentTypes(paymentTypes.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p));
  };
  const removePaymentType = (id: string) => {
    setPaymentTypes(paymentTypes.filter(p => p.id !== id));
  };

  // Tax handlers
  const addTaxRate = () => {
    if (!newTaxName.trim() || !newTaxRate) return;
    setTaxRates([...taxRates, { id: Date.now().toString(), name: newTaxName.trim(), rate: parseFloat(newTaxRate), isActive: true }]);
    setNewTaxName('');
    setNewTaxRate('');
  };
  const toggleTax = (id: string) => {
    setTaxRates(taxRates.map(t => t.id === id ? { ...t, isActive: !t.isActive } : t));
  };
  const removeTax = (id: string) => {
    setTaxRates(taxRates.filter(t => t.id !== id));
  };

  // Device handlers
  const addDevice = () => {
    if (!newDeviceName.trim()) return;
    setDevices([...devices, { 
      id: Date.now().toString(), 
      name: newDeviceName.trim(), 
      outlet: newDeviceOutlet || 'MAT.ai HQ', 
      status: 'active', 
      lastSeen: 'Just now',
      deviceType: newDeviceType,
    }]);
    setNewDeviceName('');
    setNewDeviceOutlet('');
  };
  const toggleDeviceStatus = (id: string) => {
    setDevices(devices.map(d => d.id === id ? { ...d, status: d.status === 'active' ? 'inactive' : 'active' } : d));
  };
  const removeDevice = (id: string) => {
    setDevices(devices.filter(d => d.id !== id));
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'general':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Restaurant Name</label>
              <input
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                className="w-full max-w-md px-4 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
                  {restaurantLogo ? (
                    <img src={restaurantLogo} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Store className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <button className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                    <Upload className="w-4 h-4" />
                    Upload Logo
                  </button>
                  <input 
                    type="text" 
                    placeholder="Or paste image URL..."
                    value={restaurantLogo}
                    onChange={(e) => setRestaurantLogo(e.target.value)}
                    className="px-3 py-2 border rounded-lg text-sm w-64"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <textarea 
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full max-w-md px-4 py-2 border rounded-lg text-sm" 
                rows={3} 
                placeholder="Restaurant address..." 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full max-w-md px-4 py-2 border rounded-lg text-sm" 
                placeholder="+60 12-345 6789" 
              />
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-12 h-12 rounded-lg cursor-pointer"
                />
                <span className="text-sm text-gray-500">{primaryColor}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
              <div className="flex gap-3">
                {(['light', 'dark', 'auto'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`px-4 py-2 border rounded-lg text-sm capitalize hover:bg-gray-50 ${theme === t ? 'bg-blue-50 border-blue-300 text-blue-700' : ''}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 mb-4">Notification Channels</h4>
            {[
              { key: 'lowStock', label: 'Low stock alerts' },
              { key: 'newOrder', label: 'New order notifications' },
              { key: 'dailySummary', label: 'Daily sales summary' },
              { key: 'staffClockIn', label: 'Staff clock-in alerts' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-4 border rounded-lg">
                <span className="text-sm text-gray-700">{item.label}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={notifications[item.key as keyof typeof notifications]}
                    onChange={(e) => setNotifications({...notifications, [item.key]: e.target.checked})}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
            
            <h4 className="font-medium text-gray-900 mb-4 mt-8">Fallback Channels</h4>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm text-gray-700">WhatsApp Fallback</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={notifications.whatsappFallback}
                  onChange={(e) => setNotifications({...notifications, whatsappFallback: e.target.checked})}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Send className="w-5 h-5 text-blue-500" />
                <span className="text-sm text-gray-700">Telegram Fallback</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={notifications.telegramFallback}
                  onChange={(e) => setNotifications({...notifications, telegramFallback: e.target.checked})}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        );

      case 'payment':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Payment Methods</h4>
            </div>
            <div className="space-y-3">
              {paymentTypes.map((pt) => (
                <div key={pt.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">{pt.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={pt.isActive}
                        onChange={() => togglePaymentType(pt.id)}
                      />
                      <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                    <button onClick={() => removePaymentType(pt.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="New payment type name..."
                value={newPaymentType}
                onChange={(e) => setNewPaymentType(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addPaymentType()}
                className="flex-1 max-w-xs px-4 py-2 border rounded-lg text-sm"
              />
              <button onClick={addPaymentType} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
          </div>
        );

      case 'tax':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Tax Rates</h4>
            </div>
            <div className="space-y-3">
              {taxRates.map((tax) => (
                <div key={tax.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Percent className="w-5 h-5 text-gray-400" />
                    <div>
                      <span className="text-sm font-medium text-gray-900">{tax.name}</span>
                      <span className="text-sm text-gray-500 ml-2">{tax.rate}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={tax.isActive}
                        onChange={() => toggleTax(tax.id)}
                      />
                      <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                    <button onClick={() => removeTax(tax.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Tax name (e.g. SST)"
                value={newTaxName}
                onChange={(e) => setNewTaxName(e.target.value)}
                className="flex-1 max-w-xs px-4 py-2 border rounded-lg text-sm"
              />
              <input
                type="number"
                placeholder="Rate %"
                value={newTaxRate}
                onChange={(e) => setNewTaxRate(e.target.value)}
                className="w-24 px-4 py-2 border rounded-lg text-sm"
              />
              <button onClick={addTaxRate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mt-4">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">E-Invoice</span>
              </div>
              <p className="text-xs text-yellow-600 mt-1">E-Invoice integration coming soon. Will link with LHDN/outsourced provider.</p>
            </div>
          </div>
        );

      case 'receipt':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Header Text</label>
              <input
                value={receiptHeader}
                onChange={(e) => setReceiptHeader(e.target.value)}
                className="w-full max-w-md px-4 py-2 border rounded-lg text-sm"
                placeholder="Restaurant name on receipt..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Footer Text</label>
              <textarea
                value={receiptFooter}
                onChange={(e) => setReceiptFooter(e.target.value)}
                className="w-full max-w-md px-4 py-2 border rounded-lg text-sm"
                rows={2}
                placeholder="Thank you message..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Receipt Logo</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
                  {receiptLogo ? (
                    <img src={receiptLogo} alt="Receipt Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Receipt className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <button className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                  <Upload className="w-4 h-4" />
                  Upload Logo
                </button>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <span className="text-sm text-gray-700">Show Customer Info</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={showCustomerInfo}
                    onChange={(e) => setShowCustomerInfo(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <span className="text-sm text-gray-700">Show QR Code (for e-invoice/loyalty)</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={showQrCode}
                    onChange={(e) => setShowQrCode(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <span className="text-sm text-gray-700">Enable E-Invoice</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={enableEinvoice}
                    onChange={(e) => setEnableEinvoice(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        );

      case 'loyalty':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Gift className="w-5 h-5 text-purple-500" />
                <span className="text-sm font-medium text-gray-900">Enable Loyalty Program</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={loyaltyEnabled}
                  onChange={(e) => setLoyaltyEnabled(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            {loyaltyEnabled && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Points per RM spent</label>
                  <input
                    type="number"
                    value={pointsPerRm}
                    onChange={(e) => setPointsPerRm(e.target.value)}
                    className="w-32 px-4 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Points needed for RM1 redemption</label>
                  <input
                    type="number"
                    value={redemptionRate}
                    onChange={(e) => setRedemptionRate(e.target.value)}
                    className="w-32 px-4 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-sm text-purple-800">Example: Customer spends RM100 → earns {parseInt(pointsPerRm) * 100} points → can redeem RM{(parseInt(pointsPerRm) * 100 / parseInt(redemptionRate || '1')).toFixed(0)}</p>
                </div>
              </div>
            )}
          </div>
        );

      case 'device':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Connected Devices</h4>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Device Name</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Outlet</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Type</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Last Seen</th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {devices.map((device) => (
                    <tr key={device.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{device.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{device.outlet}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 uppercase">{device.deviceType || 'pos'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium ${device.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {device.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{device.lastSeen || '-'}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => toggleDeviceStatus(device.id)}
                            className="px-3 py-1.5 text-xs font-medium border rounded-lg hover:bg-gray-50"
                          >
                            {device.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                          <button 
                            onClick={() => removeDevice(device.id)}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Device name..."
                value={newDeviceName}
                onChange={(e) => setNewDeviceName(e.target.value)}
                className="flex-1 max-w-xs px-4 py-2 border rounded-lg text-sm"
              />
              <input
                type="text"
                placeholder="Outlet..."
                value={newDeviceOutlet}
                onChange={(e) => setNewDeviceOutlet(e.target.value)}
                className="flex-1 max-w-xs px-4 py-2 border rounded-lg text-sm"
              />
              <select
                value={newDeviceType}
                onChange={(e) => setNewDeviceType(e.target.value as any)}
                className="px-3 py-2 border rounded-lg text-sm"
              >
                <option value="pos">POS</option>
                <option value="kds">KDS</option>
                <option value="printer">Printer</option>
                <option value="tablet">Tablet</option>
              </select>
              <button onClick={addDevice} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                <Plus className="w-4 h-4" />
                Add Device
              </button>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium text-gray-900">Change Password</h4>
              <div className="mt-4 space-y-3 max-w-md">
                <input 
                  type="password" 
                  placeholder="Current password" 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg text-sm" 
                />
                <input 
                  type="password" 
                  placeholder="New password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg text-sm" 
                />
                <input 
                  type="password" 
                  placeholder="Confirm new password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg text-sm" 
                />
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Update Password</button>
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
              <p className="text-sm text-gray-500 mt-1">Add an extra layer of security</p>
              <button className="mt-3 px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">Enable 2FA</button>
            </div>
          </div>
        );

      case 'billing':
        return (
          <div className="space-y-6">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-800">Current Plan: Free Trial</p>
              <p className="text-xs text-blue-600 mt-1">Upgrade to unlock all features</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['Basic', 'Pro', 'Enterprise'].map((plan) => (
                <div key={plan} className="p-4 border rounded-lg">
                  <h4 className="font-semibold text-gray-900">{plan}</h4>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {plan === 'Basic' ? 'RM99' : plan === 'Pro' ? 'RM299' : 'Custom'}
                    <span className="text-sm font-normal text-gray-500">/mo</span>
                  </p>
                  <button className="mt-4 w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                    {plan === 'Basic' ? 'Current' : 'Upgrade'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your restaurant and account settings</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0 space-y-1">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeSection === section.id
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <section.icon className="w-5 h-5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{section.label}</p>
              </div>
              <ChevronRight className="w-4 h-4 flex-shrink-0" />
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {sections.find(s => s.id === activeSection)?.label}
            </h3>
            <button 
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
          {renderSection()}
        </div>
      </div>
    </div>
  );
};

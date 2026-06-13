// src/pages/SettingsPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Store,
  DollarSign,
  Monitor,
  Cloud,
  RefreshCw,
  Check,
  Plus,
  Trash2,
  Edit3,
  X,
  Wifi,
  WifiOff,
  Settings2,
  LayoutGrid,
} from 'lucide-react';
import type { DiningTable, Station } from '@mat-ai/types';
import {
  Input,
  Switch,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@mat-ai/ui';

// ============================================
// TYPES (UI-only, not in @mat-ai/types)
// ============================================
interface SettingsState {
  posName: string;
  receiptHeader: string;
  receiptFooter: string;
  taxEnabled: boolean;
  taxRate: number;
  serviceChargeEnabled: boolean;
  serviceChargeRate: number;
  currency: string;
  language: string;
  autoSync: boolean;
  syncInterval: number;
}

// ============================================
// DEFAULT DATA
// ============================================
const defaultSettings: SettingsState = {
  posName: 'MAT.ai POS',
  receiptHeader: 'Thank you for dining with us!',
  receiptFooter: 'Please come again!Follow us @mataipos',
  taxEnabled: true,
  taxRate: 8,
  serviceChargeEnabled: false,
  serviceChargeRate: 10,
  currency: 'MYR',
  language: 'ms',
  autoSync: false,
  syncInterval: 30,
};

const defaultStations: Station[] = [
  {
    id: '1',
    name: 'Main Kitchen',
    ipAddress: '192.168.1.100',
    categoryIds: ['Pizza', 'Pasta', 'Nasi', 'Side Order', 'Beverages', 'Extras'],
    isActive: true,
    deviceType: 'tablet',
    soundEnabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Cashier Receipt',
    ipAddress: '192.168.1.200',
    categoryIds: ['Pizza', 'Pasta', 'Nasi', 'Side Order', 'Beverages', 'Extras'],
    isActive: true,
    deviceType: 'tablet',
    soundEnabled: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const availableCategories = [
  'Pizza',
  'Pasta',
  'Nasi',
  'Side Order',
  'Beverages',
  'Extras',
];

const getDeviceTypeLabel = (type: Station['deviceType']): string => {
  switch (type) {
    case 'tablet':
      return 'Tablet';
    case 'ipad':
      return 'iPad';
    case 'android':
      return 'Android';
  }
};

const getDeviceTypeIcon = (type: Station['deviceType']) => {
  switch (type) {
    case 'tablet':
    case 'ipad':
    case 'android':
      return <Monitor className="w-4 h-4" />;
  }
};

// ============================================
// COMPONENT
// ============================================
export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();

  // Settings state
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [saved, setSaved] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Station states
  const [stations, setStations] = useState<Station[]>(defaultStations);
  const [showStationModal, setShowStationModal] = useState(false);
  const [editingStation, setEditingStation] = useState<Station | null>(null);
  const [formName, setFormName] = useState('');
  const [formIpAddress, setFormIpAddress] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formCategoryIds, setFormCategoryIds] = useState<string[]>([]);
  const [formDeviceType, setFormDeviceType] = useState<Station['deviceType']>('tablet');
  const [formSoundEnabled, setFormSoundEnabled] = useState(true);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; msg: string } | null>(null);

  // Table states
  const [tables, setTables] = useState<DiningTable[]>(() => {
    const saved = localStorage.getItem('mat-pos-tables');
    return saved
      ? JSON.parse(saved)
      : Array.from({ length: 20 }, (_, i) => ({
          id: (i + 1).toString(),
          number: `T${String(i + 1).padStart(2, '0')}`,
          capacity: 4,
          status: 'AVAILABLE' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
  });
  const [showTableModal, setShowTableModal] = useState(false);
  const [editingTable, setEditingTable] = useState<DiningTable | null>(null);
  const [formTableNumber, setFormTableNumber] = useState('');
  const [formTableCapacity, setFormTableCapacity] = useState('4');

  // Save tables to localStorage
  useEffect(() => {
    localStorage.setItem('mat-pos-tables', JSON.stringify(tables));
  }, [tables]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleChange = (
    field: keyof SettingsState,
    value: string | boolean | number
  ) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      alert('Sync completed!');
    }, 2000);
  };

  // Station handlers
  const openAddModal = () => {
    setEditingStation(null);
    setFormName('');
    setFormIpAddress('');
    setFormIsActive(true);
    setFormCategoryIds([]);
    setFormDeviceType('tablet');
    setFormSoundEnabled(true);
    setShowStationModal(true);
  };

  const openEditModal = (station: Station) => {
    setEditingStation(station);
    setFormName(station.name);
    setFormIpAddress(station.ipAddress);
    setFormIsActive(station.isActive);
    setFormCategoryIds([...station.categoryIds]);
    setFormDeviceType(station.deviceType);
    setFormSoundEnabled(station.soundEnabled);
    setShowStationModal(true);
  };

  const handleSaveStation = () => {
    if (!formName.trim()) {
      alert('Sila masukkan nama station');
      return;
    }
    if (!formIpAddress.trim()) {
      alert('Sila masukkan IP address');
      return;
    }

    const now = new Date().toISOString();
    let updatedStations = [...stations];

    if (editingStation) {
      updatedStations = updatedStations.map((s) =>
        s.id === editingStation.id
          ? {
              ...s,
              name: formName,
              ipAddress: formIpAddress,
              isActive: formIsActive,
              categoryIds: formCategoryIds,
              deviceType: formDeviceType,
              soundEnabled: formSoundEnabled,
              updatedAt: now,
            }
          : s
      );
    } else {
      const newId =
        Math.max(...updatedStations.map((s) => parseInt(s.id)), 0) + 1;
      updatedStations.push({
        id: newId.toString(),
        name: formName,
        ipAddress: formIpAddress,
        categoryIds: formCategoryIds,
        isActive: formIsActive,
        deviceType: formDeviceType,
        soundEnabled: formSoundEnabled,
        createdAt: now,
        updatedAt: now,
      });
    }
    setStations(updatedStations);
    localStorage.setItem('mat-pos-stations', JSON.stringify(updatedStations));
    setShowStationModal(false);
    setSaved(false);
  };

  const handleDeleteStation = (id: string) => {
    if (confirm('Adakah anda pasti mahu hapus station ini?')) {
      const updated = stations.filter((s) => s.id !== id);
      setStations(updated);
      localStorage.setItem('mat-pos-stations', JSON.stringify(updated));
      setSaved(false);
    }
  };

  const handleTestConnection = async (station: Station) => {
    setTestingId(station.id);
    setTestResult(null);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const success = Math.random() > 0.3;
    setTestResult({
      id: station.id,
      success,
      msg: success ? 'Connected' : 'Failed',
    });
    setTestingId(null);
    setTimeout(() => setTestResult(null), 3000);
  };

  const toggleCategory = (cat: string) => {
    setFormCategoryIds((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  // Table handlers
  const openAddTable = () => {
    setEditingTable(null);
    setFormTableNumber('');
    setFormTableCapacity('4');
    setShowTableModal(true);
  };

  const openEditTable = (table: DiningTable) => {
    setEditingTable(table);
    setFormTableNumber(table.number);
    setFormTableCapacity(table.capacity.toString());
    setShowTableModal(true);
  };

  const handleSaveTable = () => {
    if (!formTableNumber.trim()) {
      alert('Please enter table number');
      return;
    }
    const exists = tables.find(
      (t) =>
        t.number.toLowerCase() === formTableNumber.toLowerCase() &&
        t.id !== editingTable?.id
    );
    if (exists) {
      alert('Table number already exists');
      return;
    }

    const now = new Date().toISOString();
    if (editingTable) {
      setTables((prev) =>
        prev.map((t) =>
          t.id === editingTable.id
            ? { ...t, number: formTableNumber, capacity: parseInt(formTableCapacity) || 4, updatedAt: now }
            : t
        )
      );
    } else {
      const newId = Math.max(...tables.map((t) => parseInt(t.id)), 0) + 1;
      setTables((prev) => [
        ...prev,
        {
          id: newId.toString(),
          number: formTableNumber,
          capacity: parseInt(formTableCapacity) || 4,
          status: 'AVAILABLE',
          createdAt: now,
          updatedAt: now,
        },
      ]);
    }
    setShowTableModal(false);
    setSaved(false);
  };

  const handleDeleteTable = (id: string) => {
    if (confirm('Delete this table?')) {
      setTables((prev) => prev.filter((t) => t.id !== id));
      setSaved(false);
    }
  };

  const resetTables = () => {
    if (confirm('Reset all tables to available?')) {
      const now = new Date().toISOString();
      setTables((prev) =>
        prev.map((t) => ({ ...t, status: 'AVAILABLE' as const, updatedAt: now }))
      );
      setSaved(false);
    }
  };

  // ============================================
  // RENDER HELPERS
  // ============================================
  const Section: React.FC<{
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
  }> = ({ title, icon, children }) => (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
            {icon}
          </div>
          <CardTitle>{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );

  const FormInput: React.FC<{
    label: string;
    value: string | number;
    onChange: (value: string) => void;
    type?: string;
    placeholder?: string;
  }> = ({ label, value, onChange, type = 'text', placeholder }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <Input  // ← Now this is @mat-ai/ui Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        fullWidth
      />
    </div>
  );

  const FormToggle: React.FC<{
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
  }> = ({ label, checked, onChange }) => (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <Switch
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </div>
  );

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="h-full flex flex-col bg-gray-50">
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="font-bold text-gray-900">Settings</h1>
        </div>
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            saved
              ? 'bg-green-100 text-green-700'
              : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
        >
          {saved ? (
            <>
              <Check className="w-4 h-4" /> Saved
            </>
          ) : (
            <>
              <Save className="w-4 h-4" /> Save
            </>
          )}
        </button>
      </header>

      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-3xl mx-auto">
          {/* POS Settings */}
          <Section title="POS Settings" icon={<Store className="w-5 h-5 text-primary-600" />}>
            <FormInput
              label="POS Name"
              value={settings.posName}
              onChange={(v) => handleChange('posName', v)}
            />
            <FormInput
              label="Receipt Header"
              value={settings.receiptHeader}
              onChange={(v) => handleChange('receiptHeader', v)}
            />
            <FormInput
              label="Receipt Footer"
              value={settings.receiptFooter}
              onChange={(v) => handleChange('receiptFooter', v)}
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency
                </label>
                <select
                  value={settings.currency}
                  onChange={(e) => handleChange('currency', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                >
                  <option value="MYR">MYR</option>
                  <option value="USD">USD</option>
                  <option value="SGD">SGD</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Language
                </label>
                <select
                  value={settings.language}
                  onChange={(e) => handleChange('language', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                >
                  <option value="ms">Bahasa Melayu</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
          </Section>

          {/* Table Management */}
          <Section
            title="Table Management"
            icon={<LayoutGrid className="w-5 h-5 text-primary-600" />}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                {tables.length} tables configured
              </p>
              <div className="flex gap-2">
                <button
                  onClick={resetTables}
                  className="px-3 py-2 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-200 transition-colors"
                >
                  Reset All
                </button>
                <button
                  onClick={openAddTable}
                  className="flex items-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Table
                </button>
              </div>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {tables.map((table) => (
                <div
                  key={table.id}
                  className={`relative aspect-square rounded-xl border-2 flex flex-col items-center justify-center ${
                    table.status === 'AVAILABLE'
                      ? 'border-emerald-200 bg-emerald-50'
                      : table.status === 'OCCUPIED'
                      ? 'border-red-200 bg-red-50'
                      : 'border-amber-200 bg-amber-50'
                  }`}
                >
                  <span className="text-sm font-bold text-gray-900">
                    {table.number}
                  </span>
                  <span
                    className={`text-xs ${
                      table.status === 'AVAILABLE'
                        ? 'text-emerald-600'
                        : table.status === 'OCCUPIED'
                        ? 'text-red-600'
                        : 'text-amber-600'
                    }`}
                  >
                    {table.status.toLowerCase()}
                  </span>
                  <div className="absolute top-1 right-1 flex gap-0.5">
                    <button
                      onClick={() => openEditTable(table)}
                      className="p-1 hover:bg-white rounded-md transition-colors"
                    >
                      <Edit3 className="w-3 h-3 text-gray-500" />
                    </button>
                    <button
                      onClick={() => handleDeleteTable(table.id)}
                      className="p-1 hover:bg-white rounded-md transition-colors"
                    >
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Tax */}
          <Section
            title="Tax & Service Charge"
            icon={<DollarSign className="w-5 h-5 text-primary-600" />}
          >
            <FormToggle
              label={`Enable SST (${settings.taxRate}%)`}
              checked={settings.taxEnabled}
              onChange={(v) => handleChange('taxEnabled', v)}
            />
            {settings.taxEnabled && (
              <FormInput
                label="Tax Rate (%)"
                value={settings.taxRate}
                onChange={(v) => handleChange('taxRate', parseFloat(v) || 0)}
                type="number"
              />
            )}
            <FormToggle
              label={`Enable Service Charge (${settings.serviceChargeRate}%)`}
              checked={settings.serviceChargeEnabled}
              onChange={(v) => handleChange('serviceChargeEnabled', v)}
            />
            {settings.serviceChargeEnabled && (
              <FormInput
                label="Service Charge Rate (%)"
                value={settings.serviceChargeRate}
                onChange={(v) =>
                  handleChange('serviceChargeRate', parseFloat(v) || 0)
                }
                type="number"
              />
            )}
          </Section>

          {/* Stations */}
          <Section
            title="Stations (KDS & Printers)"
            icon={<Settings2 className="w-5 h-5 text-primary-600" />}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                Manage kitchen displays and printers
              </p>
              <button
                onClick={openAddModal}
                className="flex items-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Station
              </button>
            </div>
            <div className="space-y-3">
              {stations.map((station) => (
                <div
                  key={station.id}
                  className={`border rounded-xl p-4 ${
                    station.isActive ? 'bg-white' : 'bg-gray-50 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          station.deviceType === 'tablet'
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-orange-100 text-orange-600'
                        }`}
                      >
                        {getDeviceTypeIcon(station.deviceType)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">
                            {station.name}
                          </h3>
                          {!station.isActive && (
                            <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs font-medium rounded-full">
                              Offline
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {station.ipAddress} • {getDeviceTypeLabel(station.deviceType)}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Categories: {station.categoryIds.join(', ') || 'None'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleTestConnection(station)}
                        disabled={testingId === station.id}
                        className={`p-2 rounded-lg transition-colors ${
                          testResult?.id === station.id
                            ? testResult.success
                              ? 'bg-green-100 text-green-600'
                              : 'bg-red-100 text-red-600'
                            : 'hover:bg-gray-100 text-gray-500'
                        }`}
                      >
                        {testingId === station.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : testResult?.id === station.id ? (
                          testResult.success ? (
                            <Wifi className="w-4 h-4" />
                          ) : (
                            <WifiOff className="w-4 h-4" />
                          )
                        ) : (
                          <Wifi className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => openEditModal(station)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteStation(station.id)}
                        className="p-2 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {stations.length === 0 && (
              <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-xl">
                <Monitor className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No stations configured</p>
              </div>
            )}
          </Section>

          {/* Cloud Sync */}
          <Section title="Cloud Sync" icon={<Cloud className="w-5 h-5 text-primary-600" />}>
            <FormToggle
              label="Auto Sync"
              checked={settings.autoSync}
              onChange={(v) => handleChange('autoSync', v)}
            />
            {settings.autoSync && (
              <FormInput
                label="Sync Interval (minutes)"
                value={settings.syncInterval}
                onChange={(v) => handleChange('syncInterval', parseInt(v) || 30)}
                type="number"
              />
            )}
            <button
              onClick={handleSync}
              disabled={syncing}
              className="w-full py-3 bg-primary-100 text-primary-700 rounded-xl font-medium hover:bg-primary-200 transition-colors flex items-center justify-center gap-2"
            >
              {syncing ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" /> Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" /> Sync Now
                </>
              )}
            </button>
          </Section>

          {/* Save */}
          <div className="sticky bottom-4">
            <button
              onClick={handleSave}
              className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all ${
                saved
                  ? 'bg-green-500 text-white'
                  : 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800'
              }`}
            >
              {saved ? (
                <span className="flex items-center justify-center gap-2">
                  <Check className="w-6 h-6" /> Settings Saved!
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Save className="w-6 h-6" /> Save All Settings
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Station Modal */}
      {showStationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowStationModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingStation ? 'Edit Station' : 'Add Station'}
              </h3>
              <button
                onClick={() => setShowStationModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Station Name
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Pizza Station"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  IP Address
                </label>
                <input
                  type="text"
                  value={formIpAddress}
                  onChange={(e) => setFormIpAddress(e.target.value)}
                  placeholder="192.168.1.100"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Device Type
                </label>
                <select
                  value={formDeviceType}
                  onChange={(e) => setFormDeviceType(e.target.value as Station['deviceType'])}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                >
                  <option value="tablet">Tablet</option>
                  <option value="ipad">iPad</option>
                  <option value="android">Android</option>
                </select>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formSoundEnabled}
                    onChange={(e) => setFormSoundEnabled(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Sound Enabled</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categories
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {availableCategories.map((cat) => (
                    <label
                      key={cat}
                      className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={formCategoryIds.includes(cat)}
                        onChange={() => toggleCategory(cat)}
                        className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
              <button
                onClick={() => setShowStationModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStation}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <Check className="w-4 h-4" />{' '}
                {editingStation ? 'Update' : 'Add'} Station
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Modal */}
      {showTableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowTableModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingTable ? 'Edit Table' : 'Add Table'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Table Number
                </label>
                <input
                  type="text"
                  value={formTableNumber}
                  onChange={(e) => setFormTableNumber(e.target.value)}
                  placeholder="e.g. T21 or VIP01"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacity
                </label>
                <input
                  type="number"
                  value={formTableCapacity}
                  onChange={(e) => setFormTableCapacity(e.target.value)}
                  placeholder="4"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowTableModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTable}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
              >
                {editingTable ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
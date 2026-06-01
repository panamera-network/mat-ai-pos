// src/pages/SettingsPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Store,
  DollarSign,
  Printer,
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

// ============================================
// TYPES
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

interface Station {
  id: string;
  name: string;
  type: 'kds' | 'receipt' | 'backup-printer';
  ip: string;
  port: number;
  enabled: boolean;
  categories: string[];
  isDefault: boolean;
}

interface TableData {
  id: string;
  number: string;
  status: 'available' | 'occupied' | 'reserved';
}

// ============================================
// DEFAULT DATA
// ============================================
const defaultSettings: SettingsState = {
  posName: 'MAT.ai POS',
  receiptHeader: 'Thank you for dining with us!',
  receiptFooter: 'Please come again!\nFollow us @mataipos',
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
  { id: '1', name: 'Main Kitchen', type: 'kds', ip: '192.168.1.100', port: 8080, enabled: true, categories: ['Pizza', 'Pasta', 'Nasi', 'Side Order', 'Beverages', 'Extras'], isDefault: true },
  { id: '2', name: 'Cashier Receipt', type: 'receipt', ip: '192.168.1.200', port: 9100, enabled: true, categories: ['Pizza', 'Pasta', 'Nasi', 'Side Order', 'Beverages', 'Extras'], isDefault: false },
];

const availableCategories = ['Pizza', 'Pasta', 'Nasi', 'Side Order', 'Beverages', 'Extras'];

const getDefaultPort = (type: Station['type']): number => {
  switch (type) {
    case 'kds': return 8080;
    case 'receipt': return 9100;
    case 'backup-printer': return 9100;
    default: return 8080;
  }
};

const getTypeLabel = (type: Station['type']): string => {
  switch (type) {
    case 'kds': return 'KDS';
    case 'receipt': return 'Receipt';
    case 'backup-printer': return 'Backup Printer';
  }
};

const getTypeIcon = (type: Station['type']) => {
  switch (type) {
    case 'kds': return <Monitor className="w-4 h-4" />;
    case 'receipt': return <Printer className="w-4 h-4" />;
    case 'backup-printer': return <Printer className="w-4 h-4" />;
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
  const [formType, setFormType] = useState<Station['type']>('kds');
  const [formIp, setFormIp] = useState('');
  const [formPort, setFormPort] = useState('');
  const [formEnabled, setFormEnabled] = useState(true);
  const [formCategories, setFormCategories] = useState<string[]>([]);
  const [formIsDefault, setFormIsDefault] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; msg: string } | null>(null);

  // Table states — DALAM COMPONENT
  const [tables, setTables] = useState<TableData[]>(() => {
    const saved = localStorage.getItem('mat-pos-tables');
    return saved ? JSON.parse(saved) : Array.from({ length: 20 }, (_, i) => ({
      id: (i + 1).toString(),
      number: `T${String(i + 1).padStart(2, '0')}`,
      status: 'available' as const,
    }));
  });
  const [showTableModal, setShowTableModal] = useState(false);
  const [editingTable, setEditingTable] = useState<TableData | null>(null);
  const [formTableNumber, setFormTableNumber] = useState('');

  // Save tables to localStorage
  useEffect(() => {
    localStorage.setItem('mat-pos-tables', JSON.stringify(tables));
  }, [tables]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleChange = (field: keyof SettingsState, value: string | boolean | number) => {
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
    setFormType('kds');
    setFormIp('');
    setFormPort(getDefaultPort('kds').toString());
    setFormEnabled(true);
    setFormCategories([]);
    setFormIsDefault(false);
    setShowStationModal(true);
  };

  const openEditModal = (station: Station) => {
    setEditingStation(station);
    setFormName(station.name);
    setFormType(station.type);
    setFormIp(station.ip);
    setFormPort(station.port.toString());
    setFormEnabled(station.enabled);
    setFormCategories([...station.categories]);
    setFormIsDefault(station.isDefault);
    setShowStationModal(true);
  };

  const handleSaveStation = () => {
    if (!formName.trim()) { alert('Sila masukkan nama station'); return; }
    if (!formIp.trim()) { alert('Sila masukkan IP address'); return; }

    const port = parseInt(formPort) || getDefaultPort(formType);
    let updatedStations = [...stations];
    if (formIsDefault) updatedStations = updatedStations.map((s) => ({ ...s, isDefault: false }));

    if (editingStation) {
      updatedStations = updatedStations.map((s) =>
        s.id === editingStation.id
          ? { ...s, name: formName, type: formType, ip: formIp, port, enabled: formEnabled, categories: formCategories, isDefault: formIsDefault }
          : s
      );
    } else {
      const newId = Math.max(...updatedStations.map((s) => parseInt(s.id)), 0) + 1;
      updatedStations.push({
        id: newId.toString(), name: formName, type: formType, ip: formIp, port,
        enabled: formEnabled, categories: formCategories, isDefault: formIsDefault,
      });
    }
    setStations(updatedStations);
    setShowStationModal(false);
    setSaved(false);
  };

  const handleDeleteStation = (id: string) => {
    if (confirm('Adakah anda pasti mahu hapus station ini?')) {
      setStations((prev) => prev.filter((s) => s.id !== id));
      setSaved(false);
    }
  };

  const handleTestConnection = async (station: Station) => {
    setTestingId(station.id);
    setTestResult(null);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const success = Math.random() > 0.3;
    setTestResult({ id: station.id, success, msg: success ? 'Connected' : 'Failed' });
    setTestingId(null);
    setTimeout(() => setTestResult(null), 3000);
  };

  const toggleCategory = (cat: string) => {
    setFormCategories((prev) => prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]);
  };

  // Table handlers
  const openAddTable = () => {
    setEditingTable(null);
    setFormTableNumber('');
    setShowTableModal(true);
  };

  const openEditTable = (table: TableData) => {
    setEditingTable(table);
    setFormTableNumber(table.number);
    setShowTableModal(true);
  };

  const handleSaveTable = () => {
    if (!formTableNumber.trim()) { alert('Please enter table number'); return; }
    const exists = tables.find((t) => t.number.toLowerCase() === formTableNumber.toLowerCase() && t.id !== editingTable?.id);
    if (exists) { alert('Table number already exists'); return; }

    if (editingTable) {
      setTables((prev) => prev.map((t) => (t.id === editingTable.id ? { ...t, number: formTableNumber } : t)));
    } else {
      const newId = Math.max(...tables.map((t) => parseInt(t.id)), 0) + 1;
      setTables((prev) => [...prev, { id: newId.toString(), number: formTableNumber, status: 'available' }]);
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
      setTables((prev) => prev.map((t) => ({ ...t, status: 'available' })));
      setSaved(false);
    }
  };

  // ============================================
  // RENDER HELPERS
  // ============================================
  const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="bg-white rounded-2xl shadow-sm border p-6 mb-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">{icon}</div>
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      </div>
      {children}
    </div>
  );

  const Input: React.FC<{ label: string; value: string | number; onChange: (value: string) => void; type?: string; placeholder?: string }> = ({ label, value, onChange, type = 'text', placeholder }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
    </div>
  );

  const Toggle: React.FC<{ label: string; checked: boolean; onChange: (checked: boolean) => void }> = ({ label, checked, onChange }) => (
    <label className="flex items-center justify-between py-2 cursor-pointer">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div onClick={() => onChange(!checked)} className={`relative w-12 h-6 rounded-full transition-colors ${checked ? 'bg-primary-600' : 'bg-gray-300'}`}>
        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-0.5'}`} />
      </div>
    </label>
  );

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="h-full flex flex-col bg-gray-50">
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="font-bold text-gray-900">Settings</h1>
        </div>
        <button onClick={handleSave} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${saved ? 'bg-green-100 text-green-700' : 'bg-primary-600 text-white hover:bg-primary-700'}`}>
          {saved ? <><Check className="w-4 h-4" /> Saved</> : <><Save className="w-4 h-4" /> Save</>}
        </button>
      </header>

      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-3xl mx-auto">
          {/* POS Settings */}
          <Section title="POS Settings" icon={<Store className="w-5 h-5 text-primary-600" />}>
            <Input label="POS Name" value={settings.posName} onChange={(v) => handleChange('posName', v)} />
            <Input label="Receipt Header" value={settings.receiptHeader} onChange={(v) => handleChange('receiptHeader', v)} />
            <Input label="Receipt Footer" value={settings.receiptFooter} onChange={(v) => handleChange('receiptFooter', v)} />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <select value={settings.currency} onChange={(e) => handleChange('currency', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20">
                  <option value="MYR">MYR</option><option value="USD">USD</option><option value="SGD">SGD</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                <select value={settings.language} onChange={(e) => handleChange('language', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20">
                  <option value="ms">Bahasa Melayu</option><option value="en">English</option>
                </select>
              </div>
            </div>
          </Section>

          {/* Table Management */}
          <Section title="Table Management" icon={<LayoutGrid className="w-5 h-5 text-primary-600" />}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">{tables.length} tables configured</p>
              <div className="flex gap-2">
                <button onClick={resetTables} className="px-3 py-2 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-200 transition-colors">Reset All</button>
                <button onClick={openAddTable} className="flex items-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"><Plus className="w-4 h-4" /> Add Table</button>
              </div>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {tables.map((table) => (
                <div key={table.id} className={`relative aspect-square rounded-xl border-2 flex flex-col items-center justify-center ${table.status === 'available' ? 'border-emerald-200 bg-emerald-50' : table.status === 'occupied' ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
                  <span className="text-sm font-bold text-gray-900">{table.number}</span>
                  <span className={`text-xs ${table.status === 'available' ? 'text-emerald-600' : table.status === 'occupied' ? 'text-red-600' : 'text-amber-600'}`}>{table.status}</span>
                  <div className="absolute top-1 right-1 flex gap-0.5">
                    <button onClick={() => openEditTable(table)} className="p-1 hover:bg-white rounded-md transition-colors"><Edit3 className="w-3 h-3 text-gray-500" /></button>
                    <button onClick={() => handleDeleteTable(table.id)} className="p-1 hover:bg-white rounded-md transition-colors"><Trash2 className="w-3 h-3 text-red-500" /></button>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Tax */}
          <Section title="Tax & Service Charge" icon={<DollarSign className="w-5 h-5 text-primary-600" />}>
            <Toggle label={`Enable SST (${settings.taxRate}%)`} checked={settings.taxEnabled} onChange={(v) => handleChange('taxEnabled', v)} />
            {settings.taxEnabled && <Input label="Tax Rate (%)" value={settings.taxRate} onChange={(v) => handleChange('taxRate', parseFloat(v) || 0)} type="number" />}
            <Toggle label={`Enable Service Charge (${settings.serviceChargeRate}%)`} checked={settings.serviceChargeEnabled} onChange={(v) => handleChange('serviceChargeEnabled', v)} />
            {settings.serviceChargeEnabled && <Input label="Service Charge Rate (%)" value={settings.serviceChargeRate} onChange={(v) => handleChange('serviceChargeRate', parseFloat(v) || 0)} type="number" />}
          </Section>

          {/* Stations */}
          <Section title="Stations (KDS & Printers)" icon={<Settings2 className="w-5 h-5 text-primary-600" />}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">Manage kitchen displays and printers</p>
              <button onClick={openAddModal} className="flex items-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"><Plus className="w-4 h-4" /> Add Station</button>
            </div>
            <div className="space-y-3">
              {stations.map((station) => (
                <div key={station.id} className={`border rounded-xl p-4 ${station.enabled ? 'bg-white' : 'bg-gray-50 opacity-60'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${station.type === 'kds' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>{getTypeIcon(station.type)}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{station.name}</h3>
                          {station.isDefault && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">Default</span>}
                          {!station.enabled && <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs font-medium rounded-full">Offline</span>}
                        </div>
                        <p className="text-sm text-gray-500">{station.ip}:{station.port} • {getTypeLabel(station.type)}</p>
                        <p className="text-xs text-gray-400 mt-1">Categories: {station.categories.join(', ') || 'None'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleTestConnection(station)} disabled={testingId === station.id} className={`p-2 rounded-lg transition-colors ${testResult?.id === station.id ? (testResult.success ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600') : 'hover:bg-gray-100 text-gray-500'}`}>
                        {testingId === station.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : testResult?.id === station.id ? (testResult.success ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />) : <Wifi className="w-4 h-4" />}
                      </button>
                      <button onClick={() => openEditModal(station)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"><Edit3 className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteStation(station.id)} className="p-2 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {stations.length === 0 && <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-xl"><Monitor className="w-10 h-10 mx-auto mb-2 text-gray-300" /><p className="text-sm">No stations configured</p></div>}
          </Section>

          {/* Cloud Sync */}
          <Section title="Cloud Sync" icon={<Cloud className="w-5 h-5 text-primary-600" />}>
            <Toggle label="Auto Sync" checked={settings.autoSync} onChange={(v) => handleChange('autoSync', v)} />
            {settings.autoSync && <Input label="Sync Interval (minutes)" value={settings.syncInterval} onChange={(v) => handleChange('syncInterval', parseInt(v) || 30)} type="number" />}
            <button onClick={handleSync} disabled={syncing} className="w-full py-3 bg-primary-100 text-primary-700 rounded-xl font-medium hover:bg-primary-200 transition-colors flex items-center justify-center gap-2">
              {syncing ? <><RefreshCw className="w-5 h-5 animate-spin" /> Syncing...</> : <><RefreshCw className="w-5 h-5" /> Sync Now</>}
            </button>
          </Section>

          {/* Save */}
          <div className="sticky bottom-4">
            <button onClick={handleSave} className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all ${saved ? 'bg-green-500 text-white' : 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800'}`}>
              {saved ? <span className="flex items-center justify-center gap-2"><Check className="w-6 h-6" /> Settings Saved!</span> : <span className="flex items-center justify-center gap-2"><Save className="w-6 h-6" /> Save All Settings</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Station Modal */}
      {showStationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowStationModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">{editingStation ? 'Edit Station' : 'Add Station'}</h3>
              <button onClick={() => setShowStationModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Station Name</label>
                <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Pizza Station" className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select value={formType} onChange={(e) => { const type = e.target.value as Station['type']; setFormType(type); setFormPort(getDefaultPort(type).toString()); }} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20">
                  <option value="kds">KDS (Kitchen Display)</option>
                  <option value="receipt">Receipt Printer</option>
                  <option value="backup-printer">Backup Printer</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">IP Address</label>
                  <input type="text" value={formIp} onChange={(e) => setFormIp(e.target.value)} placeholder="192.168.1.100" className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Port (Auto)</label>
                  <input type="number" value={formPort} onChange={(e) => setFormPort(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 bg-gray-50" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formEnabled} onChange={(e) => setFormEnabled(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                  <span className="text-sm font-medium text-gray-700">Enabled</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formIsDefault} onChange={(e) => setFormIsDefault(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                  <span className="text-sm font-medium text-gray-700">Default Fallback</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categories</label>
                <div className="grid grid-cols-2 gap-2">
                  {availableCategories.map((cat) => (
                    <label key={cat} className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <input type="checkbox" checked={formCategories.includes(cat)} onChange={() => toggleCategory(cat)} className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                      <span className="text-sm text-gray-700">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
              <button onClick={() => setShowStationModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
              <button onClick={handleSaveStation} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors flex items-center gap-2"><Check className="w-4 h-4" /> {editingStation ? 'Update' : 'Add'} Station</button>
            </div>
          </div>
        </div>
      )}

      {/* Table Modal */}
      {showTableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowTableModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{editingTable ? 'Edit Table' : 'Add Table'}</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Table Number</label>
              <input type="text" value={formTableNumber} onChange={(e) => setFormTableNumber(e.target.value)} placeholder="e.g. T21 or VIP01" className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20" autoFocus />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowTableModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
              <button onClick={handleSaveTable} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors">{editingTable ? 'Update' : 'Add'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

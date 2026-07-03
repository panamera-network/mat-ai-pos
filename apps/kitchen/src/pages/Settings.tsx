// apps/kitchen/src/pages/Settings.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Volume2,
  VolumeX,
  Trash2,
  AlertTriangle,
  Wifi,
  Check,
} from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  Input,
  Switch,
  ConfirmDialog,
} from '@mat-ai/ui';
import { getSettings, saveSettings, resetMemory, resetAll } from '../utils/storage';
import type { KdsSettings } from '../types/kitchen';

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<KdsSettings>(getSettings);
  const [saved, setSaved] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleChange = (field: keyof KdsSettings, value: string | number | boolean) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleResetMemory = () => {
    if (confirm('Hapus semua history order? Ini tidak boleh diundur.')) {
      resetMemory();
      alert('Memory dikosongkan!');
    }
  };

  const handleResetAll = () => {
    resetAll();
    setSettings(getSettings());
    setShowResetConfirm(false);
    alert('Semua data direset!');
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-bold text-gray-900 dark:text-gray-100">KDS Settings</h1>
        </div>
        <Button
          variant={saved ? 'success' : 'primary'}
          size="sm"
          onClick={handleSave}
          leftIcon={saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        >
          {saved ? 'Saved' : 'Save'}
        </Button>
      </header>

      <main className="flex-1 overflow-auto p-4">
        <div className="max-w-lg mx-auto space-y-4">
          {/* Connection */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <Wifi className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle>POS Connection</CardTitle>
              </div>
            </CardHeader>

            <div className="space-y-4 px-6 pb-6">
              <Input
                label="POS IP Address"
                value={settings.posIp}
                onChange={(e) => handleChange('posIp', e.target.value)}
                placeholder="192.168.1.100"
                fullWidth
              />
              <Input
                label="POS Port"
                type="number"
                value={settings.posPort}
                onChange={(e) => handleChange('posPort', parseInt(e.target.value) || 8080)}
                fullWidth
              />
              <Input
                label="Station Name"
                value={settings.stationName}
                onChange={(e) => handleChange('stationName', e.target.value)}
                placeholder="Main Kitchen"
                fullWidth
              />
            </div>
          </Card>

          {/* Sound */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                  {settings.soundEnabled ? (
                    <Volume2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  ) : (
                    <VolumeX className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <CardTitle>Sound Alert</CardTitle>
              </div>
            </CardHeader>

            <div className="space-y-4 px-6 pb-6">
              <Switch
                label="Enable Sound"
                checked={settings.soundEnabled}
                onChange={(e) => handleChange('soundEnabled', e.target.checked)}
              />

              {settings.soundEnabled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Volume: {Math.round(settings.soundVolume * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={Math.round(settings.soundVolume * 100)}
                    onChange={(e) => handleChange('soundVolume', parseInt(e.target.value) / 100)}
                    className="w-full"
                  />
                </div>
              )}
            </div>
          </Card>

          {/* Reset Memory */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <CardTitle>Memory Management</CardTitle>
              </div>
            </CardHeader>

            <div className="space-y-3 px-6 pb-6">
              <Button
                variant="warning"
                fullWidth
                onClick={handleResetMemory}
                leftIcon={<Trash2 className="w-4 h-4" />}
              >
                Clear Order History
              </Button>

              <Button
                variant="danger"
                fullWidth
                onClick={() => setShowResetConfirm(true)}
                leftIcon={<AlertTriangle className="w-4 h-4" />}
              >
                Factory Reset (All Data)
              </Button>
            </div>
          </Card>
        </div>
      </main>

      {/* Reset All Confirm Dialog */}
      <ConfirmDialog
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        title="Factory Reset"
        description="Ini akan menghapus semua data termasuk settings, history. Anda perlu setup semula."
        onConfirm={handleResetAll}
        confirmText="Reset Everything"
        confirmVariant="danger"
        icon={<AlertTriangle className="w-6 h-6 text-red-600" />}
      />
    </div>
  );
};

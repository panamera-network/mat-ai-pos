// apps/kitchen/src/pages/Settings.tsx
import React, { useState, useEffect } from 'react';
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
import { getSettings, saveSettings, resetMemory, resetAll } from '../utils/storage';
import type { KdsSettings } from '../types/kitchen';

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<KdsSettings>(getSettings);
  const [saved, setSaved] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleChange = (field: keyof KdsSettings, value: string | number | boolean | string[]) => {
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
    if (confirm('Reset SEMUA termasuk settings? Ini akan mengembalikan ke default.')) {
      resetAll();
      setSettings(getSettings());
      alert('Semua data direset!');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="font-bold text-gray-900">KDS Settings</h1>
        </div>
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            saved ? 'bg-green-100 text-green-700' : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
        >
          {saved ? <><Check className="w-4 h-4" /> Saved</> : <><Save className="w-4 h-4" /> Save</>}
        </button>
      </header>

      <main className="flex-1 overflow-auto p-4">
        <div className="max-w-lg mx-auto space-y-4">
          {/* Connection */}
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Wifi className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">POS Connection</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">POS IP Address</label>
                <input
                  type="text"
                  value={settings.posIp}
                  onChange={(e) => handleChange('posIp', e.target.value)}
                  placeholder="192.168.1.100"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">POS Port</label>
                <input
                  type="number"
                  value={settings.posPort}
                  onChange={(e) => handleChange('posPort', parseInt(e.target.value) || 8080)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Sound */}
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                {settings.soundEnabled ? (
                  <Volume2 className="w-5 h-5 text-amber-600" />
                ) : (
                  <VolumeX className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <h2 className="text-lg font-bold text-gray-900">Sound Alert</h2>
            </div>

            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm font-medium text-gray-700">Enable Sound</span>
                <div
                  onClick={() => handleChange('soundEnabled', !settings.soundEnabled)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    settings.soundEnabled ? 'bg-primary-600' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      settings.soundEnabled ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </div>
              </label>

              {settings.soundEnabled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
          </div>

          {/* Reset Memory */}
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Memory Management</h2>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleResetMemory}
                className="w-full py-3 bg-amber-50 text-amber-700 rounded-xl font-medium hover:bg-amber-100 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clear Order History
              </button>

              <button
                onClick={() => setShowResetConfirm(true)}
                className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
              >
                <AlertTriangle className="w-4 h-4" />
                Factory Reset (All Data)
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Reset All Confirm Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowResetConfirm(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Factory Reset</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Ini akan menghapus semua data termasuk settings, history, dan progress. Anda perlu setup semula.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleResetAll();
                  setShowResetConfirm(false);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Reset Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

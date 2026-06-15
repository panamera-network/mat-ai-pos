import React, { useState, useCallback } from 'react';
import { Lock, Delete, X } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

interface PinPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
}

export function PinPrompt({ isOpen, onClose, onSuccess, title = 'Enter PIN to continue' }: PinPromptProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const login = useAuthStore((s) => s.login);

  const triggerShake = useCallback(() => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  }, []);

  const handlePinPress = useCallback((digit: string) => {
    if (pin.length >= 4) return;
    setPin((prev) => prev + digit);
    setError('');
  }, [pin.length]);

  const handleClear = useCallback(() => {
    setPin('');
    setError('');
  }, []);

  const handleBackspace = useCallback(() => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  }, []);

  const handleSubmit = useCallback(async () => {
    if (pin.length !== 4) {
      setError('Enter 4 digits');
      triggerShake();
      return;
    }

    const success = await login(pin);
    if (success) {
      setPin('');
      setError('');
      onSuccess();
    } else {
      setError('Invalid PIN');
      triggerShake();
      setPin('');
    }
  }, [pin, login, onSuccess, triggerShake]);

  React.useEffect(() => {
    if (pin.length === 4) {
      handleSubmit();
    }
  }, [pin, handleSubmit]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className={`bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm ${shake ? 'animate-shake' : ''}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Lock className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="font-semibold text-gray-900">{title}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex gap-3 justify-center mb-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all ${
                i < pin.length ? 'bg-blue-600 scale-110' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-center text-sm text-red-500 mb-4 animate-pulse">{error}</p>
        )}

        <div className="grid grid-cols-3 gap-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              onClick={() => handlePinPress(digit)}
              className="aspect-square rounded-xl text-xl font-semibold bg-gray-100 hover:bg-blue-50 hover:text-blue-700 active:bg-blue-100 active:scale-95 transition-all"
            >
              {digit}
            </button>
          ))}
          <button
            onClick={handleClear}
            className="aspect-square rounded-xl bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-all"
          >
            <Delete className="w-6 h-6 text-gray-600" />
          </button>
          <button
            onClick={() => handlePinPress('0')}
            className="aspect-square rounded-xl text-xl font-semibold bg-gray-100 hover:bg-blue-50 hover:text-blue-700 active:bg-blue-100 active:scale-95 transition-all"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="aspect-square rounded-xl bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-all"
          >
            <Delete className="w-6 h-6 text-gray-600 rotate-180" />
          </button>
        </div>
      </div>
    </div>
  );
}
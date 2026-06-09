// src/pages/MainPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, LogIn, Delete, Store } from 'lucide-react';
import { usePOSStore } from '../stores/posStore';
import type { Staff } from '@mat-ai/types';

export const MainPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, currentStaff } = usePOSStore();
  const [action, setAction] = useState<'pos' | 'timecard' | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentStaff) navigate('/dashboard');
  }, [currentStaff, navigate]);

  const handlePinPress = useCallback(
    (digit: string) => {
      if (!action || pin.length >= 4) return;
      setPin((prev) => prev + digit);
      setError('');
    },
    [action, pin.length]
  );

  const handleClear = useCallback(() => {
    setPin('');
    setError('');
  }, []);

  const handleBackspace = useCallback(() => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  }, []);

  const triggerShake = useCallback(() => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!action) return;
    if (pin.length !== 4) {
      setError('Enter 4 digits');
      triggerShake();
      return;
    }

    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 300));

    const now = new Date().toISOString();
    const demoStaffs: Staff[] = [
      { id: '1', name: 'Ahmad', pin: '1234', role: 'CASHIER', isActive: true, employmentType: 'HOURLY_PART_TIME', joinDate: now, createdAt: now, updatedAt: now },
      { id: '2', name: 'Sarah', pin: '5678', role: 'ADMIN', isActive: true, employmentType: 'MONTHLY_SALARIED', joinDate: now, createdAt: now, updatedAt: now },
      { id: '3', name: 'Ali', pin: '0000', role: 'ADMIN', isActive: true, employmentType: 'MONTHLY_SALARIED', joinDate: now, createdAt: now, updatedAt: now },
    ];

    const staff = demoStaffs.find((s) => s.pin === pin);
    if (!staff) {
      setError('Invalid PIN');
      triggerShake();
      setPin('');
      setLoading(false);
      return;
    }

    if (action === 'pos') {
      login(staff);
      navigate('/dashboard');
    } else {
      alert(`Time Card: ${staff.name} at ${new Date().toLocaleTimeString()}`);
      setPin('');
      setLoading(false);
    }
  }, [pin, action, login, navigate, triggerShake]);

  // Auto-submit on 4 digits
  useEffect(() => {
    if (pin.length === 4 && action && !loading) {
      handleSubmit();
    }
  }, [pin, action, loading, handleSubmit]);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!action) return;
      if (e.key >= '0' && e.key <= '9') handlePinPress(e.key);
      else if (e.key === 'Backspace') handleBackspace();
      else if (e.key === 'Enter') handleSubmit();
      else if (e.key === 'Escape') handleClear();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [action, handlePinPress, handleBackspace, handleSubmit, handleClear]);

  const selectAction = (a: 'pos' | 'timecard') => {
    setAction(a);
    setPin('');
    setError('');
  };

  const isPos = action === 'pos';
  const isTimecard = action === 'timecard';
  const activeColor = isPos ? 'bg-primary-600' : 'bg-emerald-600';
  const activeHover = isPos ? 'hover:bg-primary-700' : 'hover:bg-emerald-700';
  const dotColor = isPos ? 'bg-primary-600' : 'bg-emerald-600';

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-primary-50 to-primary-100 p-6">
      {/* Logo */}
      <div className="mb-6 text-center">
        <div className="w-20 h-20 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
          <Store className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">MAT.ai POS</h1>
        <p className="text-sm text-gray-600">Smart Restaurant System</p>
      </div>

      {/* Main Card */}
      <div
        className={`w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 ${
          shake ? 'animate-shake' : ''
        }`}
      >
        {/* Action Selection */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => selectAction('pos')}
            className={`py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2
              ${
                isPos
                  ? 'bg-primary-600 text-white shadow-md ring-2 ring-primary-600 ring-offset-2'
                  : 'bg-gray-100 text-gray-700 hover:bg-primary-50 hover:text-primary-700'
              }`}
          >
            <LogIn className="w-4 h-4" /> POS
          </button>
          <button
            onClick={() => selectAction('timecard')}
            className={`py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2
              ${
                isTimecard
                  ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-600 ring-offset-2'
                  : 'bg-gray-100 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700'
              }`}
          >
            <Clock className="w-4 h-4" /> Time Card
          </button>
        </div>

        {/* PIN Dots */}
        <div className="flex gap-3 justify-center mb-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all duration-200 ${
                i < pin.length && action ? `${dotColor} scale-110` : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Error */}
        <div className="h-6 mb-2 flex items-center justify-center">
          {error && (
            <p className="text-sm text-danger font-medium animate-pulse">{error}</p>
          )}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              onClick={() => handlePinPress(digit)}
              disabled={!action || loading}
              className={`aspect-square rounded-xl text-2xl font-semibold transition-all duration-150 shadow-sm
                ${
                  action && !loading
                    ? 'bg-gray-100 text-gray-800 hover:bg-primary-100 hover:text-primary-700 active:bg-primary-200 active:scale-95'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-60'
                }`}
            >
              {digit}
            </button>
          ))}
          <button
            onClick={handleClear}
            disabled={!action || loading}
            className={`aspect-square rounded-xl transition-all duration-150 shadow-sm flex items-center justify-center
              ${
                action && !loading
                  ? 'bg-gray-200 text-gray-600 hover:bg-gray-300 active:bg-gray-400 active:scale-95'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-60'
              }`}
          >
            <Delete className="w-6 h-6" />
          </button>
          <button
            onClick={() => handlePinPress('0')}
            disabled={!action || loading}
            className={`aspect-square rounded-xl text-2xl font-semibold transition-all duration-150 shadow-sm
              ${
                action && !loading
                  ? 'bg-gray-100 text-gray-800 hover:bg-primary-100 hover:text-primary-700 active:bg-primary-200 active:scale-95'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-60'
              }`}
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            disabled={!action || loading}
            className={`aspect-square rounded-xl transition-all duration-150 shadow-sm flex items-center justify-center
              ${
                action && !loading
                  ? 'bg-gray-200 text-gray-600 hover:bg-gray-300 active:bg-gray-400 active:scale-95'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-60'
              }`}
          >
            <Delete className="w-6 h-6 rotate-180" />
          </button>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!action || loading || pin.length !== 4}
          className={`w-full py-4 rounded-xl font-semibold text-lg text-white
            active:scale-[0.98] transition-all shadow-md
            disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100
            flex items-center justify-center gap-2
            ${action ? `${activeColor} ${activeHover}` : 'bg-gray-400'}`}
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : !action ? (
            <span>Select Option</span>
          ) : isPos ? (
            <>
              <LogIn className="w-5 h-5" /> Enter POS
            </>
          ) : (
            <>
              <Clock className="w-5 h-5" /> Submit Time Card
            </>
          )}
        </button>
      </div>

      {/* Version */}
      <p className="mt-6 text-xs text-gray-500">v1.0.0 | MAT.ai POS</p>
    </div>
  );
};
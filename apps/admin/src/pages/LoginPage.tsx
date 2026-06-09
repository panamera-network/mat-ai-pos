// app/admin/src/pages/LoginPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Lock } from 'lucide-react';

export function LoginPage() {
  const [pin, setPin] = useState('');
  const { loginWithPin, loading, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) return;
    const success = await loginWithPin(pin);
    if (success) navigate('/dashboard');
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800 p-6">
      <div className="w-full max-w-sm md:max-w-md bg-white rounded-3xl shadow-2xl p-8 md:p-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 md:w-10 md:h-10 text-blue-600" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">MAT Admin</h1>
          <p className="text-sm md:text-base text-gray-500 mt-1">Manager PIN</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            placeholder="••••••"
            className="w-full text-center text-2xl md:text-3xl tracking-widest py-4 md:py-5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
            autoFocus
          />
          {error && <p className="text-center text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading || pin.length < 4}
            className="w-full py-4 md:py-5 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Checking...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
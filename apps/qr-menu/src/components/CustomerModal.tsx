import React, { useState, useEffect } from 'react';
import { X, Gift, Star, User, Phone } from 'lucide-react';
import { Customer } from '@mat-ai/types';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; phone: string }) => void;
  existingCustomer?: Customer | null;
  onSkip?: () => void;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  existingCustomer,
  onSkip,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

  useEffect(() => {
    if (existingCustomer) {
      setName(existingCustomer.name);
      setPhone(existingCustomer.phone);
    }
  }, [existingCustomer]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: { name?: string; phone?: string } = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!phone.trim()) {
      newErrors.phone = 'Phone is required';
    } else if (!/^(01)[0-9]{8,9}$/.test(phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Valid Malaysian phone required (01x-xxxxxxx)';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({ name: name.trim(), phone: phone.replace(/\D/g, '') });
    }
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex justify-center mb-3">
            <div className="bg-white/20 p-3 rounded-full">
              <Gift className="w-8 h-8" />
            </div>
          </div>

          <h2 className="text-xl font-bold">
            {existingCustomer ? `Welcome back, ${existingCustomer.name}!` : 'Join & Earn Rewards'}
          </h2>
          <p className="text-sm text-white/80 mt-1">
            {existingCustomer
              ? `You have ${existingCustomer.points} points`
              : 'Earn 1 point for every RM 1 spent'}
          </p>
        </div>

        <div className="p-6">
          {existingCustomer ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl">
                <Star className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="font-semibold text-gray-800">{existingCustomer.points} Points</p>
                  <p className="text-xs text-gray-500">{existingCustomer.visits} visits total</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="flex-1 bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition-colors"
                >
                  Continue Ordering
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <User className="w-4 h-4" />
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  placeholder="012-345-6789"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all"
              >
                Start Earning Points
              </button>

              {onSkip && (
                <button
                  type="button"
                  onClick={onSkip}
                  className="w-full text-gray-500 text-sm py-2 hover:text-gray-700 transition-colors"
                >
                  Skip for now
                </button>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

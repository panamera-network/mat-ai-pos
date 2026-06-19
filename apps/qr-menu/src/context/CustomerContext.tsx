import React, { createContext, useContext, useState, useCallback } from 'react';
import { Customer, CreateCustomerPayload } from '@mat-ai/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface CustomerContextType {
  customer: Customer | null;
  loading: boolean;
  error: string | null;
  loadCustomer: (phone: string) => Promise<Customer | null>;
  createCustomer: (payload: CreateCustomerPayload) => Promise<Customer>;
  initFromStorage: () => boolean;
  logout: () => void;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const CustomerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCustomer = useCallback(async (phone: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/customers/phone/${phone}`);
      if (res.ok) {
        const data = await res.json();
        setCustomer(data);
        localStorage.setItem('mat_customer', JSON.stringify(data));
        return data;
      }
      return null;
    } catch {
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createCustomer = useCallback(async (payload: CreateCustomerPayload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to create customer');

      const data = await res.json();
      setCustomer(data);
      localStorage.setItem('mat_customer', JSON.stringify(data));
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const initFromStorage = useCallback(() => {
    const stored = localStorage.getItem('mat_customer');
    if (stored) {
      try {
        setCustomer(JSON.parse(stored));
        return true;
      } catch {
        localStorage.removeItem('mat_customer');
      }
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setCustomer(null);
    localStorage.removeItem('mat_customer');
  }, []);

  return (
    <CustomerContext.Provider value={{
      customer, loading, error, loadCustomer, createCustomer, initFromStorage, logout
    }}>
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomerContext = () => {
  const ctx = useContext(CustomerContext);
  if (!ctx) throw new Error('useCustomerContext must be used within CustomerProvider');
  return ctx;
};

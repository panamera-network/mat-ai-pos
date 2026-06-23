// apps/backoffice/src/hooks/useOutlet.ts
import { useState, useEffect, useCallback } from 'react';
import { useApi } from './useApi';
import { useAuthStore } from '@mat-ai/backoffice';

export function useOutlet() {
  const { get } = useApi();
  const staff = useAuthStore((s) => s.staff);
  const isSuperAdmin = staff?.isSuperAdmin || false;
  
  const [outlets, setOutlets] = useState<{ id: string; name: string }[]>([]);
  const [selectedOutletId, setSelectedOutletId] = useState<string>(() => {
    return localStorage.getItem('selectedOutletId') || staff?.outletId || '';
  });

  const loadOutlets = useCallback(async () => {
    if (!isSuperAdmin) return;
    const res = await get<{ id: string; name: string }[]>('/outlets');
    if (res.ok && res.data) {
      setOutlets(res.data);
    }
  }, [get, isSuperAdmin]);

  useEffect(() => {
    loadOutlets();
  }, [loadOutlets]);

  useEffect(() => {
    if (!isSuperAdmin && staff?.outletId && !selectedOutletId) {
      setSelectedOutletId(staff.outletId);
      localStorage.setItem('selectedOutletId', staff.outletId);
    }
  }, [isSuperAdmin, staff?.outletId, selectedOutletId]);

  const selectOutlet = useCallback((id: string) => {
    setSelectedOutletId(id);
    localStorage.setItem('selectedOutletId', id);
  }, []);

  return {
    outlets,
    selectedOutletId,
    selectOutlet,
    isSuperAdmin,
  };
}
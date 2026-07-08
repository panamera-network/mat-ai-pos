import { useCallback, useMemo } from 'react';
import { useApi } from './useApi';
import type {
  Account,
  JournalEntry,
  TrialBalance,
  GeneralLedger,
  CreateAccountPayload,
  UpdateAccountPayload,
  CreateJournalEntryPayload,
  TrialBalanceQuery,
  LedgerQuery,
} from '@mat-ai/types';

function cleanPayload<T extends Record<string, unknown>>(payload: T): T {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== '')
  ) as T;
}

export function useAccounting() {
  const { get, post, patch, del } = useApi();

  // ============================================
  // ACCOUNTS
  // ============================================

  const getAccounts = useCallback(
    (outletId?: string) =>
      get<Account[]>(`/accounting/accounts${outletId ? `?outletId=${outletId}` : ''}`),
    [get]
  );

  const getAccount = useCallback(
    (id: string) => get<Account>(`/accounting/accounts/${id}`),
    [get]
  );

  const createAccount = useCallback(
    (payload: CreateAccountPayload) =>
      post<Account>('/accounting/accounts', cleanPayload(payload as unknown as Record<string, unknown>)),
    [post]
  );

  const updateAccount = useCallback(
    (id: string, payload: UpdateAccountPayload) =>
      patch<Account>(`/accounting/accounts/${id}`, cleanPayload(payload as unknown as Record<string, unknown>)),
    [patch]
  );

  const deleteAccount = useCallback(
    (id: string) => del<{ message: string }>(`/accounting/accounts/${id}`),
    [del]
  );

  const createPresetCoa = useCallback(
    (outletId: string) =>
      post<{ message: string; created: string[] }>(`/accounting/accounts/preset/${outletId}`, {}),
    [post]
  );

  // ============================================
  // JOURNAL ENTRIES
  // ============================================

  const getJournalEntries = useCallback(
    (params?: { outletId?: string; from?: string; to?: string }) => {
      const query = new URLSearchParams();
      if (params?.outletId) query.append('outletId', params.outletId);
      if (params?.from) query.append('from', params.from);
      if (params?.to) query.append('to', params.to);
      return get<JournalEntry[]>(`/accounting/journal-entries?${query.toString()}`);
    },
    [get]
  );

  const getJournalEntry = useCallback(
    (id: string) => get<JournalEntry>(`/accounting/journal-entries/${id}`),
    [get]
  );

  const createJournalEntry = useCallback(
    (payload: CreateJournalEntryPayload) =>
      post<JournalEntry>('/accounting/journal-entries', cleanPayload(payload as unknown as Record<string, unknown>)),
    [post]
  );

  const postJournalEntry = useCallback(
    (id: string) =>
      post<JournalEntry>(`/accounting/journal-entries/${id}/post`, {}),
    [post]
  );

  const deleteJournalEntry = useCallback(
    (id: string) => del<{ message: string }>(`/accounting/journal-entries/${id}`),
    [del]
  );

  // ============================================
  // REPORTS
  // ============================================

  const getTrialBalance = useCallback(
    (query: TrialBalanceQuery) => {
      const params = new URLSearchParams();
      if (query.outletId) params.append('outletId', query.outletId);
      if (query.asOf) params.append('asOf', query.asOf);
      return get<TrialBalance>(`/accounting/reports/trial-balance?${params.toString()}`);
    },
    [get]
  );

  const getGeneralLedger = useCallback(
    (query: LedgerQuery) => {
      const params = new URLSearchParams();
      params.append('accountId', query.accountId);
      if (query.from) params.append('from', query.from);
      if (query.to) params.append('to', query.to);
      return get<GeneralLedger>(`/accounting/reports/general-ledger?${params.toString()}`);
    },
    [get]
  );

  return useMemo(() => ({
    // Accounts
    getAccounts,
    getAccount,
    createAccount,
    updateAccount,
    deleteAccount,
    createPresetCoa,
    // Journal Entries
    getJournalEntries,
    getJournalEntry,
    createJournalEntry,
    postJournalEntry,
    deleteJournalEntry,
    // Reports
    getTrialBalance,
    getGeneralLedger,
  }), [
    getAccounts, getAccount, createAccount, updateAccount, deleteAccount, createPresetCoa,
    getJournalEntries, getJournalEntry, createJournalEntry, postJournalEntry, deleteJournalEntry,
    getTrialBalance, getGeneralLedger,
  ]);
}

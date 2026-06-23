import { useState, useCallback, useEffect } from 'react';
import { useAccounting } from '../../hooks/useAccounting';
import type { Account, GeneralLedger } from '@mat-ai/types';

export default function GeneralLedgerPage() {
  const { getAccounts, getGeneralLedger } = useAccounting();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [ledger, setLedger] = useState<GeneralLedger | null>(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });

  const loadAccounts = useCallback(async () => {
    const res = await getAccounts();
    if (res.ok && res.data) setAccounts(res.data);
  }, [getAccounts]);

  useEffect(() => {
    loadAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectAccount = async (account: Account) => {
    setSelectedAccount(account);
    setLoading(true);
    const res = await getGeneralLedger({
      accountId: account.id,
      from: dateRange.from,
      to: dateRange.to,
    });
    if (res.ok && res.data) setLedger(res.data);
    setLoading(false);
  };

  const handleRefresh = async () => {
    if (!selectedAccount) return;
    setLoading(true);
    const res = await getGeneralLedger({
      accountId: selectedAccount.id,
      from: dateRange.from,
      to: dateRange.to,
    });
    if (res.ok && res.data) setLedger(res.data);
    setLoading(false);
  };

  const accountTypeColors: Record<string, string> = {
    ASSET: 'bg-blue-50 border-blue-200',
    LIABILITY: 'bg-red-50 border-red-200',
    EQUITY: 'bg-purple-50 border-purple-200',
    REVENUE: 'bg-green-50 border-green-200',
    EXPENSE: 'bg-orange-50 border-orange-200',
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">General Ledger</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold mb-3">Pilih Akaun</h2>
            <div className="space-y-1 max-h-[600px] overflow-auto">
              {accounts.map((acc) => (
                <button key={acc.id} onClick={() => handleSelectAccount(acc)} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedAccount?.id === acc.id ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'}`}>
                  <div className="flex justify-between"><span className="font-mono">{acc.code}</span><span className="text-xs text-gray-500">{acc.type}</span></div>
                  <div className="truncate">{acc.name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="lg:col-span-2">
          {selectedAccount ? (
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <div className="flex justify-between items-start mb-3">
                  <div><h2 className="text-lg font-bold">{selectedAccount.code} - {selectedAccount.name}</h2><p className="text-sm text-gray-500">{selectedAccount.type}</p></div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${accountTypeColors[selectedAccount.type]}`}>{selectedAccount.type}</div>
                </div>
                <div className="flex gap-2 items-center">
                  <input type="date" value={dateRange.from} onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })} className="px-2 py-1 border rounded text-sm" />
                  <span className="text-gray-500">-</span>
                  <input type="date" value={dateRange.to} onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })} className="px-2 py-1 border rounded text-sm" />
                  <button onClick={handleRefresh} className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">Refresh</button>
                </div>
              </div>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : ledger?.lines.length ? (
                <table className="w-full">
                  <thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left text-xs">Tarikh</th><th className="px-4 py-3 text-left text-xs">Ref</th><th className="px-4 py-3 text-left text-xs">Keterangan</th><th className="px-4 py-3 text-right text-xs">Debit</th><th className="px-4 py-3 text-right text-xs">Credit</th><th className="px-4 py-3 text-right text-xs">Baki</th></tr></thead>
                  <tbody className="divide-y">
                    <tr className="bg-gray-50"><td colSpan={5} className="px-4 py-2 text-sm font-medium">Baki Awal</td><td className="px-4 py-2 text-right font-mono font-medium">RM {ledger.openingBalance.toFixed(2)}</td></tr>
                    {ledger.lines.map((line, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm">{new Date(line.date).toLocaleDateString('ms-MY')}</td>
                        <td className="px-4 py-2 text-sm font-mono">{line.reference || '-'}</td>
                        <td className="px-4 py-2 text-sm">{line.description}</td>
                        <td className="px-4 py-2 text-right font-mono text-sm">{line.debit > 0 ? `RM ${line.debit.toFixed(2)}` : '-'}</td>
                        <td className="px-4 py-2 text-right font-mono text-sm">{line.credit > 0 ? `RM ${line.credit.toFixed(2)}` : '-'}</td>
                        <td className="px-4 py-2 text-right font-mono font-medium text-sm">RM {line.balance.toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 border-t-2"><td colSpan={5} className="px-4 py-2 text-sm font-bold">Baki Akhir</td><td className="px-4 py-2 text-right font-mono font-bold">RM {ledger.closingBalance.toFixed(2)}</td></tr>
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-8 text-gray-500">Tiada transaksi untuk tempoh ini</div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">Pilih akaun dari sidebar untuk melihat ledger</div>
          )}
        </div>
      </div>
    </div>
  );
}
import { useState, useCallback } from 'react';
import { useAccounting } from '../../hooks/useAccounting';
import type { TrialBalance, AccountType } from '@mat-ai/types';

const TYPE_LABELS: Record<AccountType, string> = {
  ASSET: 'Aset', LIABILITY: 'Liabiliti', EQUITY: 'Ekuiti', REVENUE: 'Hasil', EXPENSE: 'Belanja',
};

export default function TrialBalancePage() {
  const { getTrialBalance } = useAccounting();
  const [trialBalance, setTrialBalance] = useState<TrialBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [asOf, setAsOf] = useState(new Date().toISOString().split('T')[0]);

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    const res = await getTrialBalance({ asOf });
    if (res.ok && res.data) setTrialBalance(res.data);
    setLoading(false);
  }, [getTrialBalance, asOf]);

  const exportToCsv = () => {
    if (!trialBalance) return;
    const rows = [
      ['Kod', 'Nama Akaun', 'Jenis', 'Debit (RM)', 'Credit (RM)', 'Baki (RM)'],
      ...trialBalance.rows.map((r) => [r.code, r.name, TYPE_LABELS[r.type], r.debits.toFixed(2), r.credits.toFixed(2), r.balance.toFixed(2)]),
      ['', '', 'JUMLAH', trialBalance.totalDebits.toFixed(2), trialBalance.totalCredits.toFixed(2), ''],
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trial-balance-${asOf}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Trial Balance</h1>
        {trialBalance && (
          <button onClick={exportToCsv} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Export CSV</button>
        )}
      </div>
      <div className="flex gap-4 items-center mb-6 bg-white p-4 rounded-lg shadow">
        <div>
          <label className="block text-sm font-medium mb-1">Sehingga Tarikh</label>
          <input type="date" value={asOf} onChange={(e) => setAsOf(e.target.value)} className="px-3 py-2 border rounded-lg" />
        </div>
        <button onClick={handleGenerate} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mt-6">Generate</button>
      </div>
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : trialBalance ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className={`px-4 py-3 ${trialBalance.isBalanced ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            <div className="flex items-center gap-2">
              <span className="text-lg">{trialBalance.isBalanced ? '✅' : '⚠️'}</span>
              <span className="font-medium">{trialBalance.isBalanced ? 'Buku seimbang — Debit = Credit' : 'Buku TIDAK seimbang — Semak semula'}</span>
            </div>
            <p className="text-sm mt-1">Sehingga: {new Date(trialBalance.asOf).toLocaleDateString('ms-MY')}</p>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left text-sm">Kod</th><th className="px-4 py-3 text-left text-sm">Nama Akaun</th><th className="px-4 py-3 text-left text-sm">Jenis</th><th className="px-4 py-3 text-right text-sm">Debit</th><th className="px-4 py-3 text-right text-sm">Credit</th><th className="px-4 py-3 text-right text-sm">Baki</th></tr></thead>
            <tbody className="divide-y">
              {trialBalance.rows.map((row) => (
                <tr key={row.code} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-sm">{row.code}</td>
                  <td className="px-4 py-3 font-medium">{row.name}</td>
                  <td className="px-4 py-3"><span className="px-2 py-1 rounded text-xs bg-gray-100">{TYPE_LABELS[row.type]}</span></td>
                  <td className="px-4 py-3 text-right font-mono">{row.debits > 0 ? row.debits.toFixed(2) : '-'}</td>
                  <td className="px-4 py-3 text-right font-mono">{row.credits > 0 ? row.credits.toFixed(2) : '-'}</td>
                  <td className={`px-4 py-3 text-right font-mono font-medium ${row.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>{row.balance.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-100 border-t-2">
              <tr><td colSpan={3} className="px-4 py-3 font-bold text-right">JUMLAH</td><td className="px-4 py-3 text-right font-mono font-bold">{trialBalance.totalDebits.toFixed(2)}</td><td className="px-4 py-3 text-right font-mono font-bold">{trialBalance.totalCredits.toFixed(2)}</td><td className="px-4 py-3"></td></tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow">Klik "Generate" untuk melihat Trial Balance</div>
      )}
    </div>
  );
}

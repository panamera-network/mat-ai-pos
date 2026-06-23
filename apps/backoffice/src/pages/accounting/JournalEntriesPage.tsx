import { useState, useEffect, useCallback } from 'react';
import { useAccounting } from '../../hooks/useAccounting';
import type { JournalEntry, JournalLinePayload, Account } from '@mat-ai/types';

export default function JournalEntriesPage() {
  const { getJournalEntries, createJournalEntry, postJournalEntry, deleteJournalEntry, getAccounts } = useAccounting();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [detailEntry, setDetailEntry] = useState<JournalEntry | null>(null);
  const [filter, setFilter] = useState({ from: '', to: '', outletId: '' });

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    reference: '',
    description: '',
    lines: [{ accountId: '', description: '', debit: 0, credit: 0 }] as JournalLinePayload[],
  });

  const loadEntries = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    const res = await getJournalEntries({
      from: filter.from || undefined,
      to: filter.to || undefined,
    });
    if (res.ok && res.data) setEntries(res.data);
    setLoading(false);
  }, [getJournalEntries, filter.from, filter.to]);

  const loadAccounts = useCallback(async () => {
    const res = await getAccounts();
    if (res.ok && res.data) setAccounts(res.data);
  }, [getAccounts]);

  useEffect(() => {
    loadEntries();
    loadAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter.from, filter.to]);

  const addLine = () => {
    setFormData({
      ...formData,
      lines: [...formData.lines, { accountId: '', description: '', debit: 0, credit: 0 }],
    });
  };

  const removeLine = (index: number) => {
    if (formData.lines.length <= 2) return;
    setFormData({
      ...formData,
      lines: formData.lines.filter((_, i) => i !== index),
    });
  };

  const updateLine = (index: number, field: keyof JournalLinePayload, value: any) => {
    const newLines = [...formData.lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setFormData({ ...formData, lines: newLines });
  };

  const totalDebits = formData.lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalCredits = formData.lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.001;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) {
      alert('Jumlah debit dan kredit mesti seimbang!');
      return;
    }
    const payload = {
      ...formData,
      date: new Date(formData.date).toISOString(),
      lines: formData.lines.filter((l) => l.accountId && ((l.debit ?? 0) > 0 || (l.credit ?? 0) > 0)),
    };
    await createJournalEntry(payload);
    setShowModal(false);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      reference: '',
      description: '',
      lines: [{ accountId: '', description: '', debit: 0, credit: 0 }],
    });
    loadEntries();
  };

  const handlePost = async (id: string) => {
    if (!confirm('Post journal entry? Ini akan lock dan tidak boleh diubah.')) return;
    await postJournalEntry(id);
    loadEntries();
  };

  const handleDelete = async (id: string, isAuto: boolean) => {
    if (isAuto) {
      alert('Journal entry auto-generated tidak boleh dipadam.');
      return;
    }
    if (!confirm('Padam journal entry ini?')) return;
    await deleteJournalEntry(id);
    loadEntries();
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Jurnal Entries</h1>
        <button
          onClick={() => {
            setFormData({
              date: new Date().toISOString().split('T')[0],
              reference: '',
              description: '',
              lines: [
                { accountId: '', description: '', debit: 0, credit: 0 },
                { accountId: '', description: '', debit: 0, credit: 0 },
              ],
            });
            setShowModal(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Jurnal Baru
        </button>
      </div>

      <div className="flex gap-4 mb-4">
        <input
          type="date"
          value={filter.from}
          onChange={(e) => setFilter({ ...filter, from: e.target.value })}
          className="px-3 py-2 border rounded-lg"
        />
        <input
          type="date"
          value={filter.to}
          onChange={(e) => setFilter({ ...filter, to: e.target.value })}
          className="px-3 py-2 border rounded-lg"
        />
        <button
          onClick={loadEntries}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          Filter
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Tarikh</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Reference</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Keterangan</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Jumlah</th>
                <th className="px-4 py-3 text-center text-sm font-medium">Status</th>
                <th className="px-4 py-3 text-center text-sm font-medium">Jenis</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {entries.map((entry) => {
                const total = entry.lines.reduce((sum, l) => sum + l.debit, 0);
                return (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{new Date(entry.date).toLocaleDateString('ms-MY')}</td>
                    <td className="px-4 py-3 text-sm font-mono">{entry.reference || '-'}</td>
                    <td className="px-4 py-3 text-sm">{entry.description}</td>
                    <td className="px-4 py-3 text-sm text-right font-mono">RM {total.toFixed(2)}</td>
                    <td className="px-4 py-3 text-center">
                      {entry.isPosted ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Posted</span>
                      ) : (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">Draft</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {entry.isAutoGenerated ? (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Auto</span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">Manual</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setDetailEntry(entry)} className="text-blue-600 hover:text-blue-800 mr-3 text-sm">Detail</button>
                      {!entry.isPosted && !entry.isAutoGenerated && (
                        <>
                          <button onClick={() => handlePost(entry.id)} className="text-green-600 hover:text-green-800 mr-3 text-sm">Post</button>
                          <button onClick={() => handleDelete(entry.id, entry.isAutoGenerated)} className="text-red-600 hover:text-red-800 text-sm">Padam</button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {entries.length === 0 && <div className="text-center py-8 text-gray-500">Tiada journal entries</div>}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl my-8">
            <h2 className="text-xl font-bold mb-4">Jurnal Entry Baru</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tarikh</label>
                  <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Reference</label>
                  <input type="text" value={formData.reference} onChange={(e) => setFormData({ ...formData, reference: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="e.g., JE-001" />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Keterangan</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border rounded-lg" rows={2} required />
              </div>
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium">Journal Lines</label>
                  <button type="button" onClick={addLine} className="text-sm text-blue-600 hover:text-blue-800">+ Tambah Line</button>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr><th className="px-3 py-2 text-left text-xs">Akaun</th><th className="px-3 py-2 text-left text-xs">Keterangan</th><th className="px-3 py-2 text-right text-xs">Debit</th><th className="px-3 py-2 text-right text-xs">Credit</th><th></th></tr>
                    </thead>
                    <tbody>
                      {formData.lines.map((line, index) => (
                        <tr key={index} className="border-t">
                          <td className="px-3 py-2">
                            <select value={line.accountId} onChange={(e) => updateLine(index, 'accountId', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" required>
                              <option value="">Pilih Akaun</option>
                              {accounts.map((acc) => (<option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>))}
                            </select>
                          </td>
                          <td className="px-3 py-2"><input type="text" value={line.description} onChange={(e) => updateLine(index, 'description', e.target.value)} className="w-full px-2 py-1 border rounded text-sm" /></td>
                          <td className="px-3 py-2"><input type="number" step="0.01" min="0" value={line.debit || ''} onChange={(e) => updateLine(index, 'debit', parseFloat(e.target.value) || 0)} className="w-full px-2 py-1 border rounded text-sm text-right" /></td>
                          <td className="px-3 py-2"><input type="number" step="0.01" min="0" value={line.credit || ''} onChange={(e) => updateLine(index, 'credit', parseFloat(e.target.value) || 0)} className="w-full px-2 py-1 border rounded text-sm text-right" /></td>
                          <td className="px-3 py-2 text-center"><button type="button" onClick={() => removeLine(index)} className="text-red-500 hover:text-red-700" disabled={formData.lines.length <= 2}>×</button></td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={2} className="px-3 py-2 text-right font-medium text-sm">Jumlah:</td>
                        <td className={`px-3 py-2 text-right font-mono font-medium ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>RM {totalDebits.toFixed(2)}</td>
                        <td className={`px-3 py-2 text-right font-mono font-medium ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>RM {totalCredits.toFixed(2)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                {!isBalanced && <p className="text-red-500 text-sm mt-1">⚠️ Jumlah debit dan kredit tidak seimbang!</p>}
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Batal</button>
                <button type="submit" disabled={!isBalanced} className={`px-4 py-2 rounded-lg text-white ${isBalanced ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'}`}>Simpan Jurnal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detailEntry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Journal Entry Detail</h2>
            <div className="space-y-2 text-sm mb-4">
              <p><span className="font-medium">Tarikh:</span> {new Date(detailEntry.date).toLocaleDateString('ms-MY')}</p>
              <p><span className="font-medium">Reference:</span> {detailEntry.reference || '-'}</p>
              <p><span className="font-medium">Keterangan:</span> {detailEntry.description}</p>
              <p><span className="font-medium">Status:</span> {detailEntry.isPosted ? 'Posted' : 'Draft'}</p>
              <p><span className="font-medium">Jenis:</span> {detailEntry.isAutoGenerated ? 'Auto-generated' : 'Manual'}</p>
              {detailEntry.createdBy && <p><span className="font-medium">Dicipta oleh:</span> {detailEntry.createdBy.name}</p>}
            </div>
            <table className="w-full border rounded-lg mb-4">
              <thead className="bg-gray-50"><tr><th className="px-3 py-2 text-left text-xs">Akaun</th><th className="px-3 py-2 text-right text-xs">Debit</th><th className="px-3 py-2 text-right text-xs">Credit</th></tr></thead>
              <tbody>
                {detailEntry.lines.map((line) => (
                  <tr key={line.id} className="border-t">
                    <td className="px-3 py-2"><div className="font-medium">{line.account?.name}</div><div className="text-gray-500 text-xs">{line.account?.code}</div></td>
                    <td className="px-3 py-2 text-right font-mono">{line.debit > 0 ? `RM ${line.debit.toFixed(2)}` : '-'}</td>
                    <td className="px-3 py-2 text-right font-mono">{line.credit > 0 ? `RM ${line.credit.toFixed(2)}` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={() => setDetailEntry(null)} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 w-full">Tutup</button>
          </div>
        </div>
      )}
    </div>
  );
}
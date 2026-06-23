import { useState, useEffect, useCallback } from 'react';
import { useAccounting } from '../../hooks/useAccounting';
import { useApi } from '../../hooks/useApi';
import { useAuthStore } from '@mat-ai/backoffice';
import type { Account, AccountType } from '@mat-ai/types';

const ACCOUNT_TYPE_COLORS: Record<AccountType, string> = {
  ASSET: 'bg-blue-100 text-blue-800',
  LIABILITY: 'bg-red-100 text-red-800',
  EQUITY: 'bg-purple-100 text-purple-800',
  REVENUE: 'bg-green-100 text-green-800',
  EXPENSE: 'bg-orange-100 text-orange-800',
};

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  ASSET: 'Aset',
  LIABILITY: 'Liabiliti',
  EQUITY: 'Ekuiti',
  REVENUE: 'Hasil',
  EXPENSE: 'Belanja',
};

export default function ChartOfAccountsPage() {
  const { getAccounts, createPresetCoa, createAccount, updateAccount, deleteAccount } = useAccounting();
  const { get } = useApi();
  const staff = useAuthStore((s) => s.staff);
  const isSuperAdmin = staff?.isSuperAdmin || false;
  
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<AccountType | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [outlets, setOutlets] = useState<{ id: string; name: string }[]>([]);
  const [selectedOutletId, setSelectedOutletId] = useState<string>(() => {
    return localStorage.getItem('selectedOutletId') || staff?.outletId || '';
  });
  
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'ASSET' as AccountType,
    description: '',
    parentId: '',
  });

  // Load outlets (for super admin dropdown)
  const loadOutlets = useCallback(async () => {
    if (!isSuperAdmin) return;
    const res = await get<{ id: string; name: string }[]>('/outlets');
    if (res.ok && res.data) {
      setOutlets(res.data);
    }
  }, [get, isSuperAdmin]);

  useEffect(() => {
    loadOutlets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-select for non-super-admin
  useEffect(() => {
    if (!isSuperAdmin && staff?.outletId && !selectedOutletId) {
      setSelectedOutletId(staff.outletId);
      localStorage.setItem('selectedOutletId', staff.outletId);
    }
  }, [isSuperAdmin, staff?.outletId, selectedOutletId]);

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    const res = await getAccounts(selectedOutletId || undefined);
    if (res.ok && res.data) setAccounts(res.data);
    setLoading(false);
  }, [getAccounts, selectedOutletId]);

  useEffect(() => {
    if (selectedOutletId) {
      loadAccounts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOutletId]);

  const filteredAccounts = accounts.filter((acc) => {
    const matchesType = filter === 'ALL' || acc.type === filter;
    const matchesSearch =
      acc.code.toLowerCase().includes(search.toLowerCase()) ||
      acc.name.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  const hasPresetAccounts = accounts.some(a => a.isPreset);

  const handleSelectOutlet = (id: string) => {
    setSelectedOutletId(id);
    localStorage.setItem('selectedOutletId', id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAccount) {
      await updateAccount(editingAccount.id, formData);
    } else {
      await createAccount({ ...formData, outletId: selectedOutletId });
    }
    setShowModal(false);
    setEditingAccount(null);
    setFormData({ code: '', name: '', type: 'ASSET', description: '', parentId: '' });
    loadAccounts();
  };

  const handleEdit = (acc: Account) => {
    setEditingAccount(acc);
    setFormData({
      code: acc.code,
      name: acc.name,
      type: acc.type,
      description: acc.description || '',
      parentId: acc.parentId || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Padam akaun ini?')) return;
    await deleteAccount(id);
    loadAccounts();
  };

  const handlePresetCoa = async () => {
    if (!confirm('Generate preset COA? Ini akan create 36 akaun default.')) return;
    
    if (!selectedOutletId) {
      alert('Sila pilih outlet dahulu.');
      return;
    }
    
    await createPresetCoa(selectedOutletId);
    loadAccounts();
  };

  const parentOptions = accounts.filter((a) => !a.parentId);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Carta Akaun</h1>
          
          {/* Outlet Selector */}
          {isSuperAdmin && outlets.length > 0 && (
            <select
              value={selectedOutletId}
              onChange={(e) => handleSelectOutlet(e.target.value)}
              className="mt-2 px-3 py-2 border rounded-lg text-sm bg-white"
            >
              <option value="">-- Pilih Outlet --</option>
              {outlets.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          )}
          
          {!isSuperAdmin && selectedOutletId && (
            <p className="text-sm text-gray-500 mt-1">
              Outlet: {outlets.find((o) => o.id === selectedOutletId)?.name || 'Default'}
            </p>
          )}
        </div>
        
        <div className="flex gap-2">
          {/* Button hide after got preset accounts */}
          {selectedOutletId && !hasPresetAccounts && (
            <button
              onClick={handlePresetCoa}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
            >
              Generate Preset COA
            </button>
          )}
          
          <button
            onClick={() => {
              setEditingAccount(null);
              setFormData({ code: '', name: '', type: 'ASSET', description: '', parentId: '' });
              setShowModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            disabled={!selectedOutletId}
          >
            + Akaun Baru
          </button>
        </div>
      </div>

      {/* Show message if no outlet selected */}
      {!selectedOutletId && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Sila pilih outlet untuk melihat carta akaun</p>
        </div>
      )}

      {selectedOutletId && (
        <>
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              placeholder="Cari kod atau nama..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-4 py-2 border rounded-lg flex-1"
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as AccountType | 'ALL')}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="ALL">Semua Jenis</option>
              <option value="ASSET">Aset</option>
              <option value="LIABILITY">Liabiliti</option>
              <option value="EQUITY">Ekuiti</option>
              <option value="REVENUE">Hasil</option>
              <option value="EXPENSE">Belanja</option>
            </select>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Kod</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Nama</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Jenis</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Parent</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredAccounts.map((acc) => (
                    <tr key={acc.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-sm">{acc.code}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{acc.name}</div>
                        {acc.description && (
                          <div className="text-sm text-gray-500">{acc.description}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${ACCOUNT_TYPE_COLORS[acc.type]}`}>
                          {ACCOUNT_TYPE_LABELS[acc.type]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {acc.parent?.name || '-'}
                      </td>
                      <td className="px-4 py-3">
                        {acc.isPreset ? (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">Preset</span>
                        ) : (
                          <span className="px-2 py-1 bg-green-100 text-green-600 rounded text-xs">Custom</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleEdit(acc)}
                          className="text-blue-600 hover:text-blue-800 mr-3"
                          disabled={acc.isPreset}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(acc.id)}
                          className="text-red-600 hover:text-red-800"
                          disabled={acc.isPreset}
                        >
                          Padam
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredAccounts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {hasPresetAccounts 
                    ? 'Tiada akaun dijumpai' 
                    : 'Tiada akaun. Klik "Generate Preset COA" untuk create akaun default.'}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">
              {editingAccount ? 'Edit Akaun' : 'Akaun Baru'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Kod Akaun</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., 6100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Nama Akaun</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g., Rent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Jenis</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as AccountType })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="ASSET">Aset</option>
                    <option value="LIABILITY">Liabiliti</option>
                    <option value="EQUITY">Ekuiti</option>
                    <option value="REVENUE">Hasil</option>
                    <option value="EXPENSE">Belanja</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Parent Akaun (Optional)</label>
                  <select
                    value={formData.parentId}
                    onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">- Tiada Parent -</option>
                    {parentOptions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} - {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Keterangan</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows={2}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingAccount ? 'Simpan' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
import { useEffect, useState, useCallback } from 'react';
import { useApi } from '@mat-ai/backoffice';
import {
  RefreshCw, DollarSign, Calendar, CheckCircle, AlertCircle,
  Download, Filter, Check, X
} from 'lucide-react';

export const PayrollPage: React.FC = () => {
  const { get, patch } = useApi();

  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<'all' | 'PAID' | 'PENDING'>('all');

  const fetchPayrolls = useCallback(async (isManual = false) => {
    if (!isManual) setLoading(true);
    try {
      const res = await get('/payroll');
      if (res.ok) {
        setPayrolls((res.data as any[]) || []);
        setLastRefresh(new Date());
      }
    } catch (err) {
      console.error('Payroll fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [get]);

  useEffect(() => {
    fetchPayrolls();
  }, [fetchPayrolls]);

  const handleBulkApprove = async () => {
    const ids = Array.from(selectedIds);
    await Promise.all(ids.map(id => patch(`/payroll/${id}/approve`, {})));
    setSelectedIds(new Set());
    fetchData(true);
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    const pendingIds = filteredPayrolls.filter(p => p.status !== 'PAID').map(p => p.id);
    if (selectedIds.size === pendingIds.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingIds));
    }
  };

  const handleExport = () => {
    const headers = ['Staff', 'Period Start', 'Period End', 'Basic', 'Deductions', 'Net Pay', 'Status'];
    const rows = filteredPayrolls.map(p => [
      p.staff?.name || 'Unknown',
      new Date(p.periodStart).toLocaleDateString(),
      new Date(p.periodEnd).toLocaleDateString(),
      p.basicPay,
      p.totalDeductions,
      p.nettPay,
      p.status,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredPayrolls = filterStatus === 'all'
    ? payrolls
    : payrolls.filter(p => p.status === filterStatus);

  const totalPayroll = filteredPayrolls.reduce((sum, p) => sum + Number(p.nettPay), 0);
  const paidCount = filteredPayrolls.filter((p) => p.status === 'PAID').length;
  const pendingCount = filteredPayrolls.filter((p) => p.status !== 'PAID').length;

  const timeAgo = () => {
    if (!lastRefresh) return 'Never';
    const diff = Math.floor((Date.now() - lastRefresh.getTime()) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff} min ago`;
    return lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll</h1>
          <p className="text-sm text-gray-500 mt-1">Manage staff payroll and approvals</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchPayrolls(true)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Loading...' : timeAgo()}
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-gray-500">Total Payroll</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">RM{totalPayroll.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm text-gray-500">Paid</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{paidCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-orange-600" />
            <span className="text-sm text-gray-500">Pending</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
        </div>
      </div>

      {/* Filters & Bulk Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex bg-white border rounded-lg p-1">
            {(['all', 'PENDING', 'PAID'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filterStatus === status ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {status === 'all' ? 'All' : status}
              </button>
            ))}
          </div>
        </div>
        {selectedIds.size > 0 && (
          <button
            onClick={handleBulkApprove}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
          >
            <Check className="w-4 h-4" />
            Approve Selected ({selectedIds.size})
          </button>
        )}
      </div>

      {/* Payroll Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-4">
                <input
                  type="checkbox"
                  checked={selectedIds.size > 0 && selectedIds.size === filteredPayrolls.filter(p => p.status !== 'PAID').length}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-gray-300"
                />
              </th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Staff</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Period</th>
              <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Basic</th>
              <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Deductions</th>
              <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Net Pay</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredPayrolls.map((pr) => (
              <tr key={pr.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-4">
                  {pr.status !== 'PAID' && (
                    <input
                      type="checkbox"
                      checked={selectedIds.has(pr.id)}
                      onChange={() => toggleSelect(pr.id)}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                  )}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{pr.staff?.name || 'Unknown'}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(pr.periodStart).toLocaleDateString()} - {new Date(pr.periodEnd).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 text-right">RM{Number(pr.basicPay).toFixed(2)}</td>
                <td className="px-6 py-4 text-sm text-red-600 text-right">RM{Number(pr.totalDeductions).toFixed(2)}</td>
                <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">RM{Number(pr.nettPay).toFixed(2)}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium ${pr.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {pr.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  {pr.status !== 'PAID' && (
                    <button
                      onClick={() => patch(`/payroll/${pr.id}/approve`, {}).then(() => fetchPayrolls(true))}
                      className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100"
                    >
                      Approve
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filteredPayrolls.length === 0 && !loading && (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                  <DollarSign className="w-8 h-8 mx-auto mb-2" />
                  <p>No payroll records</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

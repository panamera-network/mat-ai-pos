import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '@mat-ai/backoffice';
import { ArrowLeft, RefreshCw, DollarSign, Calendar, CheckCircle, AlertCircle } from 'lucide-react';

export function PayrollPage() {
  const navigate = useNavigate();
  const { get } = useApi();

  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

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

  const timeAgo = () => {
    if (!lastRefresh) return 'Never';
    const diff = Math.floor((Date.now() - lastRefresh.getTime()) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff} min ago`;
    return lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const totalPayroll = payrolls.reduce((sum, p) => sum + Number(p.nettPay), 0);
  const paidCount = payrolls.filter((p) => p.status === 'PAID').length;
  const pendingCount = payrolls.filter((p) => p.status !== 'PAID').length;

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="font-bold text-gray-900">Payroll</h1>
        </div>
        <button
          onClick={() => fetchPayrolls(true)}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-lg text-xs text-gray-600 hover:bg-gray-200 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Loading...' : timeAgo()}
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Summary Cards */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-gray-500">Total Payroll</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">RM{totalPayroll.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm text-gray-500">Paid</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{paidCount}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-orange-600" />
              <span className="text-sm text-gray-500">Pending</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
          </div>
        </div>

        {/* Payroll Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Staff</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Period</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Basic</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Deductions</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Net Pay</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payrolls.map((pr) => (
                <tr key={pr.id} className="hover:bg-gray-50 transition-colors">
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
                </tr>
              ))}
              {payrolls.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    <DollarSign className="w-8 h-8 mx-auto mb-2" />
                    <p>No payroll records</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
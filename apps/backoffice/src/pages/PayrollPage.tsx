// apps/backoffice/src/pages/PayrollPage.tsx
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useApi } from '@mat-ai/backoffice';
import type { Staff, Payroll, PayrollStatus, } from '@mat-ai/types';
import {
  RefreshCw, DollarSign, Calendar, CheckCircle, AlertCircle,
  Download, Filter, Check, X, Printer, ArrowRight, Users,
  ChevronDown, FileText
} from 'lucide-react';

type PayrollTab = 'payroll' | 'staff-report';
type PeriodFilter = 'weekly' | 'monthly' | 'all';

export const PayrollPage: React.FC = () => {
  const { get, patch, post } = useApi();

  const [activeTab, setActiveTab] = useState<PayrollTab>('payroll');
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<'all' | 'PAID' | 'PENDING'>('all');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<Payroll | null>(null);

  const fetchPayrolls = useCallback(async (isManual = false) => {
    if (!isManual) setLoading(true);
    try {
      const [payrollRes, staffRes] = await Promise.all([
        get('/payroll'),
        get('/staff'),
      ]);
      if (payrollRes.ok) {
        setPayrolls((payrollRes.data as Payroll[]) || []);
      }
      if (staffRes.ok) {
        setStaffList((staffRes.data as Staff[]) || []);
      }
      setLastRefresh(new Date());
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
    fetchPayrolls(true);
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
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintPayslip = (payroll: Payroll) => {
    setSelectedPayslip(payroll);
    setShowPayslipModal(true);
  };

  const handleTransferToPayroll = async (staffId: string) => {
  const staff = staffList.find(s => s.id === staffId);
  if (!staff) return;
  
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const hourlyPay = staff.hourlyRate ? staff.hourlyRate * 160 : 0;
  const basicPay = staff.monthlySalary ?? (hourlyPay > 0 ? hourlyPay : 2000);

  const payload = {
    staffId: staff.id,
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    basicPay,
    totalDeductions: 0,
    nettPay: basicPay,
    status: 'PENDING' as PayrollStatus,
  };

  // ✅ HANTAR KE API
  const res = await post('/payroll', payload);
  if (res.ok) {
    fetchPayrolls(true);
  } else {
    alert('Failed to create payroll');
  }
};

  // Filter payrolls by period
  const filteredByPeriod = useMemo(() => {
    if (periodFilter === 'all') return payrolls;
    const now = new Date();
    return payrolls.filter((p: Payroll) => {
      const start = new Date(p.periodStart);
      if (periodFilter === 'weekly') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return start >= weekAgo;
      }
      if (periodFilter === 'monthly') {
        return start.getMonth() === now.getMonth() && start.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [payrolls, periodFilter]);

  const filteredPayrolls = filterStatus === 'all'
    ? filteredByPeriod
    : filteredByPeriod.filter(p => p.status === filterStatus);

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

  const periodLabels: Record<PeriodFilter, string> = {
    weekly: 'This Week',
    monthly: 'This Month',
    all: 'All Periods',
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

      {/* Tabs */}
      <div className="flex gap-1 bg-white border rounded-lg p-1 w-fit">
        {([
          { id: 'payroll' as PayrollTab, label: 'Payroll', icon: DollarSign },
          { id: 'staff-report' as PayrollTab, label: 'Staff Report', icon: Users },
        ]).map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === t.id ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* PAYROLL TAB */}
      {activeTab === 'payroll' && (
        <>
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
              <div className="relative">
                <button
                  onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Calendar className="w-4 h-4" />
                  {periodLabels[periodFilter]}
                  <ChevronDown className={`w-4 h-4 transition-transform ${showPeriodDropdown ? 'rotate-180' : ''}`} />
                </button>
                {showPeriodDropdown && (
                  <div className="absolute left-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-2">
                    {(Object.keys(periodLabels) as PeriodFilter[]).map((p) => (
                      <button
                        key={p}
                        onClick={() => { setPeriodFilter(p); setShowPeriodDropdown(false); }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          periodFilter === p ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {periodLabels[p]}
                      </button>
                    ))}
                  </div>
                )}
              </div>

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
                  <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
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
                      <div className="flex items-center justify-center gap-2">
                        {pr.status !== 'PAID' && (
                          <button
                            onClick={() => patch(`/payroll/${pr.id}/approve`, {}).then(() => fetchPayrolls(true))}
                            className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100"
                          >
                            Approve
                          </button>
                        )}
                        <button
                          onClick={() => handlePrintPayslip(pr)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-600"
                          title="Print Payslip"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
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
        </>
      )}

      {/* STAFF REPORT TAB */}
      {activeTab === 'staff-report' && (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Staff</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Role</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Department</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Type</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Rate/Salary</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {staffList.map((staff) => {
                  const hasPayroll = payrolls.some(p => p.staff?.id === staff.id && p.status === 'PENDING' as PayrollStatus);
                  return (
                    <tr key={staff.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-blue-700">{staff.name?.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{staff.name}</p>
                            <p className="text-xs text-gray-500">{staff.email || '-'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium ${
                          staff.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                          staff.role === 'MANAGER' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {staff.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{(staff as any).department || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{staff.employmentType?.replace('_', ' ')}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-right">
                        {staff.hourlyRate ? `RM${staff.hourlyRate}/hr` : staff.monthlySalary ? `RM${staff.monthlySalary}/mo` : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium ${staff.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {staff.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleTransferToPayroll(staff.id)}
                          disabled={hasPayroll}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed mx-auto"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                          {hasPayroll ? 'In Payroll' : 'Transfer'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {staffList.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                      <Users className="w-8 h-8 mx-auto mb-2" />
                      <p>No staff found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Payslip Modal */}
      {showPayslipModal && selectedPayslip && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-semibold text-gray-900">Payslip Preview</h3>
              <button onClick={() => setShowPayslipModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-center border-b pb-4">
                <h4 className="text-lg font-bold text-gray-900">MAT.ai Restaurant</h4>
                <p className="text-sm text-gray-500">Payslip</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Staff Name</span>
                  <span className="text-sm font-medium text-gray-900">{selectedPayslip.staff?.name || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Period</span>
                  <span className="text-sm text-gray-900">{new Date(selectedPayslip.periodStart).toLocaleDateString()} - {new Date(selectedPayslip.periodEnd).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Basic Pay</span>
                  <span className="text-sm text-gray-900">RM{Number(selectedPayslip.basicPay).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Deductions</span>
                  <span className="text-sm text-red-600">RM{Number(selectedPayslip.totalDeductions).toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="text-sm font-medium text-gray-900">Net Pay</span>
                  <span className="text-lg font-bold text-gray-900">RM{Number(selectedPayslip.nettPay).toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t">
              <button onClick={() => setShowPayslipModal(false)} className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">Close</button>
              <button 
                onClick={() => { window.print(); }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

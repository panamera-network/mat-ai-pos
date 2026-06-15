import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi, useStaffCache } from '@mat-ai/backoffice';
import { ArrowLeft, RefreshCw, Users, Clock, DollarSign } from 'lucide-react';

type StaffTab = 'staff' | 'attendance' | 'payroll';

export function StaffPage() {
  const navigate = useNavigate();
  const { get } = useApi();
  const cache = useStaffCache();

  const cached = cache.getData();
  const [activeTab, setActiveTab] = useState<StaffTab>('staff');
  const [staffList, setStaffList] = useState<any[]>(cached?.staffList || []);
  const [timecards, setTimecards] = useState<any[]>(cached?.timecards || []);
  const [payrolls, setPayrolls] = useState<any[]>(cached?.payrolls || []);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(
    cache.timestamp > 0 ? new Date(cache.timestamp) : null
  );

  const fetchData = useCallback(async (isManual = false) => {
    if (!isManual) setLoading(true);
    try {
      const [staffRes, timeRes, payrollRes] = await Promise.all([
        get('/staff'),
        get('/timecard'),
        get('/payroll'),
      ]);

      const newStaff = (staffRes.ok ? staffRes.data : []) as any[];
      const newTimecards = (timeRes.ok ? timeRes.data : []) as any[];
      const newPayrolls = (payrollRes.ok ? payrollRes.data : []) as any[];

      setStaffList(newStaff);
      setTimecards(newTimecards);
      setPayrolls(newPayrolls);
      cache.setData(newStaff, newTimecards, newPayrolls);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Staff fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [get, cache]);

  useEffect(() => {
    if (cache.isExpired()) {
      fetchData();
    }
  }, [fetchData, cache]);

  const timeAgo = () => {
    if (!lastRefresh) return 'Never';
    const diff = Math.floor((Date.now() - lastRefresh.getTime()) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff} min ago`;
    return lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="font-bold text-gray-900">Staff Management</h1>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-lg text-xs text-gray-600 hover:bg-gray-200 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Loading...' : timeAgo()}
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Tabs */}
        <div className="flex gap-2">
          {(['staff', 'attendance', 'payroll'] as StaffTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeTab === t ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {t === 'staff' && <Users className="w-4 h-4" />}
              {t === 'attendance' && <Clock className="w-4 h-4" />}
              {t === 'payroll' && <DollarSign className="w-4 h-4" />}
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Staff Tab */}
        {activeTab === 'staff' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Name</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Role</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Type</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Rate</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {staffList.map((staff) => (
                  <tr key={staff.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{staff.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{staff.role}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{staff.employmentType?.replace('_', ' ')}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {staff.hourlyRate ? `RM${staff.hourlyRate}/hr` : staff.monthlySalary ? `RM${staff.monthlySalary}/mo` : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium ${staff.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {staff.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
                {staffList.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                      <Users className="w-8 h-8 mx-auto mb-2" />
                      <p>No staff data</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Staff</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Clock In</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Clock Out</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Hours</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {timecards.map((tc) => (
                  <tr key={tc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{tc.staff?.name || 'Unknown'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(tc.clockIn).toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{tc.clockOut ? new Date(tc.clockOut).toLocaleString() : '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{tc.totalHours || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium ${tc.clockOut ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-700'}`}>
                        {tc.clockOut ? 'Completed' : 'On Duty'}
                      </span>
                    </td>
                  </tr>
                ))}
                {timecards.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                      <Clock className="w-8 h-8 mx-auto mb-2" />
                      <p>No attendance records</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Payroll Tab */}
        {activeTab === 'payroll' && (
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
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(pr.periodStart).toLocaleDateString()} - {new Date(pr.periodEnd).toLocaleDateString()}</td>
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
        )}
      </div>
    </div>
  );
}

export default StaffPage;
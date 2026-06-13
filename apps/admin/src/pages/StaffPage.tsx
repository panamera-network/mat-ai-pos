// app/admin/src/pages/StaffPage.tsx
import { useEffect, useState, useCallback } from 'react';
import { useApi } from '../hooks/useApi';
import { useStaffCache } from '../stores/staffCache';
import { RefreshCw } from 'lucide-react';

type StaffTab = 'staff' | 'attendance' | 'payroll';

export function StaffPage() {
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

      const newStaff = staffRes.ok ? await staffRes.json() : [];
      const newTimecards = timeRes.ok ? await timeRes.json() : [];
      const newPayrolls = payrollRes.ok ? await payrollRes.json() : [];

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
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Staff Management</h1>
        <button
          onClick={() => fetchData(true)}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-lg text-xs text-gray-600 hover:bg-gray-200 disabled:opacity-50 transition-colors w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Loading...' : timeAgo()}
        </button>
      </div>

      <div className="flex gap-2">
        {(['staff', 'attendance', 'payroll'] as StaffTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`flex-1 sm:flex-none sm:px-6 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === t ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {loading && staffList.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin" />
          <p>Loading staff data...</p>
        </div>
      )}

      {activeTab === 'staff' && (
        <>
          <div className="md:hidden space-y-2">
            {staffList.map((staff) => (
              <div key={staff.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{staff.name}</p>
                    <p className="text-xs text-gray-500">{staff.role} • {staff.employmentType?.replace('_', ' ')}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${staff.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {staff.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'attendance' && (
        <>
          <div className="md:hidden space-y-2">
            {timecards.map((tc) => (
              <div key={tc.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm text-gray-900">{tc.staff?.name || 'Unknown'}</p>
                    <p className="text-xs text-gray-500">{new Date(tc.clockIn).toLocaleString()}</p>
                  </div>
                  {tc.clockOut ? <span className="text-xs text-green-600 font-medium">Out</span> : <span className="text-xs text-blue-600 font-medium">On Duty</span>}
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'payroll' && (
        <>
          <div className="md:hidden space-y-2">
            {payrolls.map((pr) => (
              <div key={pr.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm text-gray-900">{pr.staff?.name || 'Unknown'}</p>
                    <p className="text-xs text-gray-500">{new Date(pr.periodStart).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">RM{Number(pr.nettPay).toFixed(2)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded ${pr.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{pr.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
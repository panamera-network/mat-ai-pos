import { useEffect, useState, useCallback } from 'react';
import { useApi, useStaffCache } from '@mat-ai/backoffice';
import {
  Plus, Search, RefreshCw, Users, Clock, DollarSign,
  Edit3, Trash2, X, Check, Filter
} from 'lucide-react';

type StaffTab = 'staff' | 'attendance' | 'payroll';

interface StaffFormData {
  name: string;
  email: string;
  role: string;
  employmentType: string;
  hourlyRate: string;
  monthlySalary: string;
  phone: string;
}

export const StaffPage: React.FC = () => {
  const { get, post, patch, del } = useApi();
  const cache = useStaffCache();

  const cached = cache.getData();
  const [activeTab, setActiveTab] = useState<StaffTab>('staff');
  const [staffList, setStaffList] = useState<any[]>(cached?.staffList || []);
  const [timecards, setTimecards] = useState<any[]>(cached?.timecards || []);
  const [payrolls, setPayrolls] = useState<any[]>(cached?.payrolls || []);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [formData, setFormData] = useState<StaffFormData>({
    name: '', email: '', role: 'CASHIER', employmentType: 'FULL_TIME',
    hourlyRate: '', monthlySalary: '', phone: ''
  });
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

  const handleSaveStaff = async () => {
    const payload = {
      ...formData,
      hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : null,
      monthlySalary: formData.monthlySalary ? parseFloat(formData.monthlySalary) : null,
    };

    if (editingStaff) {
      await patch(`/staff/${editingStaff.id}`, payload);
    } else {
      await post('/staff', payload);
    }
    setShowModal(false);
    setEditingStaff(null);
    setFormData({ name: '', email: '', role: 'CASHIER', employmentType: 'FULL_TIME', hourlyRate: '', monthlySalary: '', phone: '' });
    fetchData(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this staff?')) return;
    await del(`/staff/${id}`);
    fetchData(true);
  };

  const openEdit = (staff: any) => {
    setEditingStaff(staff);
    setFormData({
      name: staff.name || '',
      email: staff.email || '',
      role: staff.role || 'CASHIER',
      employmentType: staff.employmentType || 'FULL_TIME',
      hourlyRate: staff.hourlyRate?.toString() || '',
      monthlySalary: staff.monthlySalary?.toString() || '',
      phone: staff.phone || '',
    });
    setShowModal(true);
  };

  const filteredStaff = staffList.filter(s =>
    s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage staff, attendance, and payroll</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchData(true)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Loading...' : timeAgo()}
          </button>
          <button
            onClick={() => { setEditingStaff(null); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Staff
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white border rounded-lg p-1 w-fit">
        {(['staff', 'attendance', 'payroll'] as StaffTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === t ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t === 'staff' && <Users className="w-4 h-4" />}
            {t === 'attendance' && <Clock className="w-4 h-4" />}
            {t === 'payroll' && <DollarSign className="w-4 h-4" />}
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Search */}
      {activeTab === 'staff' && (
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search staff by name, email, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      )}

      {/* Staff Tab */}
      {activeTab === 'staff' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Name</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Email</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Role</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Type</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Rate</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStaff.map((staff) => (
                <tr key={staff.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-700">{staff.name?.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{staff.name}</p>
                        <p className="text-xs text-gray-500">{staff.phone || '-'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{staff.email || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium ${
                      staff.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                      staff.role === 'MANAGER' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {staff.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{staff.employmentType?.replace('_', ' ')}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {staff.hourlyRate ? `RM${staff.hourlyRate}/hr` : staff.monthlySalary ? `RM${staff.monthlySalary}/mo` : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium ${staff.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {staff.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(staff)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-600">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(staff.id)} className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredStaff.length === 0 && !loading && (
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
      )}

      {/* Attendance Tab */}
      {activeTab === 'attendance' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
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
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-semibold text-gray-900">{editingStaff ? 'Edit Staff' : 'Add New Staff'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">
                    <option value="CASHIER">Cashier</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type</label>
                  <select value={formData.employmentType} onChange={e => setFormData({...formData, employmentType: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="CONTRACT">Contract</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate (RM)</label>
                  <input type="number" value={formData.hourlyRate} onChange={e => setFormData({...formData, hourlyRate: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Salary (RM)</label>
                  <input type="number" value={formData.monthlySalary} onChange={e => setFormData({...formData, monthlySalary: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSaveStaff} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import { useEffect, useState, useCallback } from 'react';
import { useApi, useStaffCache } from '@mat-ai/backoffice';
import type { Staff, Department, PermissionDefinition } from '@mat-ai/types';
import { DEFAULT_PERMISSIONS } from '@mat-ai/types';
import {
  Plus, Search, RefreshCw, Users, Clock, Shield,
  Edit3, Trash2, X, Check, Building2, Crown
} from 'lucide-react';

// ============================================================
// LOCAL TYPE — avoid conflict with React.Role (aria)
// ============================================================
interface StaffRole {
  id: string;
  name: string;
  permissions: Record<string, boolean>;
  isActive: boolean;
  isSystem: boolean;
  staffCount?: number;
}

type StaffTab = 'staff' | 'attendance' | 'roles' | 'departments';

interface StaffFormData {
  name: string;
  email: string;
  password: string;
  pin: string;
  phone: string;
  roleId: string;
  isSuperAdmin: boolean;
  departmentId: string;
  employmentType: string;
  hourlyRate: string;
  monthlySalary: string;
  isActive: boolean;
}

const EMPLOYMENT_TYPES = [
  { value: 'HOURLY_PART_TIME', label: 'Hourly Part Time' },
  { value: 'MONTHLY_SALARIED', label: 'Monthly Salaried' },
] as const;

// ============================================================
// ROLE COLOR MAP
// ============================================================
const ROLE_COLORS: Record<string, string> = {
  'ADMIN': 'bg-indigo-100 text-indigo-700',
  'MANAGER': 'bg-blue-100 text-blue-700',
  'CASHIER': 'bg-gray-100 text-gray-700',
  'KITCHEN': 'bg-orange-100 text-orange-700',
  'SUPER_ADMIN': 'bg-purple-100 text-purple-700',
};

// ============================================================
// HELPER: Get role name string from Staff (handles both string and object)
// ============================================================
const getRoleName = (staff: Staff): string => {
  if (!staff.role) return '';
  if (typeof staff.role === 'string') return staff.role;
  // If it's an object with name property
  if (typeof staff.role === 'object' && staff.role !== null && 'name' in staff.role) {
    return (staff.role as any).name || '';
  }
  return '';
};

export const StaffPage: React.FC = () => {
  const { get, post, patch, del } = useApi();
  const cache = useStaffCache();

  const cached = cache.getData();
  const [activeTab, setActiveTab] = useState<StaffTab>('staff');
  const [staffList, setStaffList] = useState<Staff[]>(cached?.staffList || []);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<StaffRole[]>([]);
  const [timecards, setTimecards] = useState<any[]>(cached?.timecards || []);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [formData, setFormData] = useState<StaffFormData>({
    name: '', email: '', password: '', pin: '', phone: '',
    roleId: '', isSuperAdmin: false, departmentId: '',
    employmentType: 'HOURLY_PART_TIME', hourlyRate: '', monthlySalary: '', isActive: true
  });
  const [lastRefresh, setLastRefresh] = useState<Date | null>(
    cache.timestamp > 0 ? new Date(cache.timestamp) : null
  );

  // Fetch roles (dynamic)
  const fetchRoles = useCallback(async () => {
    try {
      const res = await get('/roles');
      if (res.ok) setRoles((res.data as StaffRole[]) || []);
    } catch (err) {
      console.error('Roles fetch error:', err);
    }
  }, [get]);

  const fetchData = useCallback(async (isManual = false) => {
    if (!isManual) setLoading(true);
    try {
      const [staffRes, timeRes, deptRes] = await Promise.all([
        get('/staff'),
        get('/timecard'),
        get('/departments'),
      ]);

      const newStaff = (staffRes.ok ? staffRes.data : []) as Staff[];
      const newTimecards = (timeRes.ok ? timeRes.data : []) as any[];
      const newDepts = (deptRes.ok ? deptRes.data : []) as Department[];

      setStaffList(newStaff);
      setTimecards(newTimecards);
      setDepartments(newDepts);
      cache.setData(newStaff, newTimecards, []);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Staff fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [get, cache]);

  useEffect(() => {
    fetchData();
    fetchRoles();
  }, [fetchData, fetchRoles]);

  const handleSaveStaff = async () => {
    const payload = {
      ...formData,
      hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : null,
      monthlySalary: formData.monthlySalary ? parseFloat(formData.monthlySalary) : null,
      departmentId: formData.departmentId || null,
      roleId: formData.roleId || null,
    };

    if (editingStaff) {
      await patch(`/staff/${editingStaff.id}`, payload);
    } else {
      await post('/staff', payload);
    }
    setShowModal(false);
    setEditingStaff(null);
    resetForm();
    fetchData(true);
  };

  const resetForm = () => {
    setFormData({
      name: '', email: '', password: '', pin: '', phone: '',
      roleId: '', isSuperAdmin: false, departmentId: '',
      employmentType: 'HOURLY_PART_TIME', hourlyRate: '', monthlySalary: '', isActive: true
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this staff?')) return;
    await del(`/staff/${id}`);
    fetchData(true);
  };

  const openEdit = (staff: Staff) => {
    setEditingStaff(staff);
    setFormData({
      name: staff.name || '',
      email: staff.email || '',
      password: '',
      pin: staff.pin || '',
      phone: staff.phone || '',
      roleId: staff.roleId || '',
      isSuperAdmin: staff.isSuperAdmin || false,
      departmentId: staff.departmentId || '',
      employmentType: staff.employmentType || 'HOURLY_PART_TIME',
      hourlyRate: staff.hourlyRate?.toString() || '',
      monthlySalary: staff.monthlySalary?.toString() || '',
      isActive: staff.isActive ?? true,
    });
    setShowModal(true);
  };

  // ============================================================
  // DYNAMIC ROLE BADGE
  // ============================================================
  const getRoleBadge = (staff: Staff) => {
    const role = roles.find(r => r.id === staff.roleId);

    if (staff.isSuperAdmin) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-purple-100 text-purple-700 border border-purple-300">
          <Crown className="w-3 h-3" />
          SUPER ADMIN
        </span>
      );
    }

    const colorClass = ROLE_COLORS[role?.name || ''] || 'bg-gray-100 text-gray-700';
    const displayName = role?.name || getRoleName(staff) || 'Unknown';

    return (
      <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium ${colorClass}`}>
        {displayName}
      </span>
    );
  };

  // ============================================================
  // FILTER — safe string comparison
  // ============================================================
  const filteredStaff = staffList.filter(s => {
    const roleName = getRoleName(s);
    return (
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      roleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.department?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const timeAgo = () => {
    if (!lastRefresh) return 'Never';
    const diff = Math.floor((Date.now() - lastRefresh.getTime()) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff} min ago`;
    return lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const tabs = [
    { id: 'staff' as StaffTab, label: 'Staff', icon: Users },
    { id: 'attendance' as StaffTab, label: 'Attendance', icon: Clock },
    { id: 'roles' as StaffTab, label: 'Roles', icon: Shield },
    { id: 'departments' as StaffTab, label: 'Departments', icon: Building2 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage staff, attendance, roles and departments</p>
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
          {activeTab === 'staff' && (
            <button
              onClick={() => { setEditingStaff(null); resetForm(); setShowModal(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Add Staff
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white border rounded-lg p-1 w-fit">
        {tabs.map((t) => (
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

      {/* Search - Staff tab only */}
      {activeTab === 'staff' && (
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search staff by name, email, role, phone..."
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
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Department</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Type</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Rate</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Phone</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStaff.map((staff) => (
                <tr key={staff.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                        staff.isSuperAdmin ? 'bg-purple-100' : 'bg-blue-100'
                      }`}>
                        <span className={`text-sm font-bold ${
                          staff.isSuperAdmin ? 'text-purple-700' : 'text-blue-700'
                        }`}>{staff.name?.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                          {staff.name}
                          {staff.isSuperAdmin && <Crown className="w-3 h-3 text-purple-500" />}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{staff.email || '-'}</td>
                  <td className="px-6 py-4">{getRoleBadge(staff)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{staff.department?.name || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {staff.employmentType?.replace('_', ' ')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {staff.hourlyRate ? `RM${staff.hourlyRate}/hr` : staff.monthlySalary ? `RM${staff.monthlySalary}/mo` : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{staff.phone || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium ${
                      staff.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
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
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-400">
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
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Department</th>
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
                  <td className="px-6 py-4 text-sm text-gray-500">{tc.staff?.department?.name || '-'}</td>
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
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    <Clock className="w-8 h-8 mx-auto mb-2" />
                    <p>No attendance records</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Roles Tab - DYNAMIC from API */}
      {activeTab === 'roles' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Role</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Staff Count</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Permissions</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {roles.map((role) => {
                const count = staffList.filter(s => s.roleId === role.id).length;
                const permissionCount = Object.values(role.permissions || {}).filter(Boolean).length;
                const totalPermissions = Object.keys(role.permissions || {}).length;

                return (
                  <tr key={role.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-lg text-sm font-medium ${
                        ROLE_COLORS[role.name] || 'bg-gray-100 text-gray-700'
                      }`}>
                        {role.name === 'SUPER_ADMIN' ? '👑 SUPER ADMIN' : role.name}
                      </span>
                      {role.isSystem && (
                        <span className="ml-2 text-xs text-gray-400">(System)</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{count} staff</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {permissionCount} / {totalPermissions} permissions
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium ${
                        role.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {role.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {roles.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                    <Shield className="w-8 h-8 mx-auto mb-2" />
                    <p>No roles found. Run seed to create default roles.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Departments Tab */}
      {activeTab === 'departments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => (
            <div key={dept.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{dept.name}</p>
                    <p className="text-xs text-gray-500">{staffList.filter(s => s.departmentId === dept.id).length} staff</p>
                  </div>
                </div>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs ${
                  dept.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {dept.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}
          {departments.length === 0 && !loading && (
            <div className="col-span-3 text-center py-12 text-gray-400">
              <Building2 className="w-8 h-8 mx-auto mb-2" />
              <p>No departments found</p>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Staff Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-semibold text-gray-900">{editingStaff ? 'Edit Staff' : 'Add New Staff'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Name & Email */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>

              {/* PIN & Password */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PIN (4 digits) *</label>
                  <input type="password" maxLength={4} value={formData.pin} onChange={e => setFormData({...formData, pin: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder={editingStaff ? 'Leave blank to keep current' : ''} />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="+60 12-345 6789" />
              </div>

              {/* Role & Super Admin */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                  <select 
                    value={formData.roleId || ''} 
                    onChange={e => setFormData({...formData, roleId: e.target.value})} 
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="">Select Role</option>
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-purple-50 w-full">
                    <input
                      type="checkbox"
                      checked={formData.isSuperAdmin}
                      onChange={e => setFormData({...formData, isSuperAdmin: e.target.checked})}
                      className="w-4 h-4 rounded border-gray-300 text-purple-600"
                    />
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium text-purple-700">Super Admin</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Department & Employment Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select value={formData.departmentId} onChange={e => setFormData({...formData, departmentId: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">
                    <option value="">No Department</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type *</label>
                  <select value={formData.employmentType} onChange={e => setFormData({...formData, employmentType: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">
                    {EMPLOYMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Hourly Rate & Monthly Salary */}
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

              {/* Is Active */}
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={e => setFormData({...formData, isActive: e.target.checked})}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">Active staff</span>
                </label>
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
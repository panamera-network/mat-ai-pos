import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Store, MapPin, Phone, Users, TrendingUp,
  Edit3, Trash2, MoreHorizontal, X, ChevronDown
} from 'lucide-react';
import { Outlet } from '@mat-ai/types';


type ModalType = 'add' | 'edit' | 'delete' | null;

export const OutletManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [outlets, setOutlets] = useState<Outlet[]>([
    { id: '1', name: 'MAT.ai HQ', address: 'Kuala Lumpur', phone: '+60 3-1234 5678', staffCount: 12, monthlyRevenue: 45000, status: 'active' },
    { id: '2', name: 'MAT.ai Branch 1', address: 'Petaling Jaya', phone: '+60 3-8765 4321', staffCount: 8, monthlyRevenue: 28000, status: 'active' },
  ]);

  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<Outlet>>({
    name: '',
    address: '',
    phone: '',
    staffCount: 0,
    monthlyRevenue: 0,
    status: 'active',
  });

  const openAddModal = () => {
    setFormData({ name: '', address: '', phone: '', staffCount: 0, monthlyRevenue: 0, status: 'active' });
    setSelectedOutlet(null);
    setModalType('add');
  };

  const openEditModal = (outlet: Outlet) => {
    setFormData({ ...outlet });
    setSelectedOutlet(outlet);
    setModalType('edit');
    setDropdownOpen(null);
  };

  const openDeleteModal = (outlet: Outlet) => {
    setSelectedOutlet(outlet);
    setModalType('delete');
    setDropdownOpen(null);
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedOutlet(null);
    setDropdownOpen(null);
  };

  const handleSave = () => {
    if (!formData.name || !formData.address) return;

    if (modalType === 'add') {
      const newOutlet: Outlet = {
        id: Date.now().toString(),
        name: formData.name,
        address: formData.address,
        phone: formData.phone || '',
        staffCount: formData.staffCount || 0,
        monthlyRevenue: formData.monthlyRevenue || 0,
        status: formData.status || 'active',
      };
      setOutlets([...outlets, newOutlet]);
    } else if (modalType === 'edit' && selectedOutlet) {
      setOutlets(outlets.map(o => o.id === selectedOutlet.id ? { ...o, ...formData } as Outlet : o));
    }
    closeModal();
  };

  const handleDelete = () => {
    if (selectedOutlet) {
      setOutlets(outlets.filter(o => o.id !== selectedOutlet.id));
    }
    closeModal();
  };

  const viewReports = (outletId: string) => {
    navigate(`/sales?outlet=${outletId}`);
    setDropdownOpen(null);
  };

  const toggleDropdown = (outletId: string) => {
    setDropdownOpen(dropdownOpen === outletId ? null : outletId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Outlet Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage multiple restaurant locations</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Outlet
        </button>
      </div>

      {/* Outlets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {outlets.map((outlet) => (
          <div key={outlet.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow relative">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Store className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{outlet.name}</h3>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                    outlet.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {outlet.status}
                  </span>
                </div>
              </div>
              <div className="relative">
                <button 
                  onClick={() => toggleDropdown(outlet.id)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <MoreHorizontal className="w-4 h-4 text-gray-400" />
                </button>
                {dropdownOpen === outlet.id && (
                  <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1">
                    <button
                      onClick={() => openEditModal(outlet)}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => viewReports(outlet.id)}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <TrendingUp className="w-4 h-4" />
                      Reports
                    </button>
                    <div className="border-t border-gray-100 my-1" />
                    <button
                      onClick={() => openDeleteModal(outlet)}
                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <MapPin className="w-4 h-4" />
                {outlet.address}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Phone className="w-4 h-4" />
                {outlet.phone}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Staff</p>
                <p className="text-lg font-bold text-gray-900">{outlet.staffCount}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Monthly Revenue</p>
                <p className="text-lg font-bold text-gray-900">RM{outlet.monthlyRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal — Add / Edit */}
      {(modalType === 'add' || modalType === 'edit') && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                {modalType === 'add' ? 'Add Outlet' : 'Edit Outlet'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Outlet Name</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. MAT.ai Branch 2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Shah Alam"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="+60 3-xxxx xxxx"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Staff Count</label>
                  <input
                    type="number"
                    value={formData.staffCount || 0}
                    onChange={(e) => setFormData({ ...formData, staffCount: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Revenue</label>
                  <input
                    type="number"
                    value={formData.monthlyRevenue || 0}
                    onChange={(e) => setFormData({ ...formData, monthlyRevenue: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={closeModal}
                className="flex-1 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                {modalType === 'add' ? 'Add Outlet' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal — Delete Confirm */}
      {modalType === 'delete' && selectedOutlet && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Delete Outlet?</h2>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete <strong>{selectedOutlet.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close dropdown */}
      {dropdownOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(null)} />
      )}
    </div>
  );
};
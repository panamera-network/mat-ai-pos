import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, Calendar, Percent, Tag } from 'lucide-react';
import { Modal } from '@mat-ai/ui';
import { Promotion, PromotionType, PromotionTarget, CreatePromotionPayload } from '@mat-ai/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const OUTLET_ID = import.meta.env.VITE_OUTLET_ID || 'default-outlet';

const PROMO_TYPES: { value: PromotionType; label: string; icon: React.ReactNode }[] = [
  { value: 'BANNER', label: 'Banner', icon: <Tag className="w-4 h-4" /> },
  { value: 'POPUP', label: 'Popup', icon: <Eye className="w-4 h-4" /> },
  { value: 'DISCOUNT_PERCENT', label: '% Discount', icon: <Percent className="w-4 h-4" /> },
  { value: 'DISCOUNT_FIXED', label: 'RM Discount', icon: <Tag className="w-4 h-4" /> },
  { value: 'FREE_ITEM', label: 'Free Item', icon: <Tag className="w-4 h-4" /> },
  { value: 'BUNDLE', label: 'Bundle', icon: <Tag className="w-4 h-4" /> },
];

const TARGETS: { value: PromotionTarget; label: string }[] = [
  { value: 'ALL', label: 'All Customers' },
  { value: 'NEW_CUSTOMER', label: 'New Customers' },
  { value: 'RETURNING', label: 'Returning' },
  { value: 'VIP', label: 'VIP Only' },
];

export const PromotionsPage: React.FC = () => {
  console.log("🔥 PROMOTIONS PAGE RENDERED");
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [formData, setFormData] = useState<CreatePromotionPayload & { id?: string }>({
    title: '',
    description: '',
    type: 'BANNER',
    discount: undefined,
    minSpend: undefined,
    startDate: '',
    endDate: '',
    target: 'ALL',
    priority: 0,
    isActive: true,
    outletId: OUTLET_ID,
  });

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    const res = await fetch(`${API_URL}/promotions?outletId=${OUTLET_ID}`);
    if (res.ok) setPromotions(await res.json());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      outletId: OUTLET_ID,
    };

    const url = editingPromo
      ? `${API_URL}/promotions/${editingPromo.id}`
      : `${API_URL}/promotions`;
    const method = editingPromo ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setIsModalOpen(false);
      resetForm();
      fetchPromotions();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this promotion?')) return;
    await fetch(`${API_URL}/promotions/${id}`, { method: 'DELETE' });
    fetchPromotions();
  };

  const handleToggle = async (promo: Promotion) => {
    await fetch(`${API_URL}/promotions/${promo.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !promo.isActive }),
    });
    fetchPromotions();
  };

  const openEdit = (promo: Promotion) => {
    setEditingPromo(promo);
    setFormData({
      title: promo.title,
      description: promo.description || '',
      type: promo.type,
      discount: promo.discount,
      minSpend: promo.minSpend,
      startDate: promo.startDate.slice(0, 16),
      endDate: promo.endDate.slice(0, 16),
      target: promo.target,
      priority: promo.priority,
      isActive: promo.isActive,
      outletId: OUTLET_ID,
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingPromo(null);
    setFormData({
      title: '',
      description: '',
      type: 'BANNER',
      discount: undefined,
      minSpend: undefined,
      startDate: '',
      endDate: '',
      target: 'ALL',
      priority: 0,
      isActive: true,
      outletId: OUTLET_ID,
    });
  };

  const isActiveNow = (promo: Promotion) => {
    const now = new Date();
    return promo.isActive && new Date(promo.startDate) <= now && new Date(promo.endDate) >= now;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">QR Menu Promotions</h1>
          <p className="text-gray-500 text-sm mt-1">Manage banners, discounts & campaigns</p>
        </div>
        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Promotion
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-gray-100">
          <p className="text-gray-500 text-sm">Active Now</p>
          <p className="text-2xl font-bold text-green-600">
            {promotions.filter(isActiveNow).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100">
          <p className="text-gray-500 text-sm">Total Promotions</p>
          <p className="text-2xl font-bold text-gray-800">{promotions.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100">
          <p className="text-gray-500 text-sm">Upcoming</p>
          <p className="text-2xl font-bold text-orange-500">
            {promotions.filter((p) => new Date(p.startDate) > new Date()).length}
          </p>
        </div>
      </div>

      {/* Promotions List */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Promotion</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Period</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Target</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {promotions.map((promo) => (
                <tr key={promo.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-800">{promo.title}</p>
                      {promo.description && (
                        <p className="text-xs text-gray-500">{promo.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-700 text-xs rounded-full">
                      {PROMO_TYPES.find((t) => t.value === promo.type)?.icon}
                      {PROMO_TYPES.find((t) => t.value === promo.type)?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(promo.startDate).toLocaleDateString()} - {new Date(promo.endDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      {TARGETS.find((t) => t.value === promo.target)?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggle(promo)}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                        isActiveNow(promo)
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {isActiveNow(promo) ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      {isActiveNow(promo) ? 'Live' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(promo)}
                        className="p-1.5 hover:bg-orange-50 text-orange-500 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(promo.id)}
                        className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingPromo ? 'Edit Promotion' : 'New Promotion'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as PromotionType })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
              >
                {PROMO_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target</label>
              <select
                value={formData.target}
                onChange={(e) => setFormData({ ...formData, target: e.target.value as PromotionTarget })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
              >
                {TARGETS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          {(formData.type === 'DISCOUNT_PERCENT' || formData.type === 'DISCOUNT_FIXED') && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {formData.type === 'DISCOUNT_PERCENT' ? 'Discount %' : 'Discount RM'}
                </label>
                <input
                  type="number"
                  value={formData.discount || ''}
                  onChange={(e) => setFormData({ ...formData, discount: e.target.value ? parseFloat(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Spend (RM)</label>
                <input
                  type="number"
                  value={formData.minSpend || ''}
                  onChange={(e) => setFormData({ ...formData, minSpend: e.target.value ? parseFloat(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                  step="0.01"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority (0-10)</label>
              <input
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                min="0"
                max="10"
              />
            </div>
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              {editingPromo ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

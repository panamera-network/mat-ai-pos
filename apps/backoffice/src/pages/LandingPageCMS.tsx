// apps/backoffice/src/pages/LandingPageCMS.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, GripVertical, Sparkles, Layout, Type, Save } from 'lucide-react';
import { Modal } from '@mat-ai/ui';
import { LandingPageContent } from '@mat-ai/types';
import { useApi } from '../hooks/useApi';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const OUTLET_ID = import.meta.env.VITE_OUTLET_ID || 'default-outlet';

const LUCIDE_ICONS = [
  'Gift', 'Sparkles', 'Star', 'Heart', 'Zap', 'TrendingUp', 'Award', 'Crown',
  'UtensilsCrossed', 'Coffee', 'Pizza', 'IceCream', 'Cake', 'Beer', 'Wine',
  'Truck', 'Clock', 'Calendar', 'Phone', 'MapPin', 'Home', 'User', 'Users',
  'Percent', 'Tag', 'ShoppingBag', 'CreditCard', 'Wallet', 'Banknote',
];

const GRADIENTS = [
  'from-orange-500 via-red-500 to-pink-600',
  'from-blue-500 via-purple-500 to-pink-500',
  'from-green-400 via-emerald-500 to-teal-600',
  'from-amber-400 via-orange-500 to-red-500',
  'from-indigo-500 via-purple-500 to-pink-500',
  'from-rose-400 via-red-500 to-orange-500',
];

export const LandingPageCMS: React.FC = () => {
  const [contents, setContents] = useState<LandingPageContent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<LandingPageContent | null>(null);
  const [activeSection, setActiveSection] = useState('hero');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    section: 'hero',
    key: '',
    content: {} as Record<string, any>,
    sortOrder: 0,
    isActive: true,
  });

  const { fetchWithAuth } = useApi();

  useEffect(() => { fetchContents(); }, []);

  const fetchContents = async () => {
  setLoading(true);
  try {
    const res = await fetchWithAuth(`${API_URL}/landing-page/public?outletId=${OUTLET_ID}`);
    if (res.ok) {
      const data = await res.json();
      // Handle both array and object responses
      const contentsArray = Array.isArray(data) ? data : data.contents ? data.contents : [];
      setContents(contentsArray);
    }
  } catch (err) {
    console.error('Failed to fetch:', err);
  } finally {
    setLoading(false);
  }
};

  const handleSeed = async () => {
    if (!confirm('Seed default content?')) return;
    try {
      const res = await fetchWithAuth(`${API_URL}/landing-page/seed?outletId=${OUTLET_ID}`, {
        method: 'POST',
      });
      if (res.ok) fetchContents();
    } catch (err) {
      console.error('Seed failed:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData, outletId: OUTLET_ID };
    const url = editingContent
      ? `${API_URL}/landing-page/${editingContent.id}`
      : `${API_URL}/landing-page`;
    const method = editingContent ? 'PATCH' : 'POST';

    try {
      const res = await fetchWithAuth(url, {
        method,
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setIsModalOpen(false);
        resetForm();
        fetchContents();
      } else {
        console.error('Save failed:', res.status, res.statusText);
      }
    } catch (err) {
      console.error('Save failed:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete?')) return;
    try {
      const res = await fetchWithAuth(`${API_URL}/landing-page/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) fetchContents();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleToggle = async (content: LandingPageContent) => {
    try {
      const res = await fetchWithAuth(`${API_URL}/landing-page/${content.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !content.isActive }),
      });
      if (res.ok) fetchContents();
    } catch (err) {
      console.error('Toggle failed:', err);
    }
  };

  const openEdit = (content: LandingPageContent) => {
    setEditingContent(content);
    setFormData({
      section: content.section,
      key: content.key,
      content: content.content,
      sortOrder: content.sortOrder,
      isActive: content.isActive,
    });
    setActiveSection(content.section);
    setIsModalOpen(true);
  };

  const openCreate = (section: string) => {
    setEditingContent(null);
    setActiveSection(section);
    setFormData({
      section,
      key: '',
      content: getDefaultContent(section),
      sortOrder: 0,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const getDefaultContent = (section: string): Record<string, any> => {
    switch (section) {
      case 'hero':
        return {
          title: '',
          tagline: '',
          subtitle: 'Welcome to',
          ctaText: 'Browse Menu',
          gradient: GRADIENTS[0],
        };
      case 'features':
        return { icon: 'Gift', title: '', description: '' };
      case 'footer':
        return { text: 'Powered by MAT.ai', showLogo: true };
      default:
        return {};
    }
  };

  const resetForm = () => {
    setEditingContent(null);
    setFormData({
      section: 'hero',
      key: '',
      content: {},
      sortOrder: 0,
      isActive: true,
    });
  };

  const updateContentField = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      content: { ...prev.content, [field]: value },
    }));
  };

  const sections = ['hero', 'features', 'footer'];
  const sectionContents = contents.filter((c) => c.section === activeSection);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Landing Page CMS</h1>
          <p className="text-gray-500 text-sm mt-1">Manage QR Menu landing page content</p>
        </div>
        <button
          onClick={handleSeed}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          Seed Defaults
        </button>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 mb-6">
        {sections.map((section) => (
          <button
            key={section}
            onClick={() => setActiveSection(section)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg capitalize transition-colors ${
              activeSection === section
                ? 'bg-orange-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {section === 'hero' && <Sparkles className="w-5 h-5" />}
            {section === 'features' && <Layout className="w-5 h-5" />}
            {section === 'footer' && <Type className="w-5 h-5" />}
            {section}
          </button>
        ))}
      </div>

      {/* Content List */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800 capitalize">{activeSection} Content</h2>
          <button
            onClick={() => openCreate(activeSection)}
            className="flex items-center gap-2 px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-3" />
            Loading...
          </div>
        ) : sectionContents.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Layout className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No content yet. Click "Add" to create.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {sectionContents
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((content) => (
                <div
                  key={content.id}
                  className={`flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors ${
                    !content.isActive ? 'opacity-50' : ''
                  }`}
                >
                  <GripVertical className="w-5 h-5 text-gray-300 cursor-move" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">{content.key}</span>
                      {!content.isActive && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate mt-1">
                      {JSON.stringify(content.content).slice(0, 80)}...
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggle(content)}
                      className={`p-2 rounded-lg transition-colors ${
                        content.isActive
                          ? 'text-green-600 hover:bg-green-50'
                          : 'text-gray-400 hover:bg-gray-100'
                      }`}
                    >
                      {content.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => openEdit(content)}
                      className="p-2 hover:bg-orange-50 text-orange-500 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(content.id)}
                      className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Mobile Preview */}
      {sectionContents.length > 0 && (
        <div className="mt-6 bg-white rounded-xl border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Mobile Preview</h3>
          <div className="max-w-sm mx-auto border border-gray-200 rounded-2xl overflow-hidden bg-gray-50">
            {activeSection === 'hero' && sectionContents[0] && (
              <div
                className={`p-6 bg-gradient-to-br ${
                  sectionContents[0].content.gradient || GRADIENTS[0]
                } text-white text-center`}
              >
                <p className="text-sm opacity-80">{sectionContents[0].content.subtitle}</p>
                <h2 className="text-2xl font-bold mt-2">{sectionContents[0].content.title}</h2>
                <p className="text-sm opacity-90 mt-1">{sectionContents[0].content.tagline}</p>
                <button className="mt-4 bg-white text-orange-600 px-4 py-2 rounded-full text-sm font-semibold">
                  {sectionContents[0].content.ctaText}
                </button>
              </div>
            )}
            {activeSection === 'features' && (
              <div className="p-4 grid grid-cols-3 gap-2">
                {sectionContents.map((content) => (
                  <div key={content.id} className="bg-white p-3 rounded-xl text-center">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-1">
                      <span className="text-xs">{content.content.icon?.slice(0, 2)}</span>
                    </div>
                    <p className="text-xs font-semibold">{content.content.title}</p>
                    <p className="text-xs text-gray-400">{content.content.description}</p>
                  </div>
                ))}
              </div>
            )}
            {activeSection === 'footer' && sectionContents[0] && (
              <div className="p-4 text-center text-gray-500 text-sm">
                {sectionContents[0].content.showLogo && (
                  <Sparkles className="w-5 h-5 mx-auto mb-1 text-orange-500" />
                )}
                {sectionContents[0].content.text}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={editingContent ? 'Edit Content' : `Add ${activeSection}`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Key (identifier)
            </label>
            <input
              type="text"
              value={formData.key}
              onChange={(e) => setFormData({ ...formData, key: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
              placeholder="e.g., main, earn_points"
              required
            />
          </div>

          {/* Hero Fields */}
          {activeSection === 'hero' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.content.title || ''}
                  onChange={(e) => updateContentField('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="MAT.ai Kitchen"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
                <input
                  type="text"
                  value={formData.content.tagline || ''}
                  onChange={(e) => updateContentField('tagline', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="Order. Eat. Earn Rewards."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CTA Button Text
                </label>
                <input
                  type="text"
                  value={formData.content.ctaText || ''}
                  onChange={(e) => updateContentField('ctaText', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="Browse Menu"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gradient</label>
                <div className="grid grid-cols-3 gap-2">
                  {GRADIENTS.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => updateContentField('gradient', g)}
                      className={`h-10 rounded-lg bg-gradient-to-br ${g} ${
                        formData.content.gradient === g
                          ? 'ring-2 ring-offset-2 ring-orange-500'
                          : ''
                      }`}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Features Fields */}
          {activeSection === 'features' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto">
                  {LUCIDE_ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => updateContentField('icon', icon)}
                      className={`p-2 rounded-lg border text-xs ${
                        formData.content.icon === icon
                          ? 'border-orange-500 bg-orange-50 text-orange-600'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.content.title || ''}
                  onChange={(e) => updateContentField('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="Earn Points"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={formData.content.description || ''}
                  onChange={(e) => updateContentField('description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="1pt / RM1"
                />
              </div>
            </>
          )}

          {/* Footer Fields */}
          {activeSection === 'footer' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Footer Text
                </label>
                <input
                  type="text"
                  value={formData.content.text || ''}
                  onChange={(e) => updateContentField('text', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="Powered by MAT.ai"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.content.showLogo ?? true}
                  onChange={(e) => updateContentField('showLogo', e.target.checked)}
                  className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                />
                <label className="text-sm text-gray-700">Show MAT.ai logo</label>
              </div>
            </>
          )}

          {/* Sort Order & Active */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort Order
              </label>
              <input
                type="number"
                value={formData.sortOrder}
                onChange={(e) =>
                  setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
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

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {editingContent ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
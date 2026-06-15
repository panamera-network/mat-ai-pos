import React, { useState } from 'react';
import { useAuthStore } from '@mat-ai/backoffice';
import {
  Store, Palette, Bell, Shield, CreditCard, Users,
  ChevronRight, Save, Upload
} from 'lucide-react';

interface SettingsSection {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
}

const sections: SettingsSection[] = [
  { id: 'general', label: 'General', icon: Store, description: 'Restaurant name, logo, and basic info' },
  { id: 'appearance', label: 'Appearance', icon: Palette, description: 'Theme colors and branding' },
  { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Email and push notification settings' },
  { id: 'security', label: 'Security', icon: Shield, description: 'Password, 2FA, and access control' },
  { id: 'billing', label: 'Billing', icon: CreditCard, description: 'Subscription and payment methods' },
  { id: 'team', label: 'Team', icon: Users, description: 'Manage team members and permissions' },
];

export const SettingsPage: React.FC = () => {
  const { staff } = useAuthStore();
  const [activeSection, setActiveSection] = useState('general');
  const [restaurantName, setRestaurantName] = useState('MAT.ai Restaurant');
  const [primaryColor, setPrimaryColor] = useState('#2563eb');

  const renderSection = () => {
    switch (activeSection) {
      case 'general':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Restaurant Name</label>
              <input
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                className="w-full max-w-md px-4 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center">
                  <Store className="w-8 h-8 text-gray-400" />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                  <Upload className="w-4 h-4" />
                  Upload Logo
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <textarea className="w-full max-w-md px-4 py-2 border rounded-lg text-sm" rows={3} placeholder="Restaurant address..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input className="w-full max-w-md px-4 py-2 border rounded-lg text-sm" placeholder="+60 12-345 6789" />
            </div>
          </div>
        );
      case 'appearance':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-12 h-12 rounded-lg cursor-pointer"
                />
                <span className="text-sm text-gray-500">{primaryColor}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
              <div className="flex gap-3">
                {['light', 'dark', 'auto'].map((theme) => (
                  <button
                    key={theme}
                    className="px-4 py-2 border rounded-lg text-sm capitalize hover:bg-gray-50"
                  >
                    {theme}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      case 'notifications':
        return (
          <div className="space-y-4">
            {['Low stock alerts', 'New order notifications', 'Daily sales summary', 'Staff clock-in alerts'].map((item) => (
              <div key={item} className="flex items-center justify-between p-4 border rounded-lg">
                <span className="text-sm text-gray-700">{item}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        );
      case 'security':
        return (
          <div className="space-y-6">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium text-gray-900">Change Password</h4>
              <div className="mt-4 space-y-3 max-w-md">
                <input type="password" placeholder="Current password" className="w-full px-4 py-2 border rounded-lg text-sm" />
                <input type="password" placeholder="New password" className="w-full px-4 py-2 border rounded-lg text-sm" />
                <input type="password" placeholder="Confirm new password" className="w-full px-4 py-2 border rounded-lg text-sm" />
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Update Password</button>
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
              <p className="text-sm text-gray-500 mt-1">Add an extra layer of security</p>
              <button className="mt-3 px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">Enable 2FA</button>
            </div>
          </div>
        );
      case 'billing':
        return (
          <div className="space-y-6">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-800">Current Plan: Free Trial</p>
              <p className="text-xs text-blue-600 mt-1">Upgrade to unlock all features</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['Basic', 'Pro', 'Enterprise'].map((plan) => (
                <div key={plan} className="p-4 border rounded-lg">
                  <h4 className="font-semibold text-gray-900">{plan}</h4>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {plan === 'Basic' ? 'RM99' : plan === 'Pro' ? 'RM299' : 'Custom'}
                    <span className="text-sm font-normal text-gray-500">/mo</span>
                  </p>
                  <button className="mt-4 w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                    {plan === 'Basic' ? 'Current' : 'Upgrade'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      case 'team':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Team Members</h4>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Invite Member</button>
            </div>
            <div className="space-y-3">
              {[
                { name: staff?.name || 'You', email: staff?.email || 'admin@restaurant.com', role: staff?.role || 'ADMIN' },
                { name: 'Ahmad', email: 'ahmad@restaurant.com', role: 'MANAGER' },
                { name: 'Siti', email: 'siti@restaurant.com', role: 'CASHIER' },
              ].map((member) => (
                <div key={member.email} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-700">{member.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{member.name}</p>
                      <p className="text-xs text-gray-500">{member.email}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-gray-100 rounded-lg text-xs font-medium text-gray-600">{member.role}</span>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your restaurant and account settings</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0 space-y-1">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                activeSection === section.id
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <section.icon className="w-5 h-5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{section.label}</p>
              </div>
              <ChevronRight className="w-4 h-4 flex-shrink-0" />
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {sections.find(s => s.id === activeSection)?.label}
            </h3>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
          {renderSection()}
        </div>
      </div>
    </div>
  );
};

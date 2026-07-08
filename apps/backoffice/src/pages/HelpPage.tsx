import React from 'react';
import {
  BookOpen,
  ChefHat,
  ClipboardList,
  HelpCircle,
  Monitor,
  QrCode,
  RefreshCw,
  Settings,
  ShieldCheck,
} from 'lucide-react';

const quickGuides = [
  {
    title: 'QR to POS to KDS',
    icon: QrCode,
    steps: [
      'Customer submits order from QR Menu.',
      'POS reviews pending QR orders on Dashboard.',
      'Approved dine-in, takeaway, and delivery orders are sent to KDS.',
      'Reservations stay in Reservation until a table is assigned.',
    ],
  },
  {
    title: 'POS to KDS',
    icon: ChefHat,
    steps: [
      'Create or edit an order in POS.',
      'Save sends eligible orders to KDS through POS Bridge.',
      'Use Reprint order to KDS when kitchen needs the order again.',
      'KDS item/order done syncs back to POS and API.',
    ],
  },
  {
    title: 'Printing',
    icon: Monitor,
    steps: [
      'Browser print is the default mode.',
      'ESC/POS network printing routes through POS Bridge.',
      'Reprint bill and receipt print to the selected printer mode.',
      'Kitchen order reprint goes to KDS unless kitchen printer routing is added later.',
    ],
  },
  {
    title: 'Offline Sync',
    icon: RefreshCw,
    steps: [
      'Payment can save locally when API is unavailable.',
      'Order paid, receipt, and table release updates are queued.',
      'Dashboard shows pending sync count.',
      'Click the sync badge to retry manually.',
    ],
  },
];

const supportItems = [
  { label: 'API Server', value: 'http://localhost:4000' },
  { label: 'POS Bridge', value: 'http://localhost:8080' },
  { label: 'KDS WebSocket', value: 'ws://<pos-host-ip>:8080' },
  { label: 'Default Printer Port', value: '9100' },
];

export const HelpPage: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Help</h1>
          <p className="text-sm text-gray-500 mt-1">Operational notes for MAT.ai Back Office, POS, QR Menu, and KDS.</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
          <HelpCircle className="w-6 h-6 text-blue-600" />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {quickGuides.map((guide) => {
          const Icon = guide.icon;
          return (
            <section key={guide.title} className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-gray-700" />
                </div>
                <h2 className="font-semibold text-gray-900">{guide.title}</h2>
              </div>
              <ol className="space-y-2">
                {guide.steps.map((step, index) => (
                  <li key={step} className="flex gap-3 text-sm text-gray-600">
                    <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </section>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <section className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-gray-900">Daily Checklist</h2>
          </div>
          <div className="space-y-2 text-sm text-gray-600">
            <p>Confirm API and POS Bridge are running.</p>
            <p>Open KDS Settings and verify it points to the POS host IP.</p>
            <p>Run one test order before service starts.</p>
            <p>Check Dashboard sync badge is clear before closing.</p>
          </div>
        </section>

        <section className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <Settings className="w-5 h-5 text-emerald-600" />
            <h2 className="font-semibold text-gray-900">Settings To Check</h2>
          </div>
          <div className="space-y-2 text-sm text-gray-600">
            <p>Back Office: outlets, roles, menu, inventory, accounting.</p>
            <p>POS: KDS bridge host/port and printer mode.</p>
            <p>KDS: station name and bridge WebSocket URL.</p>
            <p>QR Menu: API/cloud URL and table/order type flow.</p>
          </div>
        </section>

        <section className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <ShieldCheck className="w-5 h-5 text-purple-600" />
            <h2 className="font-semibold text-gray-900">Troubleshooting</h2>
          </div>
          <div className="space-y-2 text-sm text-gray-600">
            <p>401 means session token expired. Sign in again.</p>
            <p>KDS WebSocket error usually means bridge IP/port is unreachable.</p>
            <p>Printer fallback opens browser print if ESC/POS fails.</p>
            <p>Pending sync count means offline changes still need retry.</p>
          </div>
        </section>
      </div>

      <section className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
        <div className="flex items-center gap-3 mb-4">
          <ClipboardList className="w-5 h-5 text-gray-700" />
          <h2 className="font-semibold text-gray-900">Local Endpoints</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
          {supportItems.map((item) => (
            <div key={item.label} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
              <p className="text-xs text-gray-500">{item.label}</p>
              <p className="text-sm font-mono text-gray-900 mt-1 break-all">{item.value}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

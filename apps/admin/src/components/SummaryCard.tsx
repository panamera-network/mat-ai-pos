import { LucideIcon } from 'lucide-react';

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'orange' | 'red';
}

const colorMap = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  orange: 'bg-orange-50 text-orange-600',
  red: 'bg-red-50 text-red-600',
};

export function SummaryCard({ title, value, icon: Icon, color }: SummaryCardProps) {
  return (
    <div className="bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-gray-100">
      <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center mb-3 ${colorMap[color]}`}>
        <Icon className="w-5 h-5 md:w-6 md:h-6" />
      </div>
      <p className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">{value}</p>
      <p className="text-xs md:text-sm text-gray-500 mt-1">{title}</p>
    </div>
  );
}
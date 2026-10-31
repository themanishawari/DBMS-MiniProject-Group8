import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  iconBgColor?: string;
  iconColor?: string;
  trendText?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtitle,
  icon,
  iconBgColor = 'bg-indigo-50',
  iconColor = 'text-indigo-600',
  trendText,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs transition-all ${
        onClick ? 'cursor-pointer hover:border-slate-300 hover:shadow-sm' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
          <h4 className="text-2xl font-bold text-slate-900 mt-1">{value}</h4>
        </div>
        <div className={`p-3 rounded-xl ${iconBgColor} ${iconColor} shrink-0`}>
          {icon}
        </div>
      </div>

      {(subtitle || trendText) && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          {subtitle && <span className="text-slate-500">{subtitle}</span>}
          {trendText && <span className="font-medium text-emerald-600">{trendText}</span>}
        </div>
      )}
    </div>
  );
};

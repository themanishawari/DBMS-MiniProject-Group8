import React from 'react';
import { PRIORITY_CONFIG, STATUS_CONFIG } from '../../data/constants';
import { ComplaintPriority, ComplaintStatus } from '../../types';

interface StatusBadgeProps {
  status: ComplaintStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.submitted;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${config.bg} ${config.border} ${config.text} ${sizeClasses}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {config.label}
    </span>
  );
};

interface PriorityBadgeProps {
  priority: ComplaintPriority;
  size?: 'sm' | 'md';
  showSla?: boolean;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'md', showSla = false }) => {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${config.bg} ${config.border} ${config.text} ${sizeClasses}`}
    >
      <span className={`w-2 h-2 rounded-full ${config.dotColor}`} />
      <span>{config.label}</span>
      {showSla && <span className="opacity-70 text-[10px]">({config.slaHours}h SLA)</span>}
    </span>
  );
};

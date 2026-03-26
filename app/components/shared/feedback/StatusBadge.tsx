'use client';

import { getStatusConfig, getPriorityConfig, getDepartmentConfig } from '@/app/utils/badgeConfigs';

type BadgeType = 'status' | 'priority' | 'department';

interface StatusBadgeProps {
  type?: BadgeType;
  value: string;
  showIcon?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export default function StatusBadge({
  type = 'status',
  value,
  showIcon = true,
  size = 'sm',
  className = '',
}: StatusBadgeProps) {
  const config = (() => {
    switch (type) {
      case 'priority': {
        const c = getPriorityConfig(value);
        return { bg: c.bg, text: c.text, Icon: c.icon, label: c.label };
      }
      case 'department': {
        const c = getDepartmentConfig(value);
        return { bg: c.bg, text: c.color, Icon: c.icon, label: c.label };
      }
      case 'status':
      default: {
        const c = getStatusConfig(value);
        return { bg: c.bg, text: c.text, Icon: c.icon, label: value.replace(/_/g, ' ') };
      }
    }
  })();

  const sizeClasses = size === 'sm'
    ? 'px-2 py-0.5 text-xs gap-1'
    : 'px-3 py-1 text-sm gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full capitalize ${config.bg} ${config.text} ${sizeClasses} ${className}`}
    >
      {showIcon && <config.Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
      {config.label}
    </span>
  );
}

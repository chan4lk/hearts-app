import { useMemo } from 'react';
import { getStatusConfig, getPriorityConfig, getDepartmentConfig } from '@/app/utils/badgeConfigs';
import { IconType } from 'react-icons';

type BadgeType = 'status' | 'priority' | 'department';

interface BadgeConfig {
  bg: string;
  text: string;
  icon: IconType;
  label: string;
}

/**
 * Returns badge styling config for a given type and value.
 * Memoized to avoid recalculating on every render.
 *
 * Usage:
 *   const badge = useBadgeConfig('status', goal.status);
 *   <span className={`${badge.bg} ${badge.text}`}>{badge.label}</span>
 */
export function useBadgeConfig(type: BadgeType, value: string): BadgeConfig {
  return useMemo(() => {
    switch (type) {
      case 'priority': {
        const c = getPriorityConfig(value);
        return { bg: c.bg, text: c.text, icon: c.icon, label: c.label };
      }
      case 'department': {
        const c = getDepartmentConfig(value);
        return { bg: c.bg, text: c.color, icon: c.icon, label: c.label };
      }
      case 'status':
      default: {
        const c = getStatusConfig(value);
        return { bg: c.bg, text: c.text, icon: c.icon, label: value.replace(/_/g, ' ') };
      }
    }
  }, [type, value]);
}

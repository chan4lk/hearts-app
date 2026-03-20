'use client';

import { ReactNode } from 'react';

export interface StatItem {
  title: string;
  value: number | string;
  icon: ReactNode;
  gradient: string;    // kept for API compat — ignored in rendering
  bgColor: string;     // kept for API compat — ignored in rendering
  borderColor: string; // kept for API compat — ignored in rendering
  iconColor?: string;  // e.g. 'text-indigo-600 dark:text-indigo-400'
  onClick?: () => void;
  clickable?: boolean;
  tooltip?: string;
  status?: string;
}

interface StatsSectionProps {
  stats: StatItem[];
  variant?: 'default' | 'compact' | 'auto';
  columns?: { mobile?: number; tablet?: number; desktop?: number };
  children?: ReactNode;
}

export default function StatsSection({ stats = [], variant = 'auto', columns, children }: StatsSectionProps) {
  const safeStats = Array.isArray(stats) ? stats : [];

  const getGridClass = (count: number) => {
    if (count <= 2) return 'grid-cols-1 sm:grid-cols-2';
    if (count === 3) return 'grid-cols-1 sm:grid-cols-3';
    if (count === 4) return 'grid-cols-2 lg:grid-cols-4';
    if (count === 5) return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5';
    return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6';
  };

  return (
    <div className={`grid ${getGridClass(safeStats.length)} gap-3`}>
      {safeStats.map((stat) => (
        <div
          key={stat.title}
          onClick={stat.onClick}
          className={`group flex items-center gap-3.5 px-4 py-3.5 rounded-xl bg-surface-elevated border border-theme transition-colors duration-150 ${
            stat.clickable !== false && stat.onClick ? 'cursor-pointer hover:bg-surface-secondary' : ''
          }`}
          tabIndex={stat.clickable !== false && stat.onClick ? 0 : -1}
          role={stat.clickable !== false && stat.onClick ? 'button' : undefined}
          aria-label={stat.tooltip || `${stat.title}: ${stat.value}`}
          title={stat.tooltip}
        >
          {/* Flat icon */}
          <div className={`flex-shrink-0 w-10 h-10 rounded-lg bg-surface-secondary flex items-center justify-center ${stat.iconColor || 'text-indigo-600 dark:text-indigo-400'}`}>
            {stat.icon}
          </div>

          {/* Value + Title */}
          <div className="min-w-0">
            <div className="text-[18px] font-bold text-primary leading-tight">{stat.value}</div>
            <div className="text-[12px] font-medium text-secondary truncate">{stat.title}</div>
          </div>
        </div>
      ))}
      {children}
    </div>
  );
}

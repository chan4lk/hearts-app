'use client';

import { ReactNode } from 'react';

export interface StatItem {
  title: string;
  value: number | string;
  icon: ReactNode;
  gradient?: string;
  bgColor?: string;
  borderColor?: string;
  iconColor?: string;
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

export default function StatsSection({ stats = [], variant = 'auto', children }: StatsSectionProps) {
  const safeStats = Array.isArray(stats) ? stats : [];

  const getGridClass = (count: number) => {
    if (count <= 2) return 'grid-cols-2';
    if (count <= 4) return 'grid-cols-2 lg:grid-cols-4';
    if (count <= 6) return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6';
    return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4';
  };

  return (
    <div className={`grid ${getGridClass(safeStats.length)} gap-3`}>
      {safeStats.map((stat) => {
        const isInteractive = stat.clickable !== false && stat.onClick;
        return (
          <button
            key={stat.title}
            type="button"
            onClick={stat.onClick}
            disabled={!isInteractive}
            className={`
              group flex items-center gap-3 px-4 py-3.5 rounded-xl
              bg-surface-elevated border border-theme
              transition-all duration-150 text-left
              focus-ring
              ${isInteractive
                ? 'cursor-pointer hover:bg-surface-secondary hover:shadow-theme-sm active:scale-[0.98]'
                : 'cursor-default'
              }
            `}
            aria-label={stat.tooltip || `${stat.title}: ${stat.value}`}
            title={stat.tooltip}
          >
            {/* Icon */}
            <div className={`
              flex-shrink-0 w-10 h-10 rounded-lg bg-surface-secondary
              flex items-center justify-center
              transition-colors duration-150
              ${stat.iconColor || 'text-accent'}
            `}>
              {stat.icon}
            </div>

            {/* Value + Label */}
            <div className="min-w-0 flex-1">
              <div className="text-lg font-semibold text-primary leading-tight tabular-nums">
                {stat.value}
              </div>
              <div className="text-xs font-medium text-secondary truncate mt-0.5">
                {stat.title}
              </div>
            </div>
          </button>
        );
      })}
      {children}
    </div>
  );
}

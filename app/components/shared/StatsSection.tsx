'use client';

import { ReactNode } from 'react';

export interface StatItem {
  title: string;
  value: number | string;
  icon: ReactNode;
  gradient: string;
  bgColor: string;
  borderColor: string;
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
          className={`group flex items-center gap-3 p-3.5 rounded-xl bg-surface-elevated border border-theme transition-all duration-200 ${
            stat.clickable !== false && stat.onClick ? 'cursor-pointer hover:shadow-theme-sm hover:border-[rgba(var(--color-accent),0.2)]' : ''
          }`}
          tabIndex={stat.clickable !== false && stat.onClick ? 0 : -1}
          role={stat.clickable !== false && stat.onClick ? 'button' : undefined}
          aria-label={stat.tooltip || `${stat.title}: ${stat.value}`}
          title={stat.tooltip}
        >
          {/* Icon */}
          <div className={`flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-white shadow-sm`}>
            {stat.icon}
          </div>

          {/* Value + Title */}
          <div className="min-w-0">
            <div className="text-lg font-bold text-primary leading-tight">{stat.value}</div>
            <div className="text-[12px] font-medium text-secondary truncate">{stat.title}</div>
          </div>
        </div>
      ))}
      {children}
    </div>
  );
}

'use client';

import { ReactNode } from 'react';

export interface StatItem {
  title: string;
  value: number | string;
  icon: ReactNode;
  iconColor?: string;
  onClick?: () => void;
  tooltip?: string;
  gradient?: string;
  bgColor?: string;
  borderColor?: string;
  clickable?: boolean;
  status?: string;
}

interface StatsSectionProps {
  stats: StatItem[];
  children?: ReactNode;
}

export default function StatsSection({ stats = [], children }: StatsSectionProps) {
  const safeStats = Array.isArray(stats) ? stats : [];

  const getGridClass = (count: number) => {
    if (count <= 2) return 'grid-cols-2';
    if (count <= 4) return 'grid-cols-2 lg:grid-cols-4';
    if (count <= 6) return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6';
    return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4';
  };

  return (
    <div className={`grid ${getGridClass(safeStats.length)} gap-3`}>
      {safeStats.map((stat, idx) => {
        const isInteractive = !!stat.onClick;
        return (
          <button
            key={stat.title}
            type="button"
            onClick={stat.onClick}
            disabled={!isInteractive}
            className={`
              group relative flex items-center gap-3.5 px-4 py-4 rounded-2xl
              bg-surface-elevated border border-theme overflow-hidden
              transition-all duration-300 text-left focus-ring
              ${isInteractive
                ? 'cursor-pointer hover:border-[rgba(var(--color-accent),0.2)] hover:shadow-theme-md active:scale-[0.98]'
                : 'cursor-default'
              }
            `}
            aria-label={stat.tooltip || `${stat.title}: ${stat.value}`}
            title={stat.tooltip}
          >
            {/* Subtle background number */}
            <span className="absolute -right-1 -top-2 text-5xl font-black text-primary/[0.02] dark:text-primary/[0.04] select-none leading-none">
              {String(idx + 1).padStart(2, '0')}
            </span>

            <div className={`
              flex-shrink-0 w-11 h-11 rounded-xl
              flex items-center justify-center transition-all duration-300
              ${isInteractive ? 'group-hover:scale-110 group-hover:shadow-sm' : ''}
              ${stat.iconColor || 'text-accent'} bg-surface-secondary
            `}>
              {stat.icon}
            </div>
            <div className="min-w-0 flex-1 relative">
              <div className="text-xl font-bold text-primary leading-tight tabular-nums tracking-tight">
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

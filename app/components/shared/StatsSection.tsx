'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

export interface StatItem {
  title: string;
  value: number | string;
  icon: ReactNode;
  gradient: string; // e.g., 'from-blue-500 to-cyan-500'
  bgColor: string; // e.g., 'bg-blue-500/10'
  borderColor: string; // e.g., 'border-blue-500/30'
  onClick?: () => void;
  clickable?: boolean;
  tooltip?: string;
  status?: string; // for filtering
}

interface StatsSectionProps {
  stats: StatItem[];
  variant?: 'default' | 'compact' | 'auto';
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  children?: ReactNode;
}

export default function StatsSection({
  stats,
  variant = 'auto',
  columns,
  children
}: StatsSectionProps) {
  // Auto-detect optimal grid layout based on number of stats
  const getAutoGridClass = (count: number) => {
    if (count <= 2) return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3';
    if (count === 3) return 'grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-3';
    if (count === 4) return 'grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3';
    if (count === 5) return 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3';
    if (count === 6) return 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3';
    // 7+ items: responsive layout
    return 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-auto gap-3 auto-cols-fr';
  };

  // Map column numbers to Tailwind classes for manual configuration
  const getCustomGridClass = (mobileCol: number, tabletCol: number, desktopCol: number) => {
    const mobileClass = `grid-cols-${mobileCol}`;
    const tabletClass = `sm:grid-cols-${tabletCol}`;
    const desktopClass = `lg:grid-cols-${desktopCol}`;
    return `grid ${mobileClass} ${tabletClass} ${desktopClass} gap-3`;
  };

  let gridClass: string;

  if (variant === 'auto') {
    // Auto mode: intelligent grid based on item count
    gridClass = getAutoGridClass(stats.length);
  } else if (variant === 'compact') {
    gridClass = `grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2`;
  } else {
    // Default or custom columns
    const { mobile = 2, tablet = 3, desktop = 4 } = columns || {};
    gridClass = getCustomGridClass(mobile, tablet, desktop);
  }

  return (
    <div className={gridClass}>
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          onClick={stat.onClick}
          className={`
            relative overflow-hidden
            ${stat.bgColor}
            backdrop-blur-sm
            rounded-xl
            p-3
            border-2
            ${stat.borderColor}
            hover:border-opacity-60
            transition-all
            duration-300
            group
            ${stat.clickable !== false && stat.onClick ? 'cursor-pointer hover:shadow-xl hover:scale-105' : ''}
            flex items-center gap-3
          `}
          tabIndex={stat.clickable !== false && stat.onClick ? 0 : -1}
          role={stat.clickable !== false && stat.onClick ? 'button' : undefined}
          aria-label={stat.tooltip || `${stat.title}: ${stat.value}`}
          title={stat.tooltip}
        >
          {/* Animated background gradient on hover */}
          {stat.onClick && (
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
          )}

          {/* Content */}
          <div className="relative flex items-center gap-3 w-full">
            {/* Icon */}
            <div className={`rounded-lg bg-gradient-to-r ${stat.gradient} text-white shadow-lg flex-shrink-0 p-2`}>
              {stat.icon}
            </div>

            {/* Value and Title */}
            <div className="flex flex-col">
              <div className="text-xl font-bold text-white group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:text-transparent group-hover:from-white group-hover:to-gray-200 transition-all duration-300">
                {stat.value}
              </div>
              <div className="text-xs font-medium text-gray-400">
                {stat.title}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
      {children}
    </div>
  );
}

'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

export interface Metric {
  label: string;
  value: number | string;
  color?: 'accent' | 'success' | 'warning' | 'error' | 'info' | 'secondary';
  icon?: ReactNode;
  onClick?: () => void;
  active?: boolean;
}

interface MetricStripProps {
  metrics: Metric[];
  className?: string;
}

const dotColors: Record<string, string> = {
  accent: 'bg-accent',
  success: 'bg-[rgb(var(--color-success))]',
  warning: 'bg-[rgb(var(--color-warning))]',
  error: 'bg-[rgb(var(--color-error))]',
  info: 'bg-[rgb(var(--color-info))]',
  secondary: 'bg-[rgb(var(--color-text-tertiary))]',
};

const activeColors: Record<string, string> = {
  accent: 'border-b-accent',
  success: 'border-b-[rgb(var(--color-success))]',
  warning: 'border-b-[rgb(var(--color-warning))]',
  error: 'border-b-[rgb(var(--color-error))]',
  info: 'border-b-[rgb(var(--color-info))]',
  secondary: 'border-b-[rgb(var(--color-text-tertiary))]',
};

export default function MetricStrip({ metrics, className = '' }: MetricStripProps) {
  return (
    <div className={`flex items-stretch gap-0 overflow-x-auto scrollbar-hide rounded-xl border border-theme bg-surface-elevated ${className}`}>
      {metrics.map((metric, i) => {
        const color = metric.color || 'secondary';
        const isClickable = !!metric.onClick;

        return (
          <motion.button
            key={i}
            onClick={metric.onClick}
            disabled={!isClickable}
            whileTap={isClickable ? { scale: 0.97 } : undefined}
            className={`flex-1 min-w-[100px] px-4 py-3 flex flex-col items-center gap-1 border-b-2 transition-all duration-200 ${
              metric.active
                ? `${activeColors[color]} bg-surface-secondary`
                : 'border-b-transparent hover:bg-surface-secondary/50'
            } ${isClickable ? 'cursor-pointer' : 'cursor-default'} ${
              i > 0 ? 'border-l border-theme' : ''
            }`}
          >
            <span className="text-xl font-bold text-primary tabular-nums">{metric.value}</span>
            <span className="flex items-center gap-1.5 text-xs text-secondary font-medium whitespace-nowrap">
              <span className={`w-1.5 h-1.5 rounded-full ${dotColors[color]}`} />
              {metric.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

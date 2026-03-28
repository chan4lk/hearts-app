'use client';

import { LucideIcon } from 'lucide-react';

interface StatItem {
  label: string;
  value: number | string;
  icon: LucideIcon;
  color?: string; // CSS variable name like '--color-heart'
}

interface StatGridProps {
  stats: StatItem[];
  columns?: 2 | 3 | 4;
}

export default function StatGrid({ stats, columns = 4 }: StatGridProps) {
  const colClass = columns === 2 ? 'grid-cols-2' : columns === 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4';

  return (
    <div className={`grid ${colClass} gap-3`}>
      {stats.map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="card-stat">
          <div className="flex items-center gap-3">
            <div
              className="icon-box-md"
              style={{ backgroundColor: color ? `rgba(var(${color}),0.1)` : 'rgba(var(--color-accent),0.1)' }}
            >
              <Icon
                className="w-5 h-5"
                style={{ color: color ? `rgb(var(${color}))` : 'rgb(var(--color-accent))' }}
              />
            </div>
            <div>
              <p className="text-xl font-bold text-primary">{value}</p>
              <p className="text-2xs text-tertiary">{label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

'use client';

import { ReactNode } from 'react';

interface FilterBadgeProps {
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function FilterBadge({ icon, children, className = '' }: FilterBadgeProps) {
  return (
    <div className={`flex items-center gap-2 bg-surface-elevated backdrop-blur-sm rounded-lg px-3 py-2 border border-theme ${className}`}>
      {icon && <div className="text-secondary">{icon}</div>}
      {children}
    </div>
  );
}



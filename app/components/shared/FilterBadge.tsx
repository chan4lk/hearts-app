'use client';

import { ReactNode } from 'react';

interface FilterBadgeProps {
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function FilterBadge({ icon, children, className = '' }: FilterBadgeProps) {
  return (
    <div className={`flex items-center gap-2 bg-gray-800/50 backdrop-blur-sm rounded-lg px-3 py-2 border border-gray-700/50 ${className}`}>
      {icon && <div className="text-gray-400">{icon}</div>}
      {children}
    </div>
  );
}



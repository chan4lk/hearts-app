'use client';

import { ReactNode } from 'react';

interface IconBoxProps {
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  color?: 'accent' | 'success' | 'warning' | 'error' | 'info' | 'secondary';
  className?: string;
}

const sizeMap = {
  sm: 'w-8 h-8 rounded-lg',
  md: 'w-10 h-10 rounded-xl',
  lg: 'w-12 h-12 rounded-xl',
};

const colorMap = {
  accent: 'bg-accent-muted text-accent',
  success: 'bg-success-muted text-success',
  warning: 'bg-warning-muted text-warning',
  error: 'bg-error-muted text-error',
  info: 'bg-info-muted text-info',
  secondary: 'bg-surface-secondary text-secondary',
};

/**
 * Reusable icon container with consistent sizing and coloring.
 * Replaces repeated w-N h-N rounded-xl bg-X-muted text-X patterns.
 */
export default function IconBox({
  children,
  size = 'md',
  color = 'accent',
  className = '',
}: IconBoxProps) {
  return (
    <div className={`${sizeMap[size]} ${colorMap[color]} flex items-center justify-center flex-shrink-0 ${className}`}>
      {children}
    </div>
  );
}

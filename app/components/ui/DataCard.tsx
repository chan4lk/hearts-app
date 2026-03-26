'use client';

import { ReactNode } from 'react';

interface DataCardProps {
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  className?: string;
  onClick?: () => void;
}

const sizeMap = {
  sm: 'rounded-lg p-3',
  md: 'rounded-xl p-4',
  lg: 'rounded-2xl p-5',
};

/**
 * Reusable card container using design system tokens.
 * Replaces repeated bg-surface-elevated border border-theme rounded-xl patterns.
 */
export default function DataCard({
  children,
  size = 'md',
  interactive = false,
  className = '',
  onClick,
}: DataCardProps) {
  const base = `bg-surface-elevated border border-theme ${sizeMap[size]} overflow-hidden`;
  const interactiveStyles = interactive
    ? 'cursor-pointer hover:border-[rgba(var(--color-accent),0.2)] hover:shadow-theme-lg active:scale-[0.99] transition-all duration-200 focus-ring'
    : 'hover:shadow-theme-sm transition-shadow duration-200';

  const classes = `${base} ${interactiveStyles} ${className}`.trim();

  if (onClick) {
    return (
      <button onClick={onClick} className={`${classes} text-left w-full`} type="button">
        {children}
      </button>
    );
  }

  return <div className={classes}>{children}</div>;
}

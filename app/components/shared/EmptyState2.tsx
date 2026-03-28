'use client';

import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  color?: string; // CSS variable like '--color-heart'
}

export default function EmptyState2({ icon: Icon, title, description, color = '--color-accent' }: EmptyStateProps) {
  return (
    <div className="empty-container">
      <div
        className="empty-icon-ring"
        style={{ backgroundColor: `rgba(var(${color}),0.1)` }}
      >
        <Icon className="w-10 h-10" style={{ color: `rgb(var(${color}))` }} />
      </div>
      <p className="empty-title">{title}</p>
      <p className="empty-description">{description}</p>
    </div>
  );
}

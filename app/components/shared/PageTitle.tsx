'use client';

import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface PageTitleProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string; // CSS variable like '--color-heart'
  /** Right-side actions (buttons, filter toggles) */
  actions?: ReactNode;
}

export default function PageTitle({ title, subtitle, icon: Icon, iconColor, actions }: PageTitleProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
      <div>
        <h1 className="page-title">
          {Icon && (
            <Icon
              className="w-6 h-6"
              style={iconColor ? { color: `rgb(var(${iconColor}))` } : undefined}
            />
          )}
          {title}
        </h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}

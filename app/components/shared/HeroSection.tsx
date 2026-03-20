'use client';

import { ReactNode } from 'react';
import { Button } from '@/app/components/ui/button';
import { BsPlus, BsCollection } from 'react-icons/bs';

interface HeroSectionProps {
  title?: string;
  subtitle?: string;
  userName?: string;
  gradient?: string;
  children?: ReactNode;
  useSessionName?: boolean;
  onCreateClick?: () => void;
  onBulkCreateClick?: () => void;
}

export default function HeroSection({
  title,
  subtitle = "Manage your organization's goals and users",
  userName,
  gradient = 'from-indigo-600 to-purple-600',
  children,
  onCreateClick,
  onBulkCreateClick
}: HeroSectionProps) {
  const displayName = userName || 'User';

  return (
    <div className={`relative overflow-hidden rounded-xl p-5 sm:p-6 bg-gradient-to-r ${gradient}`}>
      {/* Background texture */}
      <div className="absolute inset-0 opacity-[0.06]" style={{
        backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)',
        backgroundSize: '30px 30px',
      }} />

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">
            {title || `Welcome back, ${displayName}`}
          </h2>
          {subtitle && (
            <p className="text-white/75 text-sm mt-1">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {onBulkCreateClick && (
            <Button onClick={onBulkCreateClick} className="bg-white/15 hover:bg-white/25 border-0 text-white text-[13px] h-9 px-3.5 rounded-lg">
              <BsCollection className="mr-1.5 h-3.5 w-3.5" />
              Bulk Create
            </Button>
          )}
          {onCreateClick && (
            <Button onClick={onCreateClick} className="bg-white text-indigo-700 hover:bg-white/90 border-0 text-[13px] font-semibold h-9 px-3.5 rounded-lg shadow-sm">
              <BsPlus className="mr-1 h-4 w-4" />
              Create Goal
            </Button>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

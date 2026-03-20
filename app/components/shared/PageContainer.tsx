'use client';

import { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
}

export function PageContainer({ children }: PageContainerProps) {
  return (
    <div className="min-h-screen bg-surface-primary">
      {/* Subtle Background Pattern */}
      <div className="fixed inset-0 pointer-events-none bg-grid" />

      <div className="relative max-w-7xl mx-auto px-4 py-3 space-y-4">
        {children}
      </div>
    </div>
  );
}

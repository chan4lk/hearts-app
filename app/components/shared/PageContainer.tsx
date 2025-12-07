'use client';

import { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
}

export function PageContainer({ children }: PageContainerProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Subtle Background Pattern */}
      <div className="fixed inset-0 bg-[url('/grid.svg')] opacity-5 pointer-events-none" />
      
      <div className="relative max-w-7xl mx-auto px-4 py-3 space-y-4">
        {children}
      </div>
    </div>
  );
}


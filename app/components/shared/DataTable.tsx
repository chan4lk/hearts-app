'use client';

import { ReactNode } from 'react';

interface Column {
  key: string;
  label: string;
  className?: string;
  hideOnMobile?: boolean;
}

interface DataTableProps {
  columns: Column[];
  children: ReactNode;
  loading?: boolean;
  emptyMessage?: string;
  maxHeight?: string;
}

export default function DataTable({ columns, children, loading, emptyMessage = 'No data found', maxHeight = '60vh' }: DataTableProps) {
  return (
    <div className="card-section">
      <div className="overflow-hidden">
        {/* Fixed header */}
        <table className="w-full">
          <thead className="sticky top-0 z-10 bg-surface-secondary">
            <tr>
              {columns.map((col) => (
                <th key={col.key}
                  className={`text-left px-4 py-3 text-2xs font-semibold text-secondary uppercase tracking-wider ${col.hideOnMobile ? 'hidden md:table-cell' : ''} ${col.className || ''}`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
        </table>

        {/* Scrollable body */}
        <div style={{ maxHeight, overflowY: 'auto' }}>
          <table className="w-full">
            <tbody className="divide-y divide-[rgb(var(--color-border-theme))]">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {columns.map((col, j) => (
                      <td key={j} className={`px-4 py-3 ${col.hideOnMobile ? 'hidden md:table-cell' : ''}`}>
                        <div className={`skeleton ${j === 0 ? 'h-4 w-32' : 'h-4 w-20'}`} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                children
              )}
            </tbody>
          </table>
          {!loading && !children && (
            <p className="text-center text-sm text-secondary py-12">{emptyMessage}</p>
          )}
        </div>
      </div>
    </div>
  );
}

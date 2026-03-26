'use client';

import { motion } from 'framer-motion';

type SkeletonVariant = 'page' | 'table' | 'card' | 'stats' | 'inline';

interface LoadingSkeletonProps {
  variant?: SkeletonVariant;
  rows?: number;
  columns?: number;
  className?: string;
}

function Pulse({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-surface-tertiary/50 ${className}`} />
  );
}

function StatsSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-${columns} gap-4`}>
      {Array.from({ length: columns }).map((_, i) => (
        <div key={i} className="rounded-xl border border-theme bg-surface-elevated p-4 space-y-3">
          <Pulse className="h-3 w-20" />
          <Pulse className="h-8 w-16" />
          <Pulse className="h-2 w-24" />
        </div>
      ))}
    </div>
  );
}

function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="rounded-xl border border-theme bg-surface-elevated overflow-hidden">
      {/* Header */}
      <div className="flex gap-4 px-4 py-3 border-b border-theme bg-surface-secondary">
        {Array.from({ length: columns }).map((_, i) => (
          <Pulse key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="flex gap-4 px-4 py-3 border-b border-theme last:border-0">
          {Array.from({ length: columns }).map((_, col) => (
            <Pulse key={col} className={`h-4 flex-1 ${col === 0 ? 'max-w-[200px]' : ''}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

function CardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-xl border border-theme bg-surface-elevated p-4 space-y-3">
          <div className="flex justify-between items-start">
            <Pulse className="h-5 w-32" />
            <Pulse className="h-5 w-16 rounded-full" />
          </div>
          <Pulse className="h-3 w-full" />
          <Pulse className="h-3 w-3/4" />
          <div className="flex gap-2 pt-2">
            <Pulse className="h-6 w-16 rounded-full" />
            <Pulse className="h-6 w-20 rounded-full" />
          </div>
          <Pulse className="h-2 w-full rounded-full" />
        </div>
      ))}
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Pulse className="h-8 w-48" />
        <Pulse className="h-4 w-72" />
      </div>
      {/* Stats */}
      <StatsSkeleton columns={4} />
      {/* Toolbar */}
      <div className="flex gap-3 items-center">
        <Pulse className="h-10 w-64 rounded-lg" />
        <Pulse className="h-10 w-32 rounded-lg" />
        <Pulse className="h-10 w-32 rounded-lg" />
      </div>
      {/* Table */}
      <TableSkeleton rows={5} columns={5} />
    </div>
  );
}

function InlineSkeleton() {
  return <Pulse className="h-4 w-24 inline-block" />;
}

export default function LoadingSkeleton({
  variant = 'page',
  rows,
  columns,
  className = '',
}: LoadingSkeletonProps) {
  const content = (() => {
    switch (variant) {
      case 'stats':
        return <StatsSkeleton columns={columns} />;
      case 'table':
        return <TableSkeleton rows={rows} columns={columns} />;
      case 'card':
        return <CardSkeleton rows={rows} />;
      case 'inline':
        return <InlineSkeleton />;
      case 'page':
      default:
        return <PageSkeleton />;
    }
  })();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={className}
    >
      {content}
    </motion.div>
  );
}

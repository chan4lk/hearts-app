'use client';

import { motion } from 'framer-motion';

type SkeletonVariant = 'page' | 'table' | 'card' | 'stats' | 'inline';

interface LoadingSkeletonProps {
  variant?: SkeletonVariant;
  rows?: number;
  columns?: number;
  message?: string;
  className?: string;
}

function Pulse({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-surface-tertiary ${className}`} />
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
      <div className="flex gap-4 px-4 py-3 border-b border-theme bg-surface-secondary">
        {Array.from({ length: columns }).map((_, i) => (
          <Pulse key={i} className="h-4 flex-1" />
        ))}
      </div>
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

function PageLoadingSpinner({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      {/* Spinner */}
      <div className="relative w-12 h-12 mb-5">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 rounded-full border-2 border-surface-tertiary border-t-accent"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-2 h-2 rounded-full bg-accent"
          />
        </div>
      </div>

      {/* Loading text */}
      <p className="text-sm font-medium text-secondary mb-1">{message}</p>
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
            className="w-1.5 h-1.5 rounded-full bg-accent/60"
          />
        ))}
      </div>
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
  message = 'Loading data...',
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
        return <PageLoadingSpinner message={message} />;
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

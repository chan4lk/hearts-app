'use client';

import { motion } from 'framer-motion';

interface PageSkeletonProps {
  /** Type of content being loaded */
  type?: 'feed' | 'cards' | 'table' | 'detail' | 'stats';
  /** Number of skeleton items */
  count?: number;
}

function Pulse({ className }: { className: string }) {
  return <div className={`skeleton ${className}`} />;
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="card-stat animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl skeleton" />
            <div className="space-y-1.5">
              <Pulse className="h-5 w-12" />
              <Pulse className="h-3 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function FeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card-interactive p-5 animate-pulse">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full skeleton" />
            <div className="flex-1 space-y-1.5">
              <Pulse className="h-4 w-3/4" />
              <Pulse className="h-3 w-1/3" />
            </div>
          </div>
          <Pulse className="h-3 w-full" />
          <Pulse className="h-3 w-2/3 mt-1.5" />
        </div>
      ))}
    </div>
  );
}

function CardsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card-interactive p-5 animate-pulse">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Pulse className="h-4 w-48" />
                <Pulse className="h-5 w-16 rounded-full" />
              </div>
              <Pulse className="h-3 w-full" />
              <div className="flex gap-3">
                <Pulse className="h-3 w-20" />
                <Pulse className="h-3 w-24" />
              </div>
            </div>
            <Pulse className="h-7 w-16 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

function TableSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="card-section animate-pulse">
      <div className="px-4 py-3 border-b border-theme">
        <Pulse className="h-4 w-32" />
      </div>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="px-4 py-3 flex items-center gap-3 border-b border-[rgb(var(--color-border-theme))] last:border-0">
          <div className="w-9 h-9 rounded-full skeleton" />
          <div className="flex-1 space-y-1.5">
            <Pulse className="h-4 w-40" />
            <Pulse className="h-3 w-24" />
          </div>
          <Pulse className="h-5 w-16 rounded-full" />
          <Pulse className="h-4 w-12" />
        </div>
      ))}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="card-interactive p-6 animate-pulse">
        <Pulse className="h-6 w-64 mb-3" />
        <Pulse className="h-4 w-full mb-2" />
        <Pulse className="h-4 w-3/4 mb-4" />
        <div className="flex gap-3">
          <Pulse className="h-3 w-24" />
          <Pulse className="h-3 w-32" />
        </div>
        <div className="mt-4">
          <Pulse className="h-3 w-20 mb-2" />
          <Pulse className="h-8 w-full rounded-full" />
        </div>
      </div>
      <div className="card-section animate-pulse">
        <div className="px-5 py-3 border-b border-theme">
          <Pulse className="h-4 w-28" />
        </div>
        {[1, 2].map((i) => (
          <div key={i} className="px-5 py-3 border-b border-[rgb(var(--color-border-theme))] last:border-0">
            <Pulse className="h-3 w-24 mb-1" />
            <Pulse className="h-4 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PageSkeleton({ type = 'cards', count = 3 }: PageSkeletonProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {type === 'stats' && <StatsSkeleton />}
      {type === 'feed' && <FeedSkeleton count={count} />}
      {type === 'cards' && <CardsSkeleton count={count} />}
      {type === 'table' && <TableSkeleton count={count} />}
      {type === 'detail' && <DetailSkeleton />}
    </motion.div>
  );
}

export { StatsSkeleton, FeedSkeleton, CardsSkeleton, TableSkeleton, DetailSkeleton };

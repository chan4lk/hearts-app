'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import HeartButton from '@/app/components/hearts/HeartButton';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardCheck,
  Calendar,
  ChevronRight,
  Search,
  X,
  Tag,
} from 'lucide-react';
import PageSkeleton from '@/app/components/shared/PageSkeleton';
import PageTitle from '@/app/components/shared/PageTitle';
import EmptyState2 from '@/app/components/shared/EmptyState2';

interface ReviewCycle {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  type: string;
  status: string;
  _count: { reviews: number };
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-surface-secondary text-secondary',
  ACTIVE: 'bg-[rgba(var(--color-review),0.12)] text-[rgb(var(--color-review))]',
  COMPLETED: 'bg-success-muted text-success',
  CLOSED: 'bg-surface-secondary text-tertiary',
};

export default function ReviewsPage() {
  const { data: session } = useSession();
  const [cycles, setCycles] = useState<ReviewCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetch('/api/reviews/cycles')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => {
        setCycles(d);
        setLoading(false);
      });
  }, []);

  const visibleCycles = useMemo(() => {
    const q = search.trim().toLowerCase();
    const sf = statusFilter.trim().toUpperCase();
    return cycles.filter((c) => {
      if (sf && c.status !== sf) return false;
      if (q) {
        const hay = `${c.name} ${c.type} ${c.status}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [cycles, search, statusFilter]);

  const activeCount = cycles.filter((c) => c.status === 'ACTIVE').length;
  const totalReviews = cycles.reduce((sum, c) => sum + c._count.reviews, 0);
  const hasFilters = !!(search || statusFilter);

  return (
    <DashboardLayout type="employee">
      <datalist id="cycle-status-options">
        <option value="DRAFT" />
        <option value="ACTIVE" />
        <option value="COMPLETED" />
        <option value="CLOSED" />
      </datalist>

      <div className="max-w-4xl mx-auto space-y-6">
        <PageTitle
          title="Reviews"
          subtitle="Performance review cycles"
          icon={ClipboardCheck}
          iconColor="--color-review"
        />

        {!loading && cycles.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total Cycles', value: cycles.length },
              { label: 'Active', value: activeCount },
              { label: 'Total Reviews', value: totalReviews },
            ].map(({ label, value }) => (
              <div key={label} className="card-stat text-center">
                <p className="text-2xl font-bold text-primary">{value}</p>
                <p className="text-2xs text-tertiary">{label}</p>
              </div>
            ))}
          </div>
        )}

        {!loading && cycles.length > 0 && (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary pointer-events-none" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by cycle name, type, status..."
                  className="input-base pl-9"
                  aria-label="Search cycles"
                />
              </div>
              <div className="relative sm:w-48">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary pointer-events-none" />
                <input
                  type="text"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value.toUpperCase())}
                  placeholder="All statuses"
                  className="input-base pl-9 pr-8"
                  list="cycle-status-options"
                  autoComplete="off"
                  aria-label="Filter by status"
                />
                {statusFilter && (
                  <button
                    type="button"
                    onClick={() => setStatusFilter('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-tertiary hover:text-primary focus-ring rounded p-0.5"
                    aria-label="Clear status filter"
                    title="Clear"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <p className="text-xs text-tertiary -mt-2">
              Showing {visibleCycles.length} of {cycles.length} cycle
              {cycles.length === 1 ? '' : 's'}
              {hasFilters && (
                <>
                  {' · '}
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('');
                      setStatusFilter('');
                    }}
                    className="text-accent hover:underline focus-ring rounded"
                  >
                    Clear filters
                  </button>
                </>
              )}
            </p>
          </>
        )}

        {loading ? (
          <PageSkeleton type="cards" count={2} />
        ) : cycles.length === 0 ? (
          <EmptyState2
            icon={ClipboardCheck}
            title="No review cycles"
            description={
              session?.user?.role === 'ADMIN'
                ? 'Create one from Admin → Review Cycles'
                : 'Review cycles will appear when your admin creates them'
            }
            color="--color-review"
          />
        ) : visibleCycles.length === 0 ? (
          <div className="empty-container">
            <div
              className="empty-icon-ring"
              style={{ backgroundColor: 'rgba(var(--color-review),0.1)' }}
            >
              <ClipboardCheck
                className="w-10 h-10"
                style={{ color: 'rgb(var(--color-review))' }}
              />
            </div>
            <p className="empty-title">No cycles match the current filters</p>
            <p className="empty-description">Try a different search term or clear the status filter.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[calc(100vh-18rem)] overflow-y-auto scrollbar-hide pr-1 -mr-1">
            <AnimatePresence initial={false}>
              {visibleCycles.map((cycle, i) => (
                <motion.div
                  key={cycle.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link
                    href={`/dashboard/reviews/${cycle.id}`}
                    className="block card-interactive p-5 focus-ring group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: 'rgba(var(--color-review),0.1)' }}
                        >
                          <ClipboardCheck
                            className="w-6 h-6"
                            style={{ color: 'rgb(var(--color-review))' }}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <h3 className="text-sm font-semibold text-primary group-hover:text-accent transition-colors">
                              {cycle.name}
                            </h3>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[cycle.status]}`}
                            >
                              {cycle.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-tertiary flex-wrap">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(cycle.startDate).toLocaleDateString()} –{' '}
                              {new Date(cycle.endDate).toLocaleDateString()}
                            </span>
                            <span>{cycle.type.replace('_', ' ')}</span>
                            <span>{cycle._count.reviews} reviews</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-tertiary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
      <HeartButton />
    </DashboardLayout>
  );
}

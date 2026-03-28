'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import HeartButton from '@/app/components/hearts/HeartButton';
import { motion } from 'framer-motion';
import { ClipboardCheck, Calendar, ChevronRight } from 'lucide-react';

interface ReviewCycle { id: string; name: string; startDate: string; endDate: string; type: string; status: string; _count: { reviews: number }; }

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

  useEffect(() => { fetch('/api/reviews/cycles').then(r => r.ok ? r.json() : []).then(d => { setCycles(d); setLoading(false); }); }, []);

  return (
    <DashboardLayout type="employee">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6" style={{ color: 'rgb(var(--color-review))' }} /> Reviews
          </h1>
          <p className="text-sm text-secondary mt-0.5">Performance review cycles</p>
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-20 bg-surface-elevated rounded-2xl border border-theme animate-pulse" />)}</div>
        ) : cycles.length === 0 ? (
          <div className="empty-container">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(var(--color-review),0.1)' }}>
              <ClipboardCheck className="w-10 h-10" style={{ color: 'rgb(var(--color-review))' }} />
            </div>
            <h3 className="text-lg font-semibold text-primary mb-2">No review cycles</h3>
            <p className="text-sm text-secondary">{session?.user?.role === 'ADMIN' ? 'Create one from Admin → Review Cycles' : 'Review cycles will appear when your admin creates them'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cycles.map((cycle, i) => (
              <motion.div key={cycle.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Link href={`/dashboard/reviews/${cycle.id}`} className="block card-interactive p-5 focus-ring group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(var(--color-review),0.1)' }}>
                        <ClipboardCheck className="w-6 h-6" style={{ color: 'rgb(var(--color-review))' }} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="text-sm font-semibold text-primary group-hover:text-accent transition-colors">{cycle.name}</h3>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[cycle.status]}`}>{cycle.status}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-tertiary">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(cycle.startDate).toLocaleDateString()} – {new Date(cycle.endDate).toLocaleDateString()}</span>
                          <span>{cycle.type.replace('_', ' ')}</span>
                          <span>{cycle._count.reviews} reviews</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <HeartButton />
    </DashboardLayout>
  );
}

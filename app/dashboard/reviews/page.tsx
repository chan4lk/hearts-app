'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { PageHeader } from '@/app/components/shared/PageHeader';
import HeartButton from '@/app/components/hearts/HeartButton';
import { motion } from 'framer-motion';
import { ClipboardCheck, Calendar } from 'lucide-react';

interface ReviewCycle {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  type: string;
  status: string;
  _count: { reviews: number };
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-surface-secondary text-secondary',
  ACTIVE: 'bg-success-muted text-success',
  COMPLETED: 'bg-info-muted text-info',
  CLOSED: 'bg-surface-secondary text-tertiary',
};

export default function ReviewsPage() {
  const { data: session } = useSession();
  const [cycles, setCycles] = useState<ReviewCycle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reviews/cycles').then(r => r.ok ? r.json() : []).then(data => { setCycles(data); setLoading(false); });
  }, []);

  return (
    <DashboardLayout type="employee">
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader title="Reviews" description="Performance review cycles" />

        {loading ? (
          <div className="text-center py-12 text-secondary">Loading cycles...</div>
        ) : cycles.length === 0 ? (
          <div className="text-center py-16">
            <ClipboardCheck className="w-16 h-16 text-tertiary mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-primary mb-2">No review cycles</h3>
            <p className="text-sm text-secondary">
              {session?.user?.role === 'ADMIN'
                ? 'Create a review cycle from Admin → Review Cycles'
                : 'Review cycles will appear here when your admin creates them'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {cycles.map((cycle) => (
              <motion.div key={cycle.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <Link href={`/dashboard/reviews/${cycle.id}`} className="block bg-surface-elevated rounded-xl border border-theme p-4 shadow-theme-sm hover:shadow-theme-md transition-shadow focus-ring">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-primary">{cycle.name}</h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[cycle.status]}`}>
                          {cycle.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-tertiary">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(cycle.startDate).toLocaleDateString()} – {new Date(cycle.endDate).toLocaleDateString()}</span>
                        <span>{cycle.type.replace('_', ' ')}</span>
                        <span>{cycle._count.reviews} reviews</span>
                      </div>
                    </div>
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

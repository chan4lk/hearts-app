'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import HeartButton from '@/app/components/hearts/HeartButton';
import HeartCard from '@/app/components/hearts/HeartCard';
import OnboardingWizard from '@/app/components/onboarding/OnboardingWizard';
import { Heart, Target, Calendar, ClipboardCheck } from 'lucide-react';

interface HeartItem {
  id: string;
  message: string | null;
  createdAt: string;
  sender: { id: string; name: string; department: string | null };
  receiver: { id: string; name: string; department: string | null };
  valueTag: { id: string; name: string };
}

interface DashStats {
  heartsThisMonth: number;
  activeGoals: number;
  upcomingEvents: number;
  activeCycles: number;
  [key: string]: any;
}

export default function FeedPage() {
  const { data: session } = useSession();
  const [hearts, setHearts] = useState<HeartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashStats | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const onboarded = localStorage.getItem('aspirehub-onboarded');
      if (!onboarded) setShowOnboarding(true);
    }
  }, []);

  const fetchHearts = useCallback(async (cursor?: string) => {
    const params = new URLSearchParams();
    if (cursor) params.set('cursor', cursor);
    params.set('limit', '20');

    const res = await fetch(`/api/hearts?${params}`);
    if (res.ok) {
      const data = await res.json();
      if (cursor) {
        setHearts(prev => [...prev, ...data.items]);
      } else {
        setHearts(data.items);
      }
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchHearts(); }, [fetchHearts]);
  useEffect(() => {
    fetch('/api/analytics/dashboard').then(r => r.ok ? r.json() : null).then(setStats);
  }, []);

  // Poll every 30s
  useEffect(() => {
    const interval = setInterval(() => fetchHearts(), 30000);
    return () => clearInterval(interval);
  }, [fetchHearts]);

  const handleHeartSent = () => fetchHearts();
  const firstName = session?.user?.name?.split(' ')[0] || 'there';

  return (
    <DashboardLayout type="employee">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Welcome header */}
        <div>
          <h1 className="text-2xl font-bold text-primary">Hey {firstName}! 👋</h1>
          <p className="text-sm text-secondary mt-1">See how your team is recognizing great work</p>
        </div>

        {/* Quick Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Hearts (30d)', value: stats.heartsThisMonth, icon: Heart, color: '--color-heart' },
              { label: 'Active Goals', value: stats.activeGoals, icon: Target, color: '--color-goal-active' },
              { label: 'Upcoming Events', value: stats.upcomingEvents, icon: Calendar, color: '--color-accent' },
              { label: 'Review Cycles', value: stats.activeCycles, icon: ClipboardCheck, color: '--color-review' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-surface-elevated rounded-xl border border-theme p-3 shadow-theme-sm">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `rgba(var(${color}),0.1)` }}>
                    <Icon className="w-4.5 h-4.5" style={{ color: `rgb(var(${color}))` }} />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-primary leading-tight">{value}</p>
                    <p className="text-2xs text-tertiary">{label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Feed */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-surface-elevated rounded-2xl border border-theme p-5 shadow-theme-sm animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-surface-secondary" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-4 bg-surface-secondary rounded w-3/4" />
                    <div className="h-3 bg-surface-secondary rounded w-1/3" />
                  </div>
                </div>
                <div className="h-3 bg-surface-secondary rounded w-full" />
              </div>
            ))}
          </div>
        ) : hearts.length === 0 ? (
          <div className="text-center py-16 bg-surface-elevated rounded-2xl border border-theme">
            <div className="w-20 h-20 rounded-full bg-[rgba(var(--color-heart),0.1)] flex items-center justify-center mx-auto mb-4">
              <Heart className="w-10 h-10 text-[rgb(var(--color-heart))]" />
            </div>
            <h3 className="text-lg font-semibold text-primary mb-2">No Hearts yet</h3>
            <p className="text-sm text-secondary mb-1">Be the first to recognize someone!</p>
            <p className="text-xs text-tertiary">Click the pink heart button below</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {hearts.map((heart) => (
                <HeartCard key={heart.id} heart={heart} />
              ))}
            </div>

            {hasMore && (
              <div className="text-center pt-4 pb-2">
                <button
                  onClick={() => nextCursor && fetchHearts(nextCursor)}
                  className="px-6 py-2.5 bg-surface-elevated border border-theme text-sm font-medium text-secondary rounded-xl hover:bg-surface-secondary hover:text-primary focus-ring transition-colors"
                >
                  Load more hearts
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <HeartButton onHeartSent={handleHeartSent} />

      {showOnboarding && (
        <OnboardingWizard onComplete={() => { setShowOnboarding(false); fetchHearts(); }} />
      )}
    </DashboardLayout>
  );
}

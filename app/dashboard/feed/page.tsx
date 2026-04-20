'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import HeartButton from '@/app/components/hearts/HeartButton';
import HeartCard from '@/app/components/hearts/HeartCard';
import OnboardingWizard from '@/app/components/onboarding/OnboardingWizard';
import { Heart, Target, Calendar, ClipboardCheck } from 'lucide-react';
import PageSkeleton from '@/app/components/shared/PageSkeleton';
import StatGrid from '@/app/components/shared/StatGrid';
import EmptyState2 from '@/app/components/shared/EmptyState2';

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

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch('/api/hearts?limit=20').then(r => r.ok ? r.json() : null),
      fetch('/api/analytics/dashboard').then(r => r.ok ? r.json() : null),
    ]).then(([heartsData, statsData]) => {
      if (cancelled) return;
      if (heartsData) {
        setHearts(heartsData.items);
        setNextCursor(heartsData.nextCursor);
        setHasMore(heartsData.hasMore);
      }
      if (statsData) setStats(statsData);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => fetchHearts(), 120000);
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
          <StatGrid stats={[
            { label: 'Hearts (30d)', value: stats.heartsThisMonth, icon: Heart, color: '--color-heart' },
            { label: 'Active Goals', value: stats.activeGoals, icon: Target, color: '--color-goal-active' },
            { label: 'Upcoming Events', value: stats.upcomingEvents, icon: Calendar, color: '--color-accent' },
            { label: 'Review Cycles', value: stats.activeCycles, icon: ClipboardCheck, color: '--color-review' },
          ]} />
        )}

        {/* Feed */}
        {loading ? (
          <PageSkeleton type="feed" count={3} />
        ) : hearts.length === 0 ? (
          <EmptyState2 icon={Heart} title="No Hearts yet" description="Be the first to recognize someone! Click the pink heart button below." color="--color-heart" />
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

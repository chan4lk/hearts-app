'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { PageHeader } from '@/app/components/shared/PageHeader';
import HeartButton from '@/app/components/hearts/HeartButton';
import HeartCard from '@/app/components/hearts/HeartCard';
import OnboardingWizard from '@/app/components/onboarding/OnboardingWizard';
import { Heart } from 'lucide-react';

interface HeartItem {
  id: string;
  message: string | null;
  createdAt: string;
  sender: { id: string; name: string; department: string | null };
  receiver: { id: string; name: string; department: string | null };
  valueTag: { id: string; name: string };
}

export default function FeedPage() {
  const [hearts, setHearts] = useState<HeartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check if first-time user
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
    fetchHearts();
  }, [fetchHearts]);

  // Poll for new hearts every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      fetchHearts();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchHearts]);

  const handleHeartSent = () => {
    // Refresh feed after sending a heart
    fetchHearts();
  };

  return (
    <DashboardLayout type="employee">
      <div className="max-w-2xl mx-auto space-y-6">
        <PageHeader title="Hearts Feed" description="See how your team recognizes each other" />

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-surface-elevated rounded-xl border border-theme p-4 shadow-theme-sm animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-surface-secondary" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-surface-secondary rounded w-2/3" />
                    <div className="h-3 bg-surface-secondary rounded w-1/4" />
                    <div className="h-3 bg-surface-secondary rounded w-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : hearts.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="w-16 h-16 text-tertiary mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-primary mb-2">No Hearts yet</h3>
            <p className="text-sm text-secondary mb-4">Be the first to recognize someone!</p>
            <p className="text-xs text-tertiary">Click the heart button below to give your first Heart</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {hearts.map((heart) => (
                <HeartCard key={heart.id} heart={heart} />
              ))}
            </div>

            {hasMore && (
              <div className="text-center pt-4">
                <button
                  onClick={() => nextCursor && fetchHearts(nextCursor)}
                  className="px-6 py-2 bg-surface-secondary text-sm font-medium text-secondary rounded-lg hover:bg-surface-tertiary focus-ring"
                >
                  Load more
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating Heart Button — always visible */}
      <HeartButton onHeartSent={handleHeartSent} />

      {/* Onboarding wizard for first-time users */}
      {showOnboarding && (
        <OnboardingWizard onComplete={() => { setShowOnboarding(false); fetchHearts(); }} />
      )}
    </DashboardLayout>
  );
}

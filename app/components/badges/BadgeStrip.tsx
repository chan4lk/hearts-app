'use client';

import { useEffect, useState } from 'react';
import {
  Flag,
  CheckCircle2,
  Trophy,
  Crown,
  Clock,
  Heart,
  Award,
  Sparkles,
  Compass,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface EarnedBadge {
  kind: string;
  title: string;
  description: string;
  tier: string;
  icon: string;
  color: string;
  earnedAt: string | null;
  earned: boolean;
}

const ICONS: Record<string, LucideIcon> = {
  Flag, CheckCircle2, Trophy, Crown, Clock, Heart, Award, Sparkles, Compass, Users,
};

// Sort by tier (rarest first), then by earned date (newest first)
const TIER_WEIGHT: Record<string, number> = {
  platinum: 4, gold: 3, silver: 2, bronze: 1,
};

interface Props {
  userId: string;
  /** Max badges to show inline; rest collapsed into "+N". */
  maxVisible?: number;
  /** Scroll to `id` when the strip is clicked (e.g., the BadgeWall). */
  scrollToId?: string;
}

export default function BadgeStrip({ userId, maxVisible = 6, scrollToId }: Props) {
  const [earned, setEarned] = useState<EarnedBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/users/${encodeURIComponent(userId)}/badges`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled) return;
        const list = (d?.badges ?? []) as EarnedBadge[];
        const earnedOnly = list
          .filter((b) => b.earned)
          .sort((a, b) => {
            const tw = (TIER_WEIGHT[b.tier] ?? 0) - (TIER_WEIGHT[a.tier] ?? 0);
            if (tw !== 0) return tw;
            return (b.earnedAt || '').localeCompare(a.earnedAt || '');
          });
        setEarned(earnedOnly);
        setLoading(false);
      })
      .catch(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (loading || earned.length === 0) return null;

  const visible = earned.slice(0, maxVisible);
  const hiddenCount = earned.length - visible.length;

  const handleClick = () => {
    if (scrollToId) {
      const el = document.getElementById(scrollToId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 focus-ring rounded-lg p-1 -m-1 hover:bg-surface-secondary transition-colors"
      aria-label={`${earned.length} badges earned`}
      title={`${earned.length} badge${earned.length === 1 ? '' : 's'} earned — click to view`}
    >
      <div className="flex -space-x-1.5">
        {visible.map((b) => {
          const Icon = ICONS[b.icon] || Trophy;
          return (
            <div
              key={b.kind}
              className="w-7 h-7 rounded-full flex items-center justify-center ring-2 ring-[rgb(var(--color-surface-primary))]"
              style={{ backgroundColor: `rgba(var(${b.color}),0.18)` }}
              title={`${b.title}${b.earnedAt ? ` · ${new Date(b.earnedAt).toLocaleDateString()}` : ''} — ${b.description}`}
            >
              <Icon className="w-3.5 h-3.5" style={{ color: `rgb(var(${b.color}))` }} />
            </div>
          );
        })}
      </div>
      {hiddenCount > 0 && (
        <span className="text-2xs font-bold text-tertiary">+{hiddenCount}</span>
      )}
      <span className="text-2xs font-semibold text-tertiary ml-0.5">
        {earned.length} badge{earned.length === 1 ? '' : 's'}
      </span>
    </button>
  );
}

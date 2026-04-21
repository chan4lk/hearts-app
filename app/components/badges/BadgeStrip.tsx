'use client';

import { useEffect, useState } from 'react';
import {
  Rocket,
  Target,
  Medal,
  Crown,
  Zap,
  Map,
  ThumbsUp,
  Heart,
  HeartHandshake,
  Gem,
  Shield,
  HandHeart,
  GraduationCap,
  Trophy,
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
  Rocket, Target, Medal, Crown, Zap, Map, ThumbsUp,
  Heart, HeartHandshake, Gem, Shield, HandHeart, GraduationCap, Trophy,
};

const TIER_RING: Record<string, string> = {
  bronze: 'ring-2',
  silver: 'ring-2',
  gold: 'ring-[3px]',
  platinum: 'ring-[3px] ring-offset-1 ring-offset-[rgb(var(--color-surface-primary))]',
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
          const ringSize = TIER_RING[b.tier] ?? 'ring-2';
          return (
            <div
              key={b.kind}
              className={`w-8 h-8 rounded-full flex items-center justify-center shadow-theme-sm ${ringSize}`}
              style={{
                backgroundColor: `rgba(var(${b.color}),0.2)`,
                boxShadow: `0 0 0 2px rgb(var(${b.color})), 0 0 0 4px rgb(var(--color-surface-primary))`,
              }}
              title={`${b.title} · ${b.tier} tier${b.earnedAt ? ` · earned ${new Date(b.earnedAt).toLocaleDateString()}` : ''} — ${b.description}`}
            >
              <Icon className="w-4 h-4" style={{ color: `rgb(var(${b.color}))` }} strokeWidth={2.3} />
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

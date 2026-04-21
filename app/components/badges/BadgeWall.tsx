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
  Lock,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface BadgeRow {
  kind: string;
  title: string;
  description: string;
  tier: string;
  icon: string;
  color: string;
  target: number;
  category: string;
  earnedAt: string | null;
  earned: boolean;
  current: number;
  percent: number;
}

interface BadgesResponse {
  user: { id: string; name: string };
  badges: BadgeRow[];
  earnedCount: number;
  totalCount: number;
}

const ICONS: Record<string, LucideIcon> = {
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
};

const CATEGORY_LABELS: Record<string, string> = {
  goals: 'Goals',
  recognition: 'Recognition',
  leadership: 'Leadership',
};

export default function BadgeWall({ userId }: { userId: string }) {
  const [data, setData] = useState<BadgesResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/users/${encodeURIComponent(userId)}/badges`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (loading) {
    return (
      <div className="card-stat">
        <h3 className="text-sm font-semibold text-primary mb-3">Achievements</h3>
        <p className="text-xs text-tertiary">Loading badges…</p>
      </div>
    );
  }
  if (!data) return null;

  const grouped = data.badges.reduce<Record<string, BadgeRow[]>>((acc, b) => {
    if (!acc[b.category]) acc[b.category] = [];
    acc[b.category].push(b);
    return acc;
  }, {});

  return (
    <div className="card-stat">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
          <Trophy className="w-4 h-4 text-[rgb(var(--color-warning))]" /> Achievements
        </h3>
        <p className="text-2xs text-tertiary">
          <strong className="text-primary">{data.earnedCount}</strong> / {data.totalCount} earned
        </p>
      </div>

      {Object.entries(grouped).map(([cat, list]) => (
        <div key={cat} className="mb-4 last:mb-0">
          <p className="text-2xs font-bold uppercase tracking-widest text-tertiary mb-2">
            {CATEGORY_LABELS[cat] || cat}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {list.map((b) => {
              const Icon = ICONS[b.icon] || Trophy;
              return (
                <div
                  key={b.kind}
                  className={`relative p-3 rounded-xl border border-theme ${
                    b.earned ? 'bg-surface-primary' : 'bg-surface-secondary opacity-70'
                  }`}
                  title={b.earned ? `Earned ${b.earnedAt ? new Date(b.earnedAt).toLocaleDateString() : ''}` : b.description}
                >
                  <div className="flex items-start gap-2 mb-1.5">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: b.earned
                          ? `rgba(var(${b.color}),0.15)`
                          : 'rgba(var(--color-surface-tertiary),0.5)',
                      }}
                    >
                      {b.earned ? (
                        <Icon className="w-4 h-4" style={{ color: `rgb(var(${b.color}))` }} />
                      ) : (
                        <Lock className="w-4 h-4 text-tertiary" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-primary truncate">{b.title}</p>
                      <p className="text-2xs text-tertiary capitalize">{b.tier}</p>
                    </div>
                  </div>
                  <p className="text-2xs text-secondary line-clamp-2 mb-1.5">{b.description}</p>
                  {!b.earned && (
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between text-2xs text-tertiary">
                        <span>Progress</span>
                        <span>
                          {b.current} / {b.target}
                        </span>
                      </div>
                      <div className="h-1 bg-surface-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${b.percent}%`,
                            backgroundColor: `rgb(var(${b.color}))`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                  {b.earned && b.earnedAt && (
                    <p className="text-2xs text-success font-medium">
                      ✓ Earned {new Date(b.earnedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

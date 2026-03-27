'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface HeartProfileProps {
  userId: string;
}

interface ProfileData {
  totalReceived: number;
  totalGiven: number;
  valueBreakdown: Record<string, number>;
  recentReceived: any[];
  recentGiven: any[];
}

export default function HeartProfile({ userId }: HeartProfileProps) {
  const [data, setData] = useState<ProfileData | null>(null);
  const [tab, setTab] = useState<'received' | 'given'>('received');

  useEffect(() => {
    fetch(`/api/hearts/profile/${userId}`).then(r => r.ok ? r.json() : null).then(setData);
  }, [userId]);

  if (!data) return <div className="animate-pulse h-32 bg-surface-secondary rounded-xl" />;

  const maxValue = Math.max(...Object.values(data.valueBreakdown), 1);

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface-elevated rounded-lg border border-theme p-3 text-center">
          <p className="text-2xl font-bold text-accent">{data.totalReceived}</p>
          <p className="text-xs text-secondary">Hearts Received</p>
        </div>
        <div className="bg-surface-elevated rounded-lg border border-theme p-3 text-center">
          <p className="text-2xl font-bold text-primary">{data.totalGiven}</p>
          <p className="text-xs text-secondary">Hearts Given</p>
        </div>
      </div>

      {/* Value breakdown */}
      {Object.keys(data.valueBreakdown).length > 0 && (
        <div className="bg-surface-elevated rounded-lg border border-theme p-4">
          <h4 className="text-sm font-semibold text-primary mb-3">Recognized For</h4>
          <div className="space-y-2">
            {Object.entries(data.valueBreakdown).sort((a, b) => b[1] - a[1]).map(([value, count]) => (
              <div key={value} className="flex items-center gap-3">
                <span className="text-xs font-medium text-secondary w-24 truncate">{value}</span>
                <div className="flex-1 h-6 bg-surface-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all duration-500"
                    style={{ width: `${(count / maxValue) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-primary w-6 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent hearts tabs */}
      <div className="bg-surface-elevated rounded-lg border border-theme overflow-hidden">
        <div className="flex border-b border-theme">
          {(['received', 'given'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 px-4 py-2.5 text-xs font-semibold transition-colors focus-ring ${
                tab === t ? 'text-accent border-b-2 border-accent' : 'text-secondary hover:text-primary'
              }`}
            >
              {t === 'received' ? 'Received' : 'Given'}
            </button>
          ))}
        </div>
        <div className="divide-y divide-[rgb(var(--color-border-theme))] max-h-[300px] overflow-y-auto">
          {(tab === 'received' ? data.recentReceived : data.recentGiven).map((h: any) => (
            <div key={h.id} className="px-4 py-3 flex items-center gap-3">
              <Heart className="w-4 h-4 text-accent flex-shrink-0" fill="currentColor" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-primary">
                  {tab === 'received' ? `From ${h.sender?.name}` : `To ${h.receiver?.name}`}
                </p>
                <p className="text-xs text-tertiary">{h.valueTag?.name} · {formatDistanceToNow(new Date(h.createdAt), { addSuffix: true })}</p>
              </div>
            </div>
          ))}
          {(tab === 'received' ? data.recentReceived : data.recentGiven).length === 0 && (
            <p className="text-center text-xs text-tertiary py-6">No hearts yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

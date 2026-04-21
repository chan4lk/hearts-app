'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import HeartButton from '@/app/components/hearts/HeartButton';
import PageSkeleton from '@/app/components/shared/PageSkeleton';
import { motion } from 'framer-motion';
import { Heart, ArrowLeft, Mail, Building2, Calendar } from 'lucide-react';
import BadgeWall from '@/app/components/badges/BadgeWall';
import BadgeStrip from '@/app/components/badges/BadgeStrip';
import { formatDistanceToNow } from 'date-fns';

interface HeartItem {
  id: string;
  message: string | null;
  createdAt: string;
  valueTag: { id: string; name: string };
  sender?: { id: string; name: string; department: string | null };
  receiver?: { id: string; name: string; department: string | null };
}

interface ProfileData {
  user: {
    id: string;
    name: string;
    email: string;
    department: string | null;
    position: string | null;
    isActive: boolean;
    createdAt: string;
  };
  totalReceived: number;
  totalGiven: number;
  valueBreakdown: Record<string, number>;
  topSenders: { id: string; name: string; department: string | null; count: number }[];
  recentReceived: HeartItem[];
  recentGiven: HeartItem[];
}

function Avatar({ name, size = 'lg' }: { name: string; size?: 'md' | 'lg' }) {
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  const sizeClass = size === 'lg' ? 'w-16 h-16 text-lg' : 'w-10 h-10 text-sm';
  return (
    <div
      className={`${sizeClass} rounded-full bg-gradient-to-br from-[rgb(var(--color-heart))] to-[rgb(var(--color-accent))] flex items-center justify-center font-bold text-[rgb(var(--color-text-inverse))] flex-shrink-0 shadow-sm`}
    >
      {initials}
    </div>
  );
}

export default function HeartsProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { data: session } = useSession();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState<'received' | 'given'>('received');

  useEffect(() => {
    fetch(`/api/hearts/profile/${userId}`)
      .then(async (r) => {
        if (r.status === 404) {
          setNotFound(true);
          return null;
        }
        return r.ok ? r.json() : null;
      })
      .then((d) => {
        if (d) setData(d);
        setLoading(false);
      });
  }, [userId]);

  if (loading) {
    return (
      <DashboardLayout type="employee">
        <div className="max-w-3xl mx-auto pt-4">
          <PageSkeleton type="detail" />
        </div>
      </DashboardLayout>
    );
  }

  if (notFound || !data) {
    return (
      <DashboardLayout type="employee">
        <div className="max-w-3xl mx-auto text-center py-16">
          <div className="empty-icon-ring mx-auto mb-4" style={{ backgroundColor: 'rgba(var(--color-heart),0.1)' }}>
            <Heart className="w-10 h-10" style={{ color: 'rgb(var(--color-heart))' }} />
          </div>
          <p className="text-lg font-semibold text-primary">User not found</p>
          <p className="text-sm text-secondary mt-1">This profile doesn't exist or you don't have access.</p>
          <Link href="/dashboard/feed" className="btn-primary inline-flex items-center gap-2 mt-5">
            <ArrowLeft className="w-4 h-4" /> Back to Feed
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const { user, totalReceived, totalGiven, valueBreakdown, topSenders, recentReceived, recentGiven } = data;
  const isMe = user.id === session?.user?.id;
  const canGiveHeart = !isMe && user.isActive;
  const maxValue = Math.max(...Object.values(valueBreakdown), 1);
  const valueEntries = Object.entries(valueBreakdown).sort((a, b) => b[1] - a[1]);
  const currentList = tab === 'received' ? recentReceived : recentGiven;

  return (
    <DashboardLayout type="employee">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/feed" className="text-secondary hover:text-primary focus-ring rounded p-1">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-semibold text-primary">
            {isMe ? 'My Hearts' : 'Hearts Profile'}
          </h1>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-interactive p-6"
        >
          <div className="flex items-start gap-4">
            <Avatar name={user.name} size="lg" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-primary">{user.name}</h2>
                {!user.isActive && (
                  <span className="badge-base bg-warning-muted text-warning">Inactive</span>
                )}
                {isMe && <span className="badge-base bg-accent-muted text-accent">You</span>}
              </div>
              {user.position && (
                <p className="text-sm text-secondary mt-0.5">{user.position}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-tertiary mt-2 flex-wrap">
                <span className="inline-flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" /> {user.email}
                </span>
                {user.department && (
                  <span className="inline-flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" /> {user.department}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> joined{' '}
                  {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                </span>
              </div>
              <div className="mt-3">
                <BadgeStrip userId={user.id} scrollToId="badge-wall" />
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 gap-3">
          <div className="card-stat text-center">
            <p className="text-3xl font-bold" style={{ color: 'rgb(var(--color-heart))' }}>
              {totalReceived}
            </p>
            <p className="text-xs text-tertiary mt-1 inline-flex items-center gap-1 justify-center">
              <Heart className="w-3 h-3" fill="currentColor" style={{ color: 'rgb(var(--color-heart))' }} /> Received
            </p>
          </div>
          <div className="card-stat text-center">
            <p className="text-3xl font-bold text-primary">{totalGiven}</p>
            <p className="text-xs text-tertiary mt-1 inline-flex items-center gap-1 justify-center">
              <Heart className="w-3 h-3" /> Given
            </p>
          </div>
        </div>

        <BadgeWall userId={user.id} id="badge-wall" />

        {valueEntries.length > 0 && (
          <div className="card-section p-5">
            <h3 className="text-sm font-bold text-primary mb-4">
              {isMe ? 'Recognized for' : `${user.name.split(' ')[0]} recognized for`}
            </h3>
            <div className="space-y-2.5">
              {valueEntries.map(([value, count]) => (
                <div key={value} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-secondary w-32 truncate">{value}</span>
                  <div className="flex-1 h-6 bg-surface-secondary rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(count / maxValue) * 100}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: 'rgb(var(--color-heart))' }}
                    />
                  </div>
                  <span className="text-xs font-bold text-primary w-6 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {topSenders.length > 0 && (
          <div className="card-section p-5">
            <h3 className="text-sm font-bold text-primary mb-4">
              {isMe ? 'Your top supporters' : 'Top supporters'}
            </h3>
            <div className="space-y-2">
              {topSenders.map((s) => (
                <Link
                  key={s.id}
                  href={`/dashboard/hearts/${s.id}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-secondary transition-colors focus-ring"
                >
                  <Avatar name={s.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-primary">{s.name}</p>
                    {s.department && <p className="text-xs text-tertiary">{s.department}</p>}
                  </div>
                  <span className="text-xs font-bold text-primary inline-flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5" fill="currentColor" style={{ color: 'rgb(var(--color-heart))' }} />
                    {s.count}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="card-section overflow-hidden">
          <div className="flex border-b border-theme">
            {(['received', 'given'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 px-4 py-3 text-xs font-semibold transition-colors focus-ring ${
                  tab === t
                    ? 'text-accent border-b-2 border-accent bg-accent-muted/30'
                    : 'text-secondary hover:text-primary'
                }`}
              >
                {t === 'received' ? `Received (${recentReceived.length})` : `Given (${recentGiven.length})`}
              </button>
            ))}
          </div>
          <div className="divide-y divide-[rgb(var(--color-border-primary))] max-h-[500px] overflow-y-auto">
            {currentList.length === 0 ? (
              <div className="text-center py-10">
                <Heart className="w-8 h-8 text-tertiary mx-auto mb-2 opacity-50" />
                <p className="text-sm text-secondary">
                  {tab === 'received'
                    ? isMe
                      ? "You haven't received any hearts yet"
                      : `${user.name.split(' ')[0]} hasn't received any hearts yet`
                    : isMe
                      ? "You haven't given any hearts yet"
                      : `${user.name.split(' ')[0]} hasn't given any hearts yet`}
                </p>
              </div>
            ) : (
              currentList.map((h) => {
                const other = tab === 'received' ? h.sender : h.receiver;
                if (!other) return null;
                return (
                  <div key={h.id} className="px-5 py-3 flex items-start gap-3">
                    <Avatar name={other.name} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-tertiary">
                          {tab === 'received' ? 'From' : 'To'}
                        </span>
                        <Link
                          href={`/dashboard/hearts/${other.id}`}
                          className="text-sm font-semibold text-primary hover:text-accent focus-ring rounded"
                        >
                          {other.name}
                        </Link>
                        <span className="badge-heart text-2xs">
                          <Heart className="w-2.5 h-2.5" fill="currentColor" />
                          {h.valueTag.name}
                        </span>
                      </div>
                      {h.message && (
                        <p className="text-sm text-secondary mt-1 pl-0.5 border-l-2 border-[rgba(var(--color-heart),0.2)] ml-0.5 pl-3">
                          {h.message}
                        </p>
                      )}
                      <p className="text-2xs text-tertiary mt-1">
                        {formatDistanceToNow(new Date(h.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {canGiveHeart && (
          <div className="card-interactive p-5 text-center bg-[rgba(var(--color-heart),0.04)]">
            <Heart className="w-8 h-8 mx-auto mb-2" style={{ color: 'rgb(var(--color-heart))' }} fill="currentColor" />
            <p className="text-sm font-medium text-primary">
              Show {user.name.split(' ')[0]} some appreciation
            </p>
            <p className="text-xs text-tertiary mt-1">
              Use the Heart button (bottom right) to send recognition
            </p>
          </div>
        )}
      </div>
      <HeartButton />
    </DashboardLayout>
  );
}

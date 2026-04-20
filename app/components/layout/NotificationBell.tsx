'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Heart, Target, ClipboardCheck, Calendar, Inbox } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  entityType: string | null;
  entityId: string | null;
  readAt: string | null;
  createdAt: string;
}

const TYPE_ICON: Record<string, { Icon: any; color: string }> = {
  HEART_RECEIVED: { Icon: Heart, color: 'rgb(var(--color-heart))' },
  GOAL_APPROVED: { Icon: Target, color: 'rgb(var(--color-goal-completed))' },
  GOAL_NEEDS_REVISION: { Icon: Target, color: 'rgb(var(--color-goal-revision))' },
  REVIEW_DELIVERED: { Icon: ClipboardCheck, color: 'rgb(var(--color-review))' },
  REVIEW_DUE: { Icon: ClipboardCheck, color: 'rgb(var(--color-review))' },
  EVENT_INVITE: { Icon: Calendar, color: 'rgb(var(--color-accent))' },
};

function notificationHref(n: Notification): string | null {
  if (!n.entityType || !n.entityId) return null;
  if (n.entityType === 'GOAL') return `/dashboard/goals/${n.entityId}`;
  if (n.entityType === 'REVIEW') return `/dashboard/reviews/${n.entityId}`;
  if (n.entityType === 'HEART') return `/dashboard/feed`;
  if (n.entityType === 'EVENT') return `/dashboard/events`;
  return null;
}

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/count');
      if (res.ok) {
        const { unread: u } = await res.json();
        setUnread(u);
      }
    } catch {
      // silent
    }
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications?limit=15');
      if (res.ok) setItems(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCount();
    const i = setInterval(fetchCount, 60000);
    return () => clearInterval(i);
  }, [fetchCount]);

  useEffect(() => {
    if (open) fetchItems();
  }, [open, fetchItems]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || buttonRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  const markRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'POST' }).catch(() => {});
    setItems((prev) => prev.map((n) => (n.id === id && !n.readAt ? { ...n, readAt: new Date().toISOString() } : n)));
    setUnread((u) => Math.max(0, u - 1));
  };

  const markAllRead = async () => {
    const res = await fetch('/api/notifications/read-all', { method: 'POST' });
    if (res.ok) {
      const now = new Date().toISOString();
      setItems((prev) => prev.map((n) => (n.readAt ? n : { ...n, readAt: now })));
      setUnread(0);
    }
  };

  const handleClick = async (n: Notification) => {
    const href = notificationHref(n);
    if (!n.readAt) await markRead(n.id);
    if (href) {
      setOpen(false);
      router.push(href);
    }
  };

  const badge = unread > 99 ? '99+' : unread > 0 ? String(unread) : null;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl text-secondary hover:text-primary hover:bg-surface-secondary focus-ring transition-colors"
        aria-label={`Notifications${badge ? ` (${badge} unread)` : ''}`}
        aria-expanded={open}
      >
        <Bell className="w-5 h-5" />
        {badge && (
          <span
            className="absolute top-0 right-0 min-w-[18px] h-[18px] px-1 rounded-full bg-[rgb(var(--color-error))] text-[rgb(var(--color-text-inverse))] text-2xs font-bold flex items-center justify-center shadow-sm"
            aria-hidden="true"
          >
            {badge}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-[360px] max-w-[calc(100vw-2rem)] bg-surface-elevated border border-theme rounded-2xl shadow-theme-xl z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-theme">
              <h3 className="text-sm font-bold text-primary flex items-center gap-2">
                <Bell className="w-4 h-4 text-accent" /> Notifications
                {unread > 0 && (
                  <span className="text-2xs font-semibold px-1.5 py-0.5 rounded-full bg-accent-muted text-accent">
                    {unread} new
                  </span>
                )}
              </h3>
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-2xs font-medium text-accent hover:underline focus-ring rounded px-1"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-[420px] overflow-y-auto">
              {loading && items.length === 0 ? (
                <div className="py-8 text-center text-xs text-tertiary">Loading...</div>
              ) : items.length === 0 ? (
                <div className="py-10 text-center">
                  <Inbox className="w-10 h-10 text-tertiary mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-secondary">You're all caught up</p>
                  <p className="text-xs text-tertiary mt-0.5">No notifications yet</p>
                </div>
              ) : (
                <ul className="divide-y divide-[rgb(var(--color-border-primary))]">
                  {items.map((n) => {
                    const typeCfg = TYPE_ICON[n.type] || { Icon: Bell, color: 'rgb(var(--color-accent))' };
                    const Icon = typeCfg.Icon;
                    const isUnread = !n.readAt;
                    const hasLink = !!notificationHref(n);
                    return (
                      <li key={n.id}>
                        <button
                          onClick={() => handleClick(n)}
                          className={`w-full text-left px-4 py-3 flex gap-3 items-start transition-colors focus-ring ${
                            isUnread ? 'bg-accent-muted/30 hover:bg-accent-muted/50' : 'hover:bg-surface-secondary'
                          } ${hasLink ? 'cursor-pointer' : 'cursor-default'}`}
                        >
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ backgroundColor: `rgba(${typeCfg.color.replace('rgb(', '').replace(')', '')}, 0.12)` }}
                          >
                            <Icon className="w-4 h-4" style={{ color: typeCfg.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={`text-sm leading-tight ${isUnread ? 'font-semibold text-primary' : 'text-secondary'}`}>
                                {n.title}
                              </p>
                              {isUnread && (
                                <span
                                  className="w-2 h-2 rounded-full bg-accent flex-shrink-0 mt-1.5"
                                  aria-label="Unread"
                                />
                              )}
                            </div>
                            {n.message && (
                              <p className="text-xs text-tertiary mt-0.5 line-clamp-2">{n.message}</p>
                            )}
                            <p className="text-2xs text-tertiary mt-1">
                              {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <div className="px-4 py-2 border-t border-theme bg-surface-secondary text-center">
                <p className="text-2xs text-tertiary inline-flex items-center gap-1">
                  <Check className="w-3 h-3" /> Showing your {items.length} most recent
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

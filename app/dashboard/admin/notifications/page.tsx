'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import PageTitle from '@/app/components/shared/PageTitle';
import StatGrid from '@/app/components/shared/StatGrid';
import PageSkeleton from '@/app/components/shared/PageSkeleton';
import { Mail, Send, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string; type: string; subject: string; body: string; status: string;
  scheduledAt: string; sentAt: string | null;
  recipient: { name: string; email: string };
}

const STATUS_STYLES: Record<string, { className: string; label: string }> = {
  SENT: { className: 'text-success bg-success-muted', label: 'Sent' },
  PENDING: { className: 'text-warning bg-warning-muted', label: 'Pending' },
  FAILED: { className: 'text-error bg-error-muted', label: 'Failed' },
};

const TYPE_EMOJI: Record<string, string> = {
  HEART_RECEIVED: '♥',
  GOAL_APPROVED: '✓',
  GOAL_NEEDS_REVISION: '↩',
  REVIEW_DUE: '📋',
  REVIEW_DELIVERED: '📊',
  EVENT_INVITE: '📅',
};

export default function AdminNotificationsPage() {
  const [data, setData] = useState<{ notifications: Notification[]; stats: any } | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    fetch(`/api/admin/notifications?${params}`).then(r => r.ok ? r.json() : null).then(d => { setData(d); setLoading(false); });
  }, [statusFilter]);

  const hasResend = data && data.stats.sent > 0;

  return (
    <DashboardLayout type="admin">
      <div className="max-w-5xl mx-auto space-y-6">
        <PageTitle title="Email Notifications" subtitle="View sent, pending, and failed email notifications" icon={Mail} iconColor="--color-accent" />

        {/* Setup guide if no emails sent */}
        {!loading && data && data.stats.total === 0 && (
          <div className="card-interactive p-5 border-l-4 border-[rgb(var(--color-warning))]">
            <h3 className="text-sm font-semibold text-primary mb-2">Email Service Setup</h3>
            <p className="text-xs text-secondary mb-3">Choose one provider. Add to your <code className="px-1 py-0.5 bg-surface-secondary rounded text-primary">.env</code> file:</p>

            <div className="space-y-3">
              <div className="p-3 bg-surface-secondary rounded-lg">
                <p className="text-xs font-semibold text-primary mb-1">Option A: Azure Communication Services (recommended)</p>
                <pre className="text-2xs text-secondary overflow-x-auto">{`EMAIL_PROVIDER=azure
AZURE_COMM_CONNECTION_STRING=endpoint=https://xxx.communication.azure.com/;accesskey=xxx
EMAIL_FROM=DoNotReply@xxxxxxxx.azurecomm.net`}</pre>
              </div>

              <div className="p-3 bg-surface-secondary rounded-lg">
                <p className="text-xs font-semibold text-primary mb-1">Option B: Resend</p>
                <pre className="text-2xs text-secondary overflow-x-auto">{`EMAIL_PROVIDER=resend
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=AspireHub <noreply@yourdomain.com>`}</pre>
              </div>

              <div className="p-3 bg-surface-secondary rounded-lg">
                <p className="text-xs font-semibold text-primary mb-1">Development / Testing</p>
                <pre className="text-2xs text-secondary overflow-x-auto">{`EMAIL_MODE=log   # prints to console
EMAIL_MODE=off   # disables completely`}</pre>
              </div>
            </div>

            <p className="text-2xs text-tertiary mt-2">Without a provider configured, emails save to database only (this page shows them).</p>
          </div>
        )}

        {/* Stats */}
        {!loading && data && (
          <StatGrid stats={[
            { label: 'Total Emails', value: data.stats.total, icon: Mail, color: '--color-accent' },
            { label: 'Sent', value: data.stats.sent, icon: CheckCircle, color: '--color-goal-completed' },
            { label: 'Pending', value: data.stats.pending, icon: Clock, color: '--color-warning' },
            { label: 'Failed', value: data.stats.failed, icon: AlertTriangle, color: '--color-error' },
          ]} />
        )}

        {/* Filter tabs */}
        <div className="flex gap-1.5">
          {['', 'SENT', 'PENDING', 'FAILED'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold focus-ring transition-all ${
                statusFilter === s ? 'bg-accent text-[rgb(var(--color-text-inverse))] shadow-sm' : 'bg-surface-elevated border border-theme text-secondary hover:text-primary'
              }`}>
              {s || 'All'}
            </button>
          ))}
        </div>

        {/* Notification list */}
        {loading ? (
          <PageSkeleton type="table" count={5} />
        ) : !data || data.notifications.length === 0 ? (
          <div className="empty-container">
            <div className="empty-icon-ring bg-accent-muted"><Mail className="w-10 h-10 text-accent" /></div>
            <p className="empty-title">No notifications yet</p>
            <p className="empty-description">Email notifications will appear here when hearts are given, goals are approved, or reviews are delivered.</p>
          </div>
        ) : (
          <div className="card-section overflow-y-auto" style={{ maxHeight: '60vh' }}>
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-surface-secondary">
                <tr className="border-b border-theme">
                  <th className="text-left px-4 py-3 text-2xs font-semibold text-secondary uppercase tracking-wider w-[5%]"></th>
                  <th className="text-left px-4 py-3 text-2xs font-semibold text-secondary uppercase tracking-wider w-[20%]">To</th>
                  <th className="text-left px-4 py-3 text-2xs font-semibold text-secondary uppercase tracking-wider w-[35%]">Subject</th>
                  <th className="text-left px-4 py-3 text-2xs font-semibold text-secondary uppercase tracking-wider w-[12%]">Type</th>
                  <th className="text-left px-4 py-3 text-2xs font-semibold text-secondary uppercase tracking-wider w-[12%]">Status</th>
                  <th className="text-left px-4 py-3 text-2xs font-semibold text-secondary uppercase tracking-wider w-[16%]">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgb(var(--color-border-theme))]">
                {data.notifications.map(n => {
                  const statusStyle = STATUS_STYLES[n.status] || STATUS_STYLES.PENDING;
                  return (
                    <tr key={n.id} className="hover:bg-surface-secondary transition-colors">
                      <td className="px-4 py-3 text-center">{TYPE_EMOJI[n.type] || '📬'}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-primary truncate">{n.recipient.name}</p>
                        <p className="text-2xs text-tertiary truncate">{n.recipient.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-primary truncate">{n.subject}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-2xs text-tertiary">{n.type.replace(/_/g, ' ')}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge-base ${statusStyle.className}`}>{statusStyle.label}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-tertiary">
                        {formatDistanceToNow(new Date(n.sentAt || n.scheduledAt), { addSuffix: true })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

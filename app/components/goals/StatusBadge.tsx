'use client';

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: string }> = {
  DRAFT: { label: 'Draft', className: 'bg-surface-secondary text-secondary', icon: '●' },
  PENDING: { label: 'Pending', className: 'bg-warning-muted text-warning', icon: '◷' },
  ACTIVE: { label: 'Active', className: 'bg-info-muted text-info', icon: '▶' },
  NEEDS_REVISION: { label: 'Needs Revision', className: 'bg-warning-muted text-warning', icon: '↩' },
  COMPLETED: { label: 'Completed', className: 'bg-success-muted text-success', icon: '✓' },
  CLOSED: { label: 'Closed', className: 'bg-surface-secondary text-tertiary', icon: '—' },
};

export default function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${config.className}`}>
      <span>{config.icon}</span> {config.label}
    </span>
  );
}

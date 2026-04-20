'use client';

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: string }> = {
  DRAFT: { label: 'Draft', bg: 'rgba(var(--color-goal-draft),0.12)', text: 'rgb(var(--color-goal-draft))', icon: '●' },
  PENDING: { label: 'Pending', bg: 'rgba(var(--color-goal-pending),0.12)', text: 'rgb(var(--color-goal-pending))', icon: '◷' },
  ACTIVE: { label: 'Active', bg: 'rgba(var(--color-goal-active),0.12)', text: 'rgb(var(--color-goal-active))', icon: '▶' },
  NEEDS_REVISION: { label: 'Needs Revision', bg: 'rgba(var(--color-goal-revision),0.12)', text: 'rgb(var(--color-goal-revision))', icon: '↩' },
  ON_HOLD: { label: 'On Hold', bg: 'rgba(var(--color-goal-hold),0.12)', text: 'rgb(var(--color-goal-hold))', icon: '⏸' },
  BLOCKED: { label: 'Blocked', bg: 'rgba(var(--color-goal-blocked),0.12)', text: 'rgb(var(--color-goal-blocked))', icon: '⛔' },
  COMPLETED: { label: 'Completed', bg: 'rgba(var(--color-goal-completed),0.12)', text: 'rgb(var(--color-goal-completed))', icon: '✓' },
  CLOSED: { label: 'Closed', bg: 'rgba(var(--color-goal-closed),0.12)', text: 'rgb(var(--color-goal-closed))', icon: '—' },
};

export default function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ backgroundColor: config.bg, color: config.text }}
    >
      <span className="text-[0.6rem] leading-none">{config.icon}</span>
      {config.label}
    </span>
  );
}

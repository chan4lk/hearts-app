'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import PageTitle from '@/app/components/shared/PageTitle';
import StatGrid from '@/app/components/shared/StatGrid';
import Modal from '@/app/components/shared/Modal';
import { Select, Input } from '@/app/components/shared/FormField';
import PageSkeleton from '@/app/components/shared/PageSkeleton';
import { Users, Shield, UserCheck, X, Upload, Download, UserX, Calendar, Search, Building2, Trophy, Bell, Check, Mail, UserPlus, Pencil } from 'lucide-react';
import { BADGE_LIST } from '@/lib/badgeCatalog';
import { formatDistanceToNow } from 'date-fns';

interface User {
  id: string; name: string; email: string; role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  jobCategory: string | null; appointmentDate: string | null; reviewMonth: string | null;
  nextReviewDate: string | null;
  lastReviewCompletedAt: string | null;
  reviewReminderSentAt: string | null;
  department: string | null; position: string | null; isActive: boolean;
  managerId: string | null; manager: { id: string; name: string } | null;
  lastLoginAt: string | null; createdAt: string;
  badges?: string[];
}

const ROLE_STYLES = { ADMIN: 'bg-error-muted text-error', MANAGER: 'bg-warning-muted text-warning', EMPLOYEE: 'bg-info-muted text-info' };

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [badgeFilter, setBadgeFilter] = useState('');
  const [showInactive, setShowInactive] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState<string>('EMPLOYEE');
  const [editManagerId, setEditManagerId] = useState<string>('');
  const [editDepartment, setEditDepartment] = useState<string>('');
  const [editPosition, setEditPosition] = useState<string>('');
  const [editJobCategory, setEditJobCategory] = useState<string>('');
  const [editAppointmentDate, setEditAppointmentDate] = useState<string>('');
  const [editReviewMonth, setEditReviewMonth] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ created: number; updated: number; errors: string[] } | null>(null);
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteResult, setInviteResult] = useState<{ sent: number; skipped: number; errors: string[] } | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteSelectedIds, setInviteSelectedIds] = useState<Set<string>>(new Set());
  // "+ New User" modal state
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'ADMIN' | 'MANAGER' | 'EMPLOYEE'>('EMPLOYEE');
  const [newUserDepartment, setNewUserDepartment] = useState('');
  const [newUserPosition, setNewUserPosition] = useState('');
  const [newUserManagerId, setNewUserManagerId] = useState('');
  const [newUserSendInvite, setNewUserSendInvite] = useState(true);
  const [newUserBusy, setNewUserBusy] = useState(false);
  const [newUserError, setNewUserError] = useState<string | null>(null);

  const [importPreview, setImportPreview] = useState<
    | {
        created: number;
        updated: number;
        skipped: number;
        errors: string[];
        preview: Array<{ email: string; name: string; action: 'create' | 'update' | 'skip'; reason?: string }>;
        rows: any[];
      }
    | null
  >(null);
  const [viewMode, setViewMode] = useState<'all' | 'review'>('all');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      } else {
        setUsers([]);
      }
    } catch {
      // Don't let a transient network error trap the page in its skeleton
      // state — show the empty list instead so users can retry with filters.
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => {
    if (!editingUser) return;
    setEditRole(editingUser.role);
    setEditManagerId(editingUser.managerId || '');
    setEditDepartment(editingUser.department || '');
    setEditPosition(editingUser.position || '');
    setEditJobCategory(editingUser.jobCategory || '');
    setEditAppointmentDate(
      editingUser.appointmentDate
        ? new Date(editingUser.appointmentDate).toISOString().split('T')[0]
        : ''
    );
    setEditReviewMonth(editingUser.reviewMonth || '');
  }, [editingUser]);

  const filteredUsers = users.filter(u => {
    if (!showInactive && !u.isActive) return false;
    if (roleFilter) {
      const r = roleFilter.toLowerCase();
      if (!u.role.toLowerCase().includes(r)) return false;
    }
    if (deptFilter) {
      const d = deptFilter.toLowerCase();
      const dept = (u.department ?? '').toLowerCase();
      if (!dept.includes(d)) return false;
    }
    if (badgeFilter) {
      const badges = u.badges || [];
      if (!badges.includes(badgeFilter)) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      const hay = `${u.name} ${u.email} ${u.department ?? ''} ${u.position ?? ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const departments = Array.from(new Set(users.map(u => u.department).filter(Boolean))).sort() as string[];

  const handleUpdate = async (userId: string, data: any) => {
    setSaving(true);
    const res = await fetch(`/api/admin/users/${userId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (res.ok) { await fetchUsers(); setEditingUser(null); }
    setSaving(false);
  };

  // CSV Import
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    setImportPreview(null);

    const text = await file.text();
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) { setImporting(false); return; }

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const rows = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const row: any = {};
      headers.forEach((h, i) => { row[h] = values[i] || ''; });
      return row;
    });

    // Step 1 — preview (no writes)
    const previewRes = await fetch('/api/admin/users/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows, mode: 'preview' }),
    });
    if (previewRes.ok) {
      const preview = await previewRes.json();
      setImportPreview({ ...preview, rows });
    }
    setImporting(false);
    e.target.value = ''; // reset file input
  };

  const openNewUserModal = () => {
    setNewUserName('');
    setNewUserEmail('');
    setNewUserRole('EMPLOYEE');
    setNewUserDepartment('');
    setNewUserPosition('');
    setNewUserManagerId('');
    setNewUserSendInvite(true);
    setNewUserError(null);
    setShowNewUserModal(true);
  };

  const submitNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) {
      setNewUserError('Name and email are required');
      return;
    }
    setNewUserBusy(true);
    setNewUserError(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUserName.trim(),
          email: newUserEmail.trim(),
          role: newUserRole,
          department: newUserDepartment.trim() || null,
          position: newUserPosition.trim() || null,
          managerId: newUserManagerId || null,
          sendInvitation: newUserSendInvite,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setShowNewUserModal(false);
        setInviteResult({
          sent: data.invited ? 1 : 0,
          skipped: data.invited ? 0 : (newUserSendInvite ? 1 : 0),
          errors: [],
        });
        await fetchUsers();
      } else {
        const d = await res.json().catch(() => ({}));
        setNewUserError(d.error || 'Failed to create user');
      }
    } catch {
      setNewUserError('Network error — please retry');
    } finally {
      setNewUserBusy(false);
    }
  };

  const openInviteModal = () => {
    const eligible = users.filter((u) => u.isActive && !u.lastLoginAt);
    if (eligible.length === 0) return;
    // Pre-select all eligible users by default — admin can uncheck any.
    setInviteSelectedIds(new Set(eligible.map((u) => u.id)));
    setInviteResult(null);
    setShowInviteModal(true);
  };

  const confirmSendInvitations = async () => {
    if (inviteSelectedIds.size === 0) return;
    setInviteBusy(true);
    setInviteResult(null);
    try {
      const res = await fetch('/api/admin/users/send-login-invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: Array.from(inviteSelectedIds) }),
      });
      if (res.ok) {
        const d = await res.json();
        setInviteResult(d);
        setShowInviteModal(false);
        // Refresh so newly-stamped lastLoginAt users drop out of the "Invite" count.
        await fetchUsers();
      }
    } finally {
      setInviteBusy(false);
    }
  };

  const confirmImport = async () => {
    if (!importPreview) return;
    setImporting(true);
    const res = await fetch('/api/admin/users/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows: importPreview.rows, mode: 'commit' }),
    });
    if (res.ok) {
      const result = await res.json();
      setImportResult(result);
      setImportPreview(null);
      await fetchUsers();
    }
    setImporting(false);
  };

  // CSV Export
  const handleExport = () => {
    const headers = ['Name','Email','Role','Department','Position','Job Category','Appointment Date','Review Month','Manager','Status'];
    const csvRows = [headers.join(',')];
    users.forEach(u => {
      csvRows.push([
        `"${u.name}"`, `"${u.email}"`, u.role, `"${u.department || ''}"`, `"${u.position || ''}"`,
        `"${u.jobCategory || ''}"`, u.appointmentDate ? new Date(u.appointmentDate).toISOString().split('T')[0] : '',
        `"${u.reviewMonth || ''}"`, `"${u.manager?.name || ''}"`, u.isActive ? 'Active' : 'Inactive',
      ].join(','));
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'aspirehub-users.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  // Calculate 6-month review eligibility date
  const getReviewDate = (appointmentDate: string | null): string | null => {
    if (!appointmentDate) return null;
    const d = new Date(appointmentDate);
    d.setMonth(d.getMonth() + 6);
    return d.toISOString();
  };

  const getReviewMonthFromDate = (appointmentDate: string | null): string | null => {
    if (!appointmentDate) return null;
    const d = new Date(appointmentDate);
    d.setMonth(d.getMonth() + 6);
    return d.toLocaleString('en', { month: 'long' });
  };

  const managers = users.filter(u => u.role === 'MANAGER' || u.role === 'ADMIN');
  const hasActiveFilters = !!(roleFilter || deptFilter || badgeFilter || search || !showInactive);

  return (
    <DashboardLayout type="admin">
      <div className="max-w-7xl mx-auto space-y-6">
        <datalist id="user-role-options">
          <option value="ADMIN" />
          <option value="MANAGER" />
          <option value="EMPLOYEE" />
        </datalist>
        <datalist id="user-dept-options">
          {departments.map((d) => (
            <option key={d} value={d} />
          ))}
        </datalist>

        <PageTitle title="User Management" subtitle="Manage employee roles, managers, and account status" icon={Users} iconColor="--color-accent"
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={openNewUserModal}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-accent text-[rgb(var(--color-text-inverse))] rounded-xl text-xs font-semibold hover:opacity-90 focus-ring transition-all shadow-sm shadow-[rgba(var(--color-accent),0.2)]"
                title="Create a new user and optionally send a login invitation"
              >
                <UserPlus className="w-3.5 h-3.5" /> New User
              </button>
              <button
                onClick={openInviteModal}
                disabled={inviteBusy || users.filter((u) => u.isActive && !u.lastLoginAt).length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-surface-elevated border border-theme rounded-xl text-xs font-medium text-secondary hover:text-primary focus-ring transition-all disabled:opacity-50"
                title="Send a login invitation email to users who haven't logged in"
              >
                <Mail className="w-3.5 h-3.5" />
                Invite {users.filter((u) => u.isActive && !u.lastLoginAt).length}
              </button>
              <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-surface-elevated border border-theme rounded-xl text-xs font-medium text-secondary hover:text-primary cursor-pointer focus-ring transition-all">
                <Upload className="w-3.5 h-3.5" /> Import
                <input type="file" accept=".csv" onChange={handleFileImport} className="hidden" disabled={importing} />
              </label>
              <button onClick={handleExport} className="inline-flex items-center gap-1.5 px-3 py-2 bg-surface-elevated border border-theme rounded-xl text-xs font-medium text-secondary hover:text-primary focus-ring transition-all">
                <Download className="w-3.5 h-3.5" /> Export
              </button>
            </div>
          }
        />

        {/* Import result banner */}
        {importResult && (
          <div className={`rounded-xl px-4 py-3 text-sm font-medium flex items-center justify-between ${importResult.errors.length > 0 ? 'bg-warning-muted text-warning' : 'bg-success-muted text-success'}`}>
            <span>Import complete: {importResult.created} created, {importResult.updated} updated{importResult.errors.length > 0 ? `, ${importResult.errors.length} errors` : ''}</span>
            <button onClick={() => setImportResult(null)} className="text-xs hover:opacity-70 focus-ring rounded">✕</button>
          </div>
        )}
        {inviteResult && (
          <div className={`rounded-xl px-4 py-3 text-sm font-medium flex items-center justify-between ${inviteResult.skipped > 0 ? 'bg-warning-muted text-warning' : 'bg-success-muted text-success'}`}>
            <span>
              Login invitations sent: {inviteResult.sent}
              {inviteResult.skipped > 0 ? `, ${inviteResult.skipped} skipped` : ''}
            </span>
            <button onClick={() => setInviteResult(null)} className="text-xs hover:opacity-70 focus-ring rounded">✕</button>
          </div>
        )}
        {importing && (
          <div className="bg-accent-muted text-accent rounded-xl px-4 py-3 text-sm font-medium">
            {importPreview ? 'Committing import…' : 'Parsing CSV…'}
          </div>
        )}

        {/* Import preview modal */}
        {importPreview && !importing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-surface-elevated border border-theme rounded-2xl shadow-theme-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between px-5 py-4 border-b border-theme">
                <div>
                  <h2 className="text-base font-bold text-primary">Review import</h2>
                  <p className="text-xs text-tertiary">No changes have been made yet.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setImportPreview(null)}
                  className="text-secondary hover:text-primary focus-ring rounded p-1"
                  aria-label="Close preview"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="px-5 py-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="card-stat text-center py-2">
                  <p className="text-xl font-bold text-success">{importPreview.created}</p>
                  <p className="text-2xs text-tertiary">To create</p>
                </div>
                <div className="card-stat text-center py-2">
                  <p className="text-xl font-bold text-info">{importPreview.updated}</p>
                  <p className="text-2xs text-tertiary">To update</p>
                </div>
                <div className="card-stat text-center py-2">
                  <p className="text-xl font-bold text-warning">{importPreview.skipped}</p>
                  <p className="text-2xs text-tertiary">Skipped</p>
                </div>
                <div className="card-stat text-center py-2">
                  <p className="text-xl font-bold text-error">{importPreview.errors.length}</p>
                  <p className="text-2xs text-tertiary">Errors</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-5 pb-2">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-surface-elevated">
                    <tr className="text-tertiary uppercase tracking-wider text-2xs border-b border-theme">
                      <th className="text-left py-2 pr-3">Action</th>
                      <th className="text-left py-2 pr-3">Name</th>
                      <th className="text-left py-2 pr-3">Email</th>
                      <th className="text-left py-2">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importPreview.preview.slice(0, 50).map((r, i) => (
                      <tr key={i} className="border-b border-theme/50">
                        <td className="py-1.5 pr-3">
                          <span
                            className={`badge-base ${
                              r.action === 'create'
                                ? 'bg-success-muted text-success'
                                : r.action === 'update'
                                  ? 'bg-info-muted text-info'
                                  : 'bg-warning-muted text-warning'
                            }`}
                          >
                            {r.action}
                          </span>
                        </td>
                        <td className="py-1.5 pr-3 text-primary">{r.name}</td>
                        <td className="py-1.5 pr-3 text-secondary">{r.email}</td>
                        <td className="py-1.5 text-tertiary">{r.reason || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {importPreview.preview.length > 50 && (
                  <p className="text-2xs text-tertiary text-center py-2">
                    Showing first 50 of {importPreview.preview.length} rows.
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-theme">
                <button
                  type="button"
                  onClick={() => setImportPreview(null)}
                  className="btn-secondary px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmImport}
                  disabled={importPreview.created + importPreview.updated === 0}
                  className="btn-primary px-4 py-2 disabled:opacity-50"
                >
                  Confirm &amp; import {importPreview.created + importPreview.updated} row
                  {importPreview.created + importPreview.updated === 1 ? '' : 's'}
                </button>
              </div>
            </div>
          </div>
        )}

        {!loading && (
          <StatGrid stats={[
            { label: 'Total Users', value: users.length, icon: Users, color: '--color-accent' },
            { label: 'Logged In', value: users.filter(u => u.lastLoginAt).length, icon: UserCheck, color: '--color-goal-completed' },
            { label: 'Inactive', value: users.filter(u => !u.isActive).length, icon: UserX, color: '--color-warning' },
            { label: 'Managers', value: users.filter(u => u.role === 'MANAGER').length, icon: Shield, color: '--color-warning' },
          ]} />
        )}

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, department, designation..."
              className="input-base pl-9"
              aria-label="Search users"
            />
          </div>
          <div className="relative w-full sm:w-40">
            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary pointer-events-none" />
            <input
              type="text"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              placeholder="All roles"
              className="input-base pl-9 pr-8"
              list="user-role-options"
              autoComplete="off"
              aria-label="Filter by role (type to search)"
            />
            {roleFilter && (
              <button
                type="button"
                onClick={() => setRoleFilter('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-tertiary hover:text-primary focus-ring rounded p-0.5"
                aria-label="Clear role filter"
                title="Clear"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="relative w-full sm:w-48">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary pointer-events-none" />
            <input
              type="text"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              placeholder="All departments"
              className="input-base pl-9 pr-8"
              list="user-dept-options"
              autoComplete="off"
              aria-label="Filter by department (type to search)"
            />
            {deptFilter && (
              <button
                type="button"
                onClick={() => setDeptFilter('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-tertiary hover:text-primary focus-ring rounded p-0.5"
                aria-label="Clear department filter"
                title="Clear"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="relative w-full sm:w-52">
            <Trophy className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary pointer-events-none z-10" />
            <select
              value={badgeFilter}
              onChange={(e) => setBadgeFilter(e.target.value)}
              className="input-base pl-9 pr-8 appearance-none"
              aria-label="Filter users by earned badge"
            >
              <option value="">All badges</option>
              {BADGE_LIST.map((b) => (
                <option key={b.kind} value={b.kind}>
                  {b.title}
                </option>
              ))}
            </select>
            {badgeFilter && (
              <button
                type="button"
                onClick={() => setBadgeFilter('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-tertiary hover:text-primary focus-ring rounded p-0.5"
                aria-label="Clear badge filter"
                title="Clear"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <label className="inline-flex items-center gap-2 text-xs text-secondary cursor-pointer select-none flex-shrink-0">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="focus-ring"
            />
            Show inactive
          </label>

          {!loading && (
            <div className="flex gap-1 ml-auto">
              {([
                { key: 'all', label: `All Users (${users.length})` },
                { key: 'review', label: 'Review Schedule' },
              ] as const).map(t => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setViewMode(t.key)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold focus-ring transition-all ${
                    viewMode === t.key
                      ? 'bg-accent text-[rgb(var(--color-text-inverse))] shadow-sm'
                      : 'bg-surface-elevated border border-theme text-secondary hover:text-primary'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-tertiary -mt-2">
          Showing {filteredUsers.length} of {users.length} user{users.length === 1 ? '' : 's'}
          {hasActiveFilters && (
            <>
              {' · '}
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setRoleFilter('');
                  setDeptFilter('');
                  setBadgeFilter('');
                  setShowInactive(true);
                }}
                className="text-accent hover:underline focus-ring rounded"
              >
                Clear filters
              </button>
            </>
          )}
        </p>

        {loading ? (
          <PageSkeleton type="table" count={6} />
        ) : viewMode === 'review' ? (
          <ReviewSchedule users={filteredUsers.filter(u => u.isActive)} onReload={fetchUsers} onEdit={setEditingUser} />
        ) : (
          /* ── All Users (default) ── */
          <div className="card-section overflow-y-auto scrollbar-hide max-h-[calc(100vh-22rem)]">
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-surface-secondary">
                <tr className="border-b border-theme">
                  <th className="text-left px-4 py-3 text-2xs font-semibold text-secondary uppercase tracking-wider">Name</th>
                  <th className="text-left px-4 py-3 text-2xs font-semibold text-secondary uppercase tracking-wider">Role</th>
                  <th className="text-left px-4 py-3 text-2xs font-semibold text-secondary uppercase tracking-wider hidden md:table-cell">Department</th>
                  <th className="text-left px-4 py-3 text-2xs font-semibold text-secondary uppercase tracking-wider hidden lg:table-cell">Manager</th>
                  <th className="text-left px-4 py-3 text-2xs font-semibold text-secondary uppercase tracking-wider">Last Login</th>
                  <th className="text-left px-4 py-3 text-2xs font-semibold text-secondary uppercase tracking-wider">Status</th>
                  <th className="text-right px-4 py-3 text-2xs font-semibold text-secondary uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-secondary">No users found</td></tr>
                ) : filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-surface-secondary transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="avatar-sm avatar-gradient">{user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                        <div><p className="text-sm font-medium text-primary">{user.name}</p><p className="text-2xs text-tertiary">{user.email}</p></div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`badge-base ${ROLE_STYLES[user.role]}`}>{user.role}</span>
                        {user.badges && user.badges.length > 0 && (
                          <span
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-2xs font-bold bg-[rgba(var(--color-warning),0.15)] text-[rgb(var(--color-warning))]"
                            title={`${user.badges.length} badge${user.badges.length === 1 ? '' : 's'} earned`}
                          >
                            <Trophy className="w-2.5 h-2.5" />
                            {user.badges.length}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-sm text-secondary">{user.department || '—'}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-sm text-secondary">{user.manager?.name || '—'}</td>
                    <td className="px-4 py-3">
                      {user.lastLoginAt ? <span className="text-xs text-success">{formatDistanceToNow(new Date(user.lastLoginAt), { addSuffix: true })}</span> : <span className="badge-base bg-error-muted text-error">Never</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1 text-xs font-medium ${user.isActive ? 'text-success' : 'text-error'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-success' : 'bg-error'}`} />{user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setEditingUser(user)} className="text-xs text-accent font-medium focus-ring rounded px-2 py-1">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Edit Modal */}
        <Modal open={!!editingUser} onClose={() => setEditingUser(null)} title="Edit User">
          {editingUser && (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="avatar-md avatar-gradient">{editingUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                <div><p className="text-sm font-medium text-primary">{editingUser.name}</p><p className="text-xs text-tertiary">{editingUser.email}</p></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Role"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  options={[
                    { value: 'EMPLOYEE', label: 'Employee' },
                    { value: 'MANAGER', label: 'Manager' },
                    { value: 'ADMIN', label: 'Admin' },
                  ]}
                />
                <Select
                  label="Job Category"
                  value={editJobCategory}
                  onChange={(e) => setEditJobCategory(e.target.value)}
                  placeholder="Select..."
                  options={[
                    { value: 'Executive', label: 'Executive' },
                    { value: 'Senior Executive', label: 'Senior Executive' },
                    { value: 'Associate', label: 'Associate' },
                    { value: 'Lead', label: 'Lead' },
                    { value: 'Manager', label: 'Manager' },
                  ]}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label">Department</label>
                  <input
                    type="text"
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    className="input-base"
                    maxLength={100}
                    placeholder="e.g., Engineering"
                    list="user-dept-options"
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label className="input-label">Designation / Position</label>
                  <input
                    type="text"
                    value={editPosition}
                    onChange={(e) => setEditPosition(e.target.value)}
                    className="input-base"
                    maxLength={100}
                    placeholder="e.g., Senior Software Engineer"
                  />
                </div>
              </div>

              <Select
                label="Manager (Reporting Person)"
                value={editManagerId}
                onChange={(e) => setEditManagerId(e.target.value)}
                placeholder="No Manager"
                options={managers
                  .filter((m) => m.id !== editingUser.id)
                  .map((m) => ({ value: m.id, label: `${m.name} (${m.role})` }))}
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Appointment Date"
                  type="date"
                  value={editAppointmentDate}
                  onChange={(e) => setEditAppointmentDate(e.target.value)}
                />
                <Select
                  label="Review Month"
                  value={editReviewMonth}
                  onChange={(e) => setEditReviewMonth(e.target.value)}
                  placeholder="Auto-calculate"
                  options={[
                    'January','February','March','April','May','June',
                    'July','August','September','October','November','December',
                  ].map((m) => ({ value: m, label: m }))}
                />
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => handleUpdate(editingUser.id, { isActive: !editingUser.isActive })}
                  disabled={saving}
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg focus-ring ${editingUser.isActive ? 'bg-error-muted text-error' : 'bg-success-muted text-success'}`}
                >
                  {editingUser.isActive ? 'Deactivate' : 'Reactivate'}
                </button>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setEditingUser(null)} className="btn-secondary px-4 py-2">
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdate(editingUser.id, {
                        role: editRole,
                        managerId: editManagerId || null,
                        department: editDepartment.trim() || null,
                        position: editPosition.trim() || null,
                        jobCategory: editJobCategory || null,
                        appointmentDate: editAppointmentDate || null,
                        reviewMonth: editReviewMonth || null,
                      })
                    }
                    disabled={saving}
                    className="btn-primary px-4 py-2"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* Invite users modal — select which never-logged-in users to email */}
        <Modal
          open={showInviteModal}
          onClose={() => !inviteBusy && setShowInviteModal(false)}
          title="Invite Users to Log In"
          icon={<Mail className="w-5 h-5 text-accent" />}
          maxWidth="max-w-xl"
        >
          {(() => {
            const eligible = users.filter((u) => u.isActive && !u.lastLoginAt);
            const allSelected = eligible.length > 0 && eligible.every((u) => inviteSelectedIds.has(u.id));
            const toggleOne = (id: string) => {
              setInviteSelectedIds((prev) => {
                const next = new Set(prev);
                if (next.has(id)) next.delete(id); else next.add(id);
                return next;
              });
            };
            const toggleAll = () => {
              setInviteSelectedIds(allSelected ? new Set() : new Set(eligible.map((u) => u.id)));
            };

            return (
              <div className="space-y-4">
                <div className="text-sm text-secondary">
                  These users have been imported or created but have never logged in yet. Select who
                  should receive a login invitation email.
                </div>

                {eligible.length === 0 ? (
                  <div className="rounded-xl bg-surface-secondary px-4 py-8 text-center">
                    <p className="text-sm text-secondary">
                      Everyone has logged in — no invitations needed right now.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between px-1">
                      <label className="inline-flex items-center gap-2 text-xs font-medium text-secondary cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={toggleAll}
                          className="focus-ring"
                        />
                        {allSelected ? 'Deselect all' : 'Select all'} ({eligible.length})
                      </label>
                      <span className="text-xs text-tertiary">
                        {inviteSelectedIds.size} selected
                      </span>
                    </div>

                    <div className="max-h-[40vh] overflow-y-auto scrollbar-hide border border-theme rounded-xl divide-y divide-[rgba(var(--color-border-primary),0.5)]">
                      {eligible.map((u) => {
                        const checked = inviteSelectedIds.has(u.id);
                        return (
                          <label
                            key={u.id}
                            className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-surface-secondary transition-colors ${
                              checked ? 'bg-accent-muted/40' : ''
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleOne(u.id)}
                              className="focus-ring"
                            />
                            <div className="avatar-sm avatar-gradient text-2xs">
                              {u.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-primary truncate">{u.name}</p>
                              <p className="text-2xs text-tertiary truncate">{u.email}</p>
                            </div>
                            <span className={`badge-base ${ROLE_STYLES[u.role]}`}>{u.role}</span>
                          </label>
                        );
                      })}
                    </div>
                  </>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    disabled={inviteBusy}
                    className="btn-secondary px-4 py-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmSendInvitations}
                    disabled={inviteBusy || inviteSelectedIds.size === 0}
                    className="btn-primary px-4 py-2 inline-flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    {inviteBusy ? 'Sending…' : `Send ${inviteSelectedIds.size} Invitation${inviteSelectedIds.size === 1 ? '' : 's'}`}
                  </button>
                </div>
              </div>
            );
          })()}
        </Modal>

        {/* Add single user — name + email + role + optional invite */}
        <Modal
          open={showNewUserModal}
          onClose={() => !newUserBusy && setShowNewUserModal(false)}
          title="Add New User"
          icon={<UserPlus className="w-5 h-5 text-accent" />}
          maxWidth="max-w-md"
        >
          <form onSubmit={submitNewUser} className="space-y-4">
            <div className="text-sm text-secondary">
              Create a user account. If you tick &ldquo;Send login invitation&rdquo;, they&apos;ll receive an
              email with instructions to sign in via Azure AD.
            </div>

            <div>
              <label className="input-label">
                Full name <span className="text-error">*</span>
              </label>
              <input
                type="text"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                required
                maxLength={200}
                placeholder="e.g. Priya Perera"
                className="input-base"
                autoFocus
              />
            </div>

            <div>
              <label className="input-label">
                Email <span className="text-error">*</span>
              </label>
              <input
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                required
                maxLength={200}
                placeholder="priya@bistecglobal.com"
                className="input-base"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="input-label">Role</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as 'ADMIN' | 'MANAGER' | 'EMPLOYEE')}
                  className="input-select w-full"
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div>
                <label className="input-label">Reporting to</label>
                <select
                  value={newUserManagerId}
                  onChange={(e) => setNewUserManagerId(e.target.value)}
                  className="input-select w-full"
                >
                  <option value="">— none —</option>
                  {users
                    .filter((u) => u.isActive && (u.role === 'MANAGER' || u.role === 'ADMIN'))
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="input-label">Department</label>
                <input
                  type="text"
                  value={newUserDepartment}
                  onChange={(e) => setNewUserDepartment(e.target.value)}
                  maxLength={100}
                  placeholder="Engineering"
                  className="input-base"
                />
              </div>
              <div>
                <label className="input-label">Designation</label>
                <input
                  type="text"
                  value={newUserPosition}
                  onChange={(e) => setNewUserPosition(e.target.value)}
                  maxLength={100}
                  placeholder="QA Engineer"
                  className="input-base"
                />
              </div>
            </div>

            <label className="flex items-start gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={newUserSendInvite}
                onChange={(e) => setNewUserSendInvite(e.target.checked)}
                className="mt-0.5 focus-ring"
              />
              <div>
                <p className="text-sm font-medium text-primary">Send login invitation email</p>
                <p className="text-xs text-secondary">
                  The user receives an email with the login link. They sign in with their Azure AD account.
                </p>
              </div>
            </label>

            {newUserError && (
              <p className="text-sm text-error bg-error-muted rounded-lg px-3 py-2">{newUserError}</p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewUserModal(false)}
                disabled={newUserBusy}
                className="btn-secondary px-4 py-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={newUserBusy || !newUserName.trim() || !newUserEmail.trim()}
                className="btn-primary px-4 py-2 inline-flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                {newUserBusy ? 'Creating…' : 'Create user'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Review Schedule panel — filter chips, sort by nextReviewDate, per-row
// actions (Send reminder, Mark complete, Adjust date). Backed by the
// User.nextReviewDate column (backfilled from appointmentDate + 6 months).
// ─────────────────────────────────────────────────────────────────────────

type ReviewBucket = 'all' | 'overdue' | 'soon' | 'month' | 'later' | 'done';

function daysBetween(target: Date, from = new Date()): number {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.floor((target.getTime() - from.getTime()) / oneDay);
}

function ReviewSchedule({
  users,
  onReload,
  onEdit,
}: {
  users: User[];
  onReload: () => void;
  onEdit: (user: User) => void;
}) {
  const [bucket, setBucket] = useState<ReviewBucket>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [flash, setFlashMsg] = useState<{ kind: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlashMsg(null), 4000);
    return () => clearTimeout(t);
  }, [flash]);

  // Enrich each user with a computed nextReviewDate (DB value, falling back
  // to appointmentDate + 6 months if not backfilled yet) and daysUntil.
  const rows = users
    .map((u) => {
      let nextDate: Date | null = null;
      if (u.nextReviewDate) nextDate = new Date(u.nextReviewDate);
      else if (u.appointmentDate) {
        const d = new Date(u.appointmentDate);
        d.setMonth(d.getMonth() + 6);
        nextDate = d;
      }
      const daysUntil = nextDate ? daysBetween(nextDate) : null;
      const completedRecently =
        u.lastReviewCompletedAt &&
        daysBetween(new Date(u.lastReviewCompletedAt)) > -30; // within last 30d
      return { user: u, nextDate, daysUntil, completedRecently };
    })
    .sort((a, b) => {
      if (!a.nextDate) return 1;
      if (!b.nextDate) return -1;
      return a.nextDate.getTime() - b.nextDate.getTime();
    });

  const visible = rows.filter(({ daysUntil, completedRecently }) => {
    if (bucket === 'done') return !!completedRecently;
    if (completedRecently) return false;
    if (daysUntil == null) return bucket === 'all' || bucket === 'later';
    if (bucket === 'overdue') return daysUntil < 0;
    if (bucket === 'soon') return daysUntil >= 0 && daysUntil <= 7;
    if (bucket === 'month') return daysUntil > 7 && daysUntil <= 30;
    if (bucket === 'later') return daysUntil > 30;
    return true;
  });

  const counts = {
    all: rows.filter((r) => !r.completedRecently).length,
    overdue: rows.filter((r) => !r.completedRecently && r.daysUntil != null && r.daysUntil < 0).length,
    soon: rows.filter((r) => !r.completedRecently && r.daysUntil != null && r.daysUntil >= 0 && r.daysUntil <= 7).length,
    month: rows.filter((r) => !r.completedRecently && r.daysUntil != null && r.daysUntil > 7 && r.daysUntil <= 30).length,
    later: rows.filter((r) => !r.completedRecently && (r.daysUntil == null || r.daysUntil > 30)).length,
    done: rows.filter((r) => r.completedRecently).length,
  };

  const sendReminder = async (userId: string) => {
    setBusyId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/send-review-reminder`, { method: 'POST' });
      if (res.ok) {
        setFlashMsg({ kind: 'success', msg: 'Reminder sent' });
        onReload();
      } else {
        const d = await res.json().catch(() => ({}));
        setFlashMsg({ kind: 'error', msg: d.error || 'Failed to send reminder' });
      }
    } finally {
      setBusyId(null);
    }
  };

  const markComplete = async (userId: string) => {
    setBusyId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markReviewComplete: true }),
      });
      if (res.ok) {
        setFlashMsg({ kind: 'success', msg: 'Review marked complete' });
        onReload();
      } else {
        const d = await res.json().catch(() => ({}));
        setFlashMsg({ kind: 'error', msg: d.error || 'Failed to mark complete' });
      }
    } finally {
      setBusyId(null);
    }
  };

  const adjustDate = async (userId: string, currentDate: Date | null) => {
    const input = window.prompt(
      'Set the next review date (YYYY-MM-DD):',
      currentDate ? currentDate.toISOString().slice(0, 10) : ''
    );
    if (!input) return;
    const parsed = new Date(input);
    if (Number.isNaN(parsed.getTime())) {
      setFlashMsg({ kind: 'error', msg: 'Invalid date format (expected YYYY-MM-DD)' });
      return;
    }
    setBusyId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nextReviewDate: parsed.toISOString() }),
      });
      if (res.ok) {
        setFlashMsg({ kind: 'success', msg: 'Review date updated' });
        onReload();
      } else {
        const d = await res.json().catch(() => ({}));
        setFlashMsg({ kind: 'error', msg: d.error || 'Failed to update date' });
      }
    } finally {
      setBusyId(null);
    }
  };

  const chip = (key: ReviewBucket, label: string, count: number) => (
    <button
      key={key}
      type="button"
      onClick={() => setBucket(key)}
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold focus-ring transition-colors ${
        bucket === key
          ? 'bg-accent text-[rgb(var(--color-text-inverse))]'
          : 'bg-surface-elevated border border-theme text-secondary hover:text-primary'
      }`}
    >
      {label}
      <span className={`ml-1.5 text-2xs ${bucket === key ? 'opacity-80' : 'text-tertiary'}`}>{count}</span>
    </button>
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {chip('all', 'All', counts.all)}
        {chip('overdue', 'Overdue', counts.overdue)}
        {chip('soon', 'Next 7 days', counts.soon)}
        {chip('month', 'Next 30 days', counts.month)}
        {chip('later', 'Later', counts.later)}
        {chip('done', 'Done (30d)', counts.done)}
      </div>

      {flash && (
        <div
          role="status"
          className={`rounded-xl px-4 py-2 text-sm font-medium ${
            flash.kind === 'success' ? 'bg-success-muted text-success' : 'bg-error-muted text-error'
          }`}
        >
          {flash.msg}
        </div>
      )}

      <div className="card-section overflow-y-auto scrollbar-hide max-h-[calc(100vh-24rem)]">
        <table className="w-full">
          <thead className="sticky top-0 z-10 bg-surface-secondary">
            <tr className="border-b border-theme">
              <th className="text-left px-4 py-3 text-2xs font-semibold text-secondary uppercase tracking-wider">Employee</th>
              <th className="text-left px-4 py-3 text-2xs font-semibold text-secondary uppercase tracking-wider hidden lg:table-cell">Reporting to</th>
              <th className="text-left px-4 py-3 text-2xs font-semibold text-secondary uppercase tracking-wider hidden md:table-cell">Appointment</th>
              <th className="text-left px-4 py-3 text-2xs font-semibold text-secondary uppercase tracking-wider">Next review</th>
              <th className="text-left px-4 py-3 text-2xs font-semibold text-secondary uppercase tracking-wider">Status</th>
              <th className="text-right px-4 py-3 text-2xs font-semibold text-secondary uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-tertiary text-sm">
                  No reviews in this bucket.
                </td>
              </tr>
            ) : (
              visible.map(({ user, nextDate, daysUntil, completedRecently }) => {
                const busy = busyId === user.id;
                return (
                  <tr key={user.id} className="hover:bg-surface-secondary transition-colors border-t border-theme">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="avatar-sm avatar-gradient">
                          {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-primary truncate">{user.name}</p>
                          <p className="text-2xs text-tertiary truncate">{user.position || user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-sm text-secondary">{user.manager?.name || '—'}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-sm text-secondary">
                      {user.appointmentDate ? new Date(user.appointmentDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-primary font-medium">
                      {nextDate ? nextDate.toLocaleDateString() : <span className="text-tertiary">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {completedRecently ? (
                        <span className="badge-base bg-success-muted text-success">
                          <Check className="w-3 h-3" /> Done
                        </span>
                      ) : daysUntil == null ? (
                        <span className="badge-base bg-surface-secondary text-tertiary">No date</span>
                      ) : daysUntil < 0 ? (
                        <span className="badge-base bg-error-muted text-error">
                          {Math.abs(daysUntil)}d overdue
                        </span>
                      ) : daysUntil <= 7 ? (
                        <span className="badge-base bg-warning-muted text-warning">
                          Due in {daysUntil}d
                        </span>
                      ) : daysUntil <= 30 ? (
                        <span className="badge-base bg-info-muted text-info">In {daysUntil}d</span>
                      ) : (
                        <span className="badge-base bg-surface-secondary text-secondary">In {daysUntil}d</span>
                      )}
                      {user.reviewReminderSentAt && !completedRecently && (
                        <span
                          className="ml-1.5 text-2xs text-tertiary"
                          title={`Reminder sent ${formatDistanceToNow(new Date(user.reviewReminderSentAt), { addSuffix: true })}`}
                        >
                          <Mail className="inline w-3 h-3" />
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onEdit(user)}
                          disabled={busy}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-2xs font-semibold text-secondary hover:text-primary hover:bg-surface-secondary focus-ring disabled:opacity-40"
                          title="Edit user details (role, manager, department, appointment date)"
                        >
                          <Pencil className="w-3 h-3" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => sendReminder(user.id)}
                          disabled={busy || !nextDate}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-2xs font-semibold text-secondary hover:text-primary hover:bg-surface-secondary focus-ring disabled:opacity-40"
                          title="Send reminder email to employee + reporting person"
                        >
                          <Bell className="w-3 h-3" /> Remind
                        </button>
                        <button
                          type="button"
                          onClick={() => adjustDate(user.id, nextDate)}
                          disabled={busy}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-2xs font-semibold text-secondary hover:text-primary hover:bg-surface-secondary focus-ring disabled:opacity-40"
                          title="Adjust the next review date"
                        >
                          <Calendar className="w-3 h-3" /> Adjust
                        </button>
                        <button
                          type="button"
                          onClick={() => markComplete(user.id)}
                          disabled={busy || !nextDate || !!completedRecently}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-2xs font-semibold text-success hover:bg-success-muted focus-ring disabled:opacity-40"
                          title="Mark review complete (rolls next review +12 months)"
                        >
                          <Check className="w-3 h-3" /> Done
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

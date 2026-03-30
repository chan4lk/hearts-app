'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import PageTitle from '@/app/components/shared/PageTitle';
import StatGrid from '@/app/components/shared/StatGrid';
import FilterBar, { FilterSelect } from '@/app/components/shared/FilterBar';
import Modal from '@/app/components/shared/Modal';
import { Select, Input, FormActions } from '@/app/components/shared/FormField';
import PageSkeleton from '@/app/components/shared/PageSkeleton';
import { Users, Shield, UserCheck, X, Upload, Download } from 'lucide-react';

interface User {
  id: string; name: string; email: string; role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  jobCategory: string | null; appointmentDate: string | null; reviewMonth: string | null;
  department: string | null; position: string | null; isActive: boolean;
  managerId: string | null; manager: { id: string; name: string } | null;
}

const ROLE_STYLES = { ADMIN: 'bg-error-muted text-error', MANAGER: 'bg-warning-muted text-warning', EMPLOYEE: 'bg-info-muted text-info' };

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ created: number; updated: number; errors: string[] } | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (roleFilter) params.set('role', roleFilter);
    if (statusFilter) params.set('status', statusFilter);
    const res = await fetch(`/api/admin/users?${params}`);
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  }, [roleFilter, statusFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.department && u.department.toLowerCase().includes(search.toLowerCase()))
  );

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
    setImporting(true); setImportResult(null);

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

    const res = await fetch('/api/admin/users/import', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rows }),
    });

    if (res.ok) {
      const result = await res.json();
      setImportResult(result);
      await fetchUsers();
    }
    setImporting(false);
    e.target.value = ''; // reset file input
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

  const managers = users.filter(u => u.role === 'MANAGER' || u.role === 'ADMIN');
  const hasActiveFilters = !!(roleFilter || statusFilter || search);

  return (
    <DashboardLayout type="admin">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageTitle title="User Management" subtitle="Manage employee roles, managers, and account status" icon={Users} iconColor="--color-accent"
          actions={
            <div className="flex items-center gap-2">
              {/* Import CSV */}
              <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-surface-elevated border border-theme rounded-xl text-xs font-medium text-secondary hover:text-primary cursor-pointer focus-ring transition-all">
                <Upload className="w-3.5 h-3.5" /> Import
                <input type="file" accept=".csv" onChange={handleFileImport} className="hidden" disabled={importing} />
              </label>
              {/* Export CSV */}
              <button onClick={handleExport} className="inline-flex items-center gap-1.5 px-3 py-2 bg-surface-elevated border border-theme rounded-xl text-xs font-medium text-secondary hover:text-primary focus-ring transition-all">
                <Download className="w-3.5 h-3.5" /> Export
              </button>
              <FilterBar search={search} onSearchChange={setSearch} searchPlaceholder="Search name, email, department..."
                hasActiveFilters={hasActiveFilters} onClearAll={() => { setSearch(''); setRoleFilter(''); setStatusFilter(''); }}>
                <FilterSelect value={roleFilter} onChange={setRoleFilter} placeholder="All Roles"
                  options={[{ value: 'ADMIN', label: 'Admin' }, { value: 'MANAGER', label: 'Manager' }, { value: 'EMPLOYEE', label: 'Employee' }]} />
                <FilterSelect value={statusFilter} onChange={setStatusFilter} placeholder="All Status"
                  options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
              </FilterBar>
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
        {importing && (
          <div className="bg-accent-muted text-accent rounded-xl px-4 py-3 text-sm font-medium">Importing users...</div>
        )}

        {!loading && (
          <StatGrid stats={[
            { label: 'Total Users', value: users.length, icon: Users, color: '--color-accent' },
            { label: 'Active', value: users.filter(u => u.isActive).length, icon: UserCheck, color: '--color-goal-completed' },
            { label: 'Managers', value: users.filter(u => u.role === 'MANAGER').length, icon: Shield, color: '--color-warning' },
            { label: 'Employees', value: users.filter(u => u.role === 'EMPLOYEE').length, icon: Users, color: '--color-info' },
          ]} />
        )}

        {loading ? (
          <PageSkeleton type="table" count={6} />
        ) : (
          <div className="card-section overflow-y-auto" style={{ maxHeight: '65vh' }}>
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-surface-secondary">
                <tr className="border-b border-theme">
                  <th className="text-left px-4 py-3 text-2xs font-semibold text-secondary uppercase tracking-wider w-[28%]">Name</th>
                  <th className="text-left px-4 py-3 text-2xs font-semibold text-secondary uppercase tracking-wider w-[12%]">Role</th>
                  <th className="text-left px-4 py-3 text-2xs font-semibold text-secondary uppercase tracking-wider hidden md:table-cell w-[16%]">Department</th>
                  <th className="text-left px-4 py-3 text-2xs font-semibold text-secondary uppercase tracking-wider hidden lg:table-cell w-[18%]">Manager</th>
                  <th className="text-left px-4 py-3 text-2xs font-semibold text-secondary uppercase tracking-wider w-[12%]">Status</th>
                  <th className="text-right px-4 py-3 text-2xs font-semibold text-secondary uppercase tracking-wider w-[10%]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgb(var(--color-border-theme))]">
                  {filteredUsers.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-12 text-center text-secondary">No users found</td></tr>
                  ) : filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-surface-secondary transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="avatar-sm avatar-gradient">{user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                          <div><p className="text-sm font-medium text-primary">{user.name}</p><p className="text-2xs text-tertiary">{user.email}</p></div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><span className={`badge-base ${ROLE_STYLES[user.role]}`}>{user.role}</span></td>
                      <td className="px-4 py-3 hidden md:table-cell text-sm text-secondary">{user.department || '—'}</td>
                      <td className="px-4 py-3 hidden lg:table-cell text-sm text-secondary">{user.manager?.name || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`flex items-center gap-1 text-xs font-medium ${user.isActive ? 'text-success' : 'text-error'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-success' : 'bg-error'}`} />
                          {user.isActive ? 'Active' : 'Inactive'}
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
                <Select label="Role" id="edit-role" defaultValue={editingUser.role}
                  options={[{ value: 'EMPLOYEE', label: 'Employee' }, { value: 'MANAGER', label: 'Manager' }, { value: 'ADMIN', label: 'Admin' }]} />
                <Select label="Job Category" id="edit-jobCategory" defaultValue={editingUser.jobCategory || ''} placeholder="Select..."
                  options={[{ value: 'Executive', label: 'Executive' }, { value: 'Senior Executive', label: 'Senior Executive' }, { value: 'Associate', label: 'Associate' }, { value: 'Lead', label: 'Lead' }, { value: 'Manager', label: 'Manager' }]} />
              </div>

              <Select label="Manager (Reporting Person)" id="edit-manager" defaultValue={editingUser.managerId || ''} placeholder="No Manager"
                options={managers.filter(m => m.id !== editingUser.id).map(m => ({ value: m.id, label: `${m.name} (${m.role})` }))} />

              <div className="grid grid-cols-2 gap-3">
                <Input label="Appointment Date" id="edit-appointmentDate" type="date"
                  defaultValue={editingUser.appointmentDate ? new Date(editingUser.appointmentDate).toISOString().split('T')[0] : ''} />
                <Select label="Review Month" id="edit-reviewMonth" defaultValue={editingUser.reviewMonth || ''} placeholder="Auto-calculate"
                  options={['January','February','March','April','May','June','July','August','September','October','November','December'].map(m => ({ value: m, label: m }))} />
              </div>

              <div className="flex justify-between items-center pt-2">
                <button onClick={() => handleUpdate(editingUser.id, { isActive: !editingUser.isActive })} disabled={saving}
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg focus-ring ${editingUser.isActive ? 'bg-error-muted text-error' : 'bg-success-muted text-success'}`}>
                  {editingUser.isActive ? 'Deactivate' : 'Reactivate'}
                </button>
                <div className="flex gap-2">
                  <button onClick={() => setEditingUser(null)} className="btn-secondary px-4 py-2">Cancel</button>
                  <button onClick={() => {
                    const role = (document.getElementById('edit-role') as HTMLSelectElement).value;
                    const managerId = (document.getElementById('edit-manager') as HTMLSelectElement).value || null;
                    const jobCategory = (document.getElementById('edit-jobCategory') as HTMLSelectElement).value || null;
                    const appointmentDate = (document.getElementById('edit-appointmentDate') as HTMLInputElement).value || null;
                    const reviewMonth = (document.getElementById('edit-reviewMonth') as HTMLSelectElement).value || null;
                    handleUpdate(editingUser.id, { role, managerId, jobCategory, appointmentDate, reviewMonth });
                  }} disabled={saving} className="btn-primary px-4 py-2">{saving ? 'Saving...' : 'Save'}</button>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
}

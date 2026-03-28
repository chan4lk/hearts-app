'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import PageSkeleton from '@/app/components/shared/PageSkeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Shield, UserCheck, Filter, X, Search } from 'lucide-react';

interface User {
  id: string; name: string; email: string; role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  department: string | null; position: string | null; isActive: boolean;
  managerId: string | null; manager: { id: string; name: string } | null;
}

const ROLE_STYLES = {
  ADMIN: 'bg-error-muted text-error',
  MANAGER: 'bg-warning-muted text-warning',
  EMPLOYEE: 'bg-info-muted text-info',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);

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

  const managers = users.filter(u => u.role === 'MANAGER' || u.role === 'ADMIN');
  const hasActiveFilters = roleFilter || statusFilter || search;
  const stats = {
    total: users.length,
    active: users.filter(u => u.isActive).length,
    managers: users.filter(u => u.role === 'MANAGER').length,
    employees: users.filter(u => u.role === 'EMPLOYEE').length,
  };

  return (
    <DashboardLayout type="admin">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with filter toggle */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="page-title"><Users className="w-6 h-6 text-accent" /> User Management</h1>
            <p className="page-subtitle">Manage employee roles, managers, and account status</p>
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium focus-ring transition-all ${
              showFilters || hasActiveFilters ? 'bg-accent text-[rgb(var(--color-text-inverse))] shadow-sm' : 'bg-surface-elevated border border-theme text-secondary hover:text-primary'
            }`}>
            <Filter className="w-4 h-4" />
            Filters {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-[rgb(var(--color-text-inverse))]" />}
          </button>
        </div>

        {/* Stats */}
        {!loading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Users', value: stats.total, icon: Users },
              { label: 'Active', value: stats.active, icon: UserCheck },
              { label: 'Managers', value: stats.managers, icon: Shield },
              { label: 'Employees', value: stats.employees, icon: Users },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="card-stat">
                <div className="flex items-center gap-3">
                  <div className="icon-box-md bg-accent-muted"><Icon className="w-5 h-5 text-accent" /></div>
                  <div><p className="text-xl font-bold text-primary">{value}</p><p className="text-2xs text-tertiary">{label}</p></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Collapsible Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="card-stat flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary" />
                  <input type="text" placeholder="Search name, email, department..." value={search} onChange={(e) => setSearch(e.target.value)}
                    className="input-base pl-10" />
                </div>
                <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="input-select">
                  <option value="">All Roles</option>
                  <option value="ADMIN">Admin</option>
                  <option value="MANAGER">Manager</option>
                  <option value="EMPLOYEE">Employee</option>
                </select>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-select">
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                {hasActiveFilters && (
                  <button onClick={() => { setSearch(''); setRoleFilter(''); setStatusFilter(''); }}
                    className="text-xs text-tertiary hover:text-error focus-ring rounded px-2 py-1">Clear all</button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Users Table with fixed header */}
        {loading ? (
          <PageSkeleton type="table" count={6} />
        ) : (
          <div className="card-section">
            {/* Fixed header */}
            <div className="bg-surface-secondary border-b border-theme">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left px-4 py-3 text-2xs font-semibold text-secondary uppercase tracking-wider">Name</th>
                    <th className="text-left px-4 py-3 text-2xs font-semibold text-secondary uppercase tracking-wider">Role</th>
                    <th className="text-left px-4 py-3 text-2xs font-semibold text-secondary uppercase tracking-wider hidden md:table-cell">Department</th>
                    <th className="text-left px-4 py-3 text-2xs font-semibold text-secondary uppercase tracking-wider hidden lg:table-cell">Manager</th>
                    <th className="text-left px-4 py-3 text-2xs font-semibold text-secondary uppercase tracking-wider">Status</th>
                    <th className="text-right px-4 py-3 text-2xs font-semibold text-secondary uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
              </table>
            </div>

            {/* Scrollable rows */}
            <div className="overflow-y-auto" style={{ maxHeight: '55vh' }}>
              <table className="w-full">
                <tbody className="divide-y divide-[rgb(var(--color-border-theme))]">
                  {filteredUsers.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-12 text-center text-secondary">No users found</td></tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-surface-secondary transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="avatar-sm avatar-gradient">{user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                            <div><p className="text-sm font-medium text-primary">{user.name}</p><p className="text-2xs text-tertiary">{user.email}</p></div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`badge-base ${ROLE_STYLES[user.role]}`}>{user.role}</span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell"><span className="text-sm text-secondary">{user.department || '—'}</span></td>
                        <td className="px-4 py-3 hidden lg:table-cell"><span className="text-sm text-secondary">{user.manager?.name || '—'}</span></td>
                        <td className="px-4 py-3">
                          <span className={`flex items-center gap-1 text-xs font-medium ${user.isActive ? 'text-success' : 'text-error'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-success' : 'bg-error'}`} />
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => setEditingUser(user)} className="text-xs text-accent hover:text-accent font-medium focus-ring rounded px-2 py-1">Edit</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        <AnimatePresence>
          {editingUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-backdrop" onClick={() => setEditingUser(null)} />
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="modal-panel max-w-md space-y-5">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-primary">Edit User</h2>
                  <button onClick={() => setEditingUser(null)} className="text-secondary hover:text-primary focus-ring rounded p-1"><X className="w-5 h-5" /></button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="avatar-md avatar-gradient">{editingUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                  <div><p className="text-sm font-medium text-primary">{editingUser.name}</p><p className="text-xs text-tertiary">{editingUser.email}</p></div>
                </div>

                <div className="space-y-1.5">
                  <label className="input-label">Role</label>
                  <select defaultValue={editingUser.role} id="edit-role" className="input-select w-full">
                    <option value="EMPLOYEE">Employee</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="input-label">Manager</label>
                  <select defaultValue={editingUser.managerId || ''} id="edit-manager" className="input-select w-full">
                    <option value="">No Manager</option>
                    {managers.filter(m => m.id !== editingUser.id).map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                    ))}
                  </select>
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
                      handleUpdate(editingUser.id, { role, managerId });
                    }} disabled={saving} className="btn-primary px-4 py-2">
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}

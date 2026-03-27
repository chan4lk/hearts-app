'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { PageHeader } from '@/app/components/shared/PageHeader';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Shield, UserCheck, UserX, ChevronDown, Search, X } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  department: string | null;
  position: string | null;
  isActive: boolean;
  managerId: string | null;
  manager: { id: string; name: string } | null;
  createdAt: string;
  lastLoginAt: string | null;
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
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (roleFilter) params.set('role', roleFilter);
    if (statusFilter) params.set('status', statusFilter);

    const res = await fetch(`/api/admin/users?${params}`);
    if (res.ok) {
      const data = await res.json();
      setUsers(data);
    }
    setLoading(false);
  }, [roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.department && u.department.toLowerCase().includes(search.toLowerCase()))
  );

  const handleUpdate = async (userId: string, data: Partial<{ role: string; managerId: string | null; isActive: boolean }>) => {
    setSaving(true);
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      await fetchUsers();
      setEditingUser(null);
    }
    setSaving(false);
  };

  const managers = users.filter((u) => u.role === 'MANAGER' || u.role === 'ADMIN');

  const stats = {
    total: users.length,
    active: users.filter((u) => u.isActive).length,
    admins: users.filter((u) => u.role === 'ADMIN').length,
    managers: users.filter((u) => u.role === 'MANAGER').length,
    employees: users.filter((u) => u.role === 'EMPLOYEE').length,
  };

  return (
    <DashboardLayout type="admin">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader title="User Management" description="Manage employee roles, managers, and account status" badge="Admin" />

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Users', value: stats.total, icon: Users },
            { label: 'Active', value: stats.active, icon: UserCheck },
            { label: 'Managers', value: stats.managers, icon: Shield },
            { label: 'Employees', value: stats.employees, icon: Users },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-surface-elevated rounded-lg border border-theme p-4 shadow-theme-sm">
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-secondary" />
                <div>
                  <p className="text-2xl font-bold text-primary">{value}</p>
                  <p className="text-xs text-secondary">{label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary" />
            <input
              type="text"
              placeholder="Search by name, email, or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface-primary border border-theme rounded-lg text-sm text-primary placeholder:text-tertiary focus-ring"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-surface-primary border border-theme rounded-lg text-sm text-primary focus-ring"
          >
            <option value="">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="MANAGER">Manager</option>
            <option value="EMPLOYEE">Employee</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-surface-primary border border-theme rounded-lg text-sm text-primary focus-ring"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Users Table */}
        <div className="bg-surface-elevated rounded-lg border border-theme shadow-theme-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-theme bg-surface-secondary">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-secondary uppercase tracking-wider">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-secondary uppercase tracking-wider">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-secondary uppercase tracking-wider hidden md:table-cell">Department</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-secondary uppercase tracking-wider hidden lg:table-cell">Manager</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-secondary uppercase tracking-wider">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-secondary uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgb(var(--color-border-theme))]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-secondary">Loading users...</td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-secondary">No users found</td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-surface-secondary transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-primary">{user.name}</p>
                          <p className="text-xs text-tertiary">{user.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${ROLE_STYLES[user.role]}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-sm text-secondary">{user.department || '—'}</span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-sm text-secondary">{user.manager?.name || '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${user.isActive ? 'text-success' : 'text-error'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-success' : 'bg-error'}`} />
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setEditingUser(user)}
                          className="text-xs text-accent hover:text-accent font-medium focus-ring rounded px-2 py-1"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Modal */}
        <AnimatePresence>
          {editingUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50"
                onClick={() => setEditingUser(null)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-surface-elevated rounded-xl border border-theme shadow-theme-xl p-6 w-full max-w-md space-y-5"
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-primary">Edit User</h2>
                  <button onClick={() => setEditingUser(null)} className="text-secondary hover:text-primary focus-ring rounded p-1">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-primary">{editingUser.name}</p>
                  <p className="text-xs text-tertiary">{editingUser.email}</p>
                </div>

                {/* Role */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-secondary">Role</label>
                  <select
                    defaultValue={editingUser.role}
                    id="edit-role"
                    className="w-full px-3 py-2 bg-surface-primary border border-theme rounded-lg text-sm text-primary focus-ring"
                  >
                    <option value="EMPLOYEE">Employee</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>

                {/* Manager */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-secondary">Manager</label>
                  <select
                    defaultValue={editingUser.managerId || ''}
                    id="edit-manager"
                    className="w-full px-3 py-2 bg-surface-primary border border-theme rounded-lg text-sm text-primary focus-ring"
                  >
                    <option value="">No Manager</option>
                    {managers
                      .filter((m) => m.id !== editingUser.id)
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.role})
                        </option>
                      ))}
                  </select>
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={() => handleUpdate(editingUser.id, { isActive: !editingUser.isActive })}
                    disabled={saving}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg focus-ring ${
                      editingUser.isActive
                        ? 'bg-error-muted text-error hover:bg-error/20'
                        : 'bg-success-muted text-success hover:bg-success/20'
                    }`}
                  >
                    {editingUser.isActive ? 'Deactivate' : 'Reactivate'}
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingUser(null)}
                      className="px-4 py-2 text-sm text-secondary hover:text-primary focus-ring rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        const role = (document.getElementById('edit-role') as HTMLSelectElement).value;
                        const managerId = (document.getElementById('edit-manager') as HTMLSelectElement).value || null;
                        handleUpdate(editingUser.id, { role, managerId });
                      }}
                      disabled={saving}
                      className="px-4 py-2 text-sm font-medium bg-accent text-[rgb(var(--color-text-inverse))] rounded-lg hover:opacity-90 focus-ring"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
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

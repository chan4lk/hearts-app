'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import HeartButton from '@/app/components/hearts/HeartButton';
import { Users, Target, Heart, ClipboardCheck, Plus, Search, X } from 'lucide-react';
import PageSkeleton from '@/app/components/shared/PageSkeleton';
import PageTitle from '@/app/components/shared/PageTitle';
import StatGrid from '@/app/components/shared/StatGrid';
import Modal from '@/app/components/shared/Modal';
import { FormActions } from '@/app/components/shared/FormField';
import FilterBar, { FilterSelect } from '@/app/components/shared/FilterBar';

interface TeamMember {
  id: string; name: string; email: string; department: string | null;
  position: string | null; role: string; isActive: boolean;
}

interface GoalTemplate {
  id: string; title: string; description: string | null; category: string | null;
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  // Assign goals state
  const [showAssign, setShowAssign] = useState(false);
  const [templates, setTemplates] = useState<GoalTemplate[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [bulkGoals, setBulkGoals] = useState<{ title: string; description: string; targetDate: string }[]>([{ title: '', description: '', targetDate: '' }]);
  const [assigning, setAssigning] = useState(false);
  const [assignResult, setAssignResult] = useState('');

  const fetchData = useCallback(async () => {
    const [users, s] = await Promise.all([
      fetch('/api/admin/users').then(r => r.ok ? r.json() : []),
      fetch('/api/analytics/dashboard').then(r => r.ok ? r.json() : null),
    ]);
    setMembers(users.filter((u: any) => u.role === 'EMPLOYEE'));
    setStats(s);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Load templates when assign modal opens
  useEffect(() => {
    if (showAssign) {
      fetch('/api/goals/templates').then(r => r.ok ? r.json() : []).then(setTemplates);
    }
  }, [showAssign]);

  const filteredMembers = members.filter(m =>
    (m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase())) &&
    (!deptFilter || m.department === deptFilter)
  );

  const departments = Array.from(new Set(members.map(m => m.department).filter(Boolean))) as string[];

  const toggleMember = (id: string) => setSelectedMembers(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  const addGoalRow = () => setBulkGoals(prev => [...prev, { title: '', description: '', targetDate: '' }]);
  const removeGoalRow = (i: number) => setBulkGoals(prev => prev.filter((_, idx) => idx !== i));
  const updateGoalRow = (i: number, field: string, value: string) => setBulkGoals(prev => prev.map((g, idx) => idx === i ? { ...g, [field]: value } : g));

  const applyTemplate = (i: number, templateId: string) => {
    const t = templates.find(t => t.id === templateId);
    if (t) setBulkGoals(prev => prev.map((g, idx) => idx === i ? { ...g, title: t.title, description: t.description || '' } : g));
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    const validGoals = bulkGoals.filter(g => g.title.trim());
    if (validGoals.length === 0 || selectedMembers.length === 0) return;
    setAssigning(true);

    const res = await fetch('/api/goals/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        goals: validGoals.map(g => ({ title: g.title, description: g.description || undefined, targetDate: g.targetDate || undefined })),
        assignToUserIds: selectedMembers,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setAssignResult(`${data.created} goals assigned successfully!`);
      setShowAssign(false);
      setBulkGoals([{ title: '', description: '', targetDate: '' }]);
      setSelectedMembers([]);
      setTimeout(() => setAssignResult(''), 5000);
    }
    setAssigning(false);
  };

  const resetAssign = () => {
    setBulkGoals([{ title: '', description: '', targetDate: '' }]);
    setSelectedMembers([]);
    setShowAssign(true);
  };

  const hasActiveFilters = !!(search || deptFilter);

  return (
    <DashboardLayout type="manager">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageTitle title="My Team" subtitle="Manage your team's goals and performance" icon={Users} iconColor="--color-accent"
          actions={
            <div className="flex items-center gap-3">
              <FilterBar search={search} onSearchChange={setSearch} searchPlaceholder="Search team member..."
                hasActiveFilters={hasActiveFilters} onClearAll={() => { setSearch(''); setDeptFilter(''); }}>
                {departments.length > 0 && (
                  <FilterSelect value={deptFilter} onChange={setDeptFilter} placeholder="All Departments"
                    options={departments.map(d => ({ value: d, label: d }))} />
                )}
              </FilterBar>
              <button onClick={resetAssign} className="btn-primary inline-flex items-center gap-2">
                <Target className="w-4 h-4" /> Assign Goals
              </button>
            </div>
          }
        />

        {assignResult && <div className="bg-success-muted text-success rounded-xl px-4 py-3 text-sm font-medium">{assignResult}</div>}

        {loading ? (
          <PageSkeleton type="table" count={5} />
        ) : (
          <>
            {stats && (
              <StatGrid stats={[
                { label: 'Team Size', value: stats.teamSize || members.length, icon: Users, color: '--color-accent' },
                { label: 'Active Goals', value: stats.teamActiveGoals || 0, icon: Target, color: '--color-goal-active' },
                { label: 'Hearts (30d)', value: stats.teamHeartsReceived || 0, icon: Heart, color: '--color-heart' },
                { label: 'Active Cycles', value: stats.activeCycles || 0, icon: ClipboardCheck, color: '--color-review' },
              ]} />
            )}

            {/* Team table — same design as admin users */}
            <div className="card-section overflow-y-auto" style={{ maxHeight: '65vh' }}>
              <table className="w-full">
                <thead className="sticky top-0 z-10 bg-surface-secondary">
                  <tr className="border-b border-theme">
                    <th className="text-left px-4 py-3 text-2xs font-semibold text-secondary uppercase tracking-wider w-[30%]">Name</th>
                    <th className="text-left px-4 py-3 text-2xs font-semibold text-secondary uppercase tracking-wider hidden md:table-cell w-[20%]">Department</th>
                    <th className="text-left px-4 py-3 text-2xs font-semibold text-secondary uppercase tracking-wider hidden md:table-cell w-[20%]">Position</th>
                    <th className="text-left px-4 py-3 text-2xs font-semibold text-secondary uppercase tracking-wider w-[12%]">Status</th>
                    <th className="text-right px-4 py-3 text-2xs font-semibold text-secondary uppercase tracking-wider w-[15%]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgb(var(--color-border-theme))]">
                    {filteredMembers.length === 0 ? (
                      <tr><td colSpan={5} className="px-4 py-12 text-center text-secondary">No team members found</td></tr>
                    ) : filteredMembers.map(m => (
                      <tr key={m.id} className="hover:bg-surface-secondary transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="avatar-sm avatar-gradient">{m.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                            <div>
                              <p className="text-sm font-medium text-primary">{m.name}</p>
                              <p className="text-2xs text-tertiary">{m.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-sm text-secondary">{m.department || '—'}</td>
                        <td className="px-4 py-3 hidden md:table-cell text-sm text-secondary">{m.position || '—'}</td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1 text-xs font-medium text-success">
                            <span className="w-1.5 h-1.5 rounded-full bg-success" /> Active
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => { setSelectedMembers([m.id]); resetAssign(); setSelectedMembers([m.id]); }}
                            className="text-xs text-accent font-medium focus-ring rounded px-2 py-1">Assign Goal</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
              </table>
            </div>
          </>
        )}

        {/* Assign Goals Modal */}
        <Modal open={showAssign} onClose={() => setShowAssign(false)} title="Assign Goals to Team"
          icon={<Target className="w-5 h-5" style={{ color: 'rgb(var(--color-goal-active))' }} />} maxWidth="max-w-lg">
          <form onSubmit={handleAssign} className="space-y-4">
            {/* Select team members */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="input-label mb-0">Select employees</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setSelectedMembers(members.map(m => m.id))} className="text-2xs text-accent hover:underline focus-ring rounded">All</button>
                  <button type="button" onClick={() => setSelectedMembers([])} className="text-2xs text-tertiary hover:text-error focus-ring rounded">Clear</button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto p-1">
                {members.map(m => {
                  const sel = selectedMembers.includes(m.id);
                  return (
                    <button key={m.id} type="button" onClick={() => toggleMember(m.id)}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium focus-ring transition-all ${
                        sel ? 'bg-accent text-[rgb(var(--color-text-inverse))] shadow-sm' : 'bg-surface-elevated border border-theme text-secondary hover:text-primary'
                      }`}>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-2xs font-bold ${sel ? 'bg-white/20' : 'avatar-gradient text-white'}`}>
                        {m.name.split(' ').map(n => n[0]).join('').slice(0, 1)}
                      </div>
                      {m.name.split(' ')[0]}
                      {sel && <span>✓</span>}
                    </button>
                  );
                })}
              </div>
              {selectedMembers.length > 0 && (
                <p className="text-2xs text-accent font-medium">{selectedMembers.length} employee(s) selected</p>
              )}
            </div>

            {/* Goal rows */}
            {bulkGoals.map((goal, i) => (
              <div key={i} className="p-4 bg-surface-secondary rounded-xl space-y-3 relative">
                {bulkGoals.length > 1 && (
                  <button type="button" onClick={() => removeGoalRow(i)} className="absolute top-2 right-2 text-tertiary hover:text-error focus-ring rounded p-0.5">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-2xs text-tertiary font-semibold">Goal {i + 1}</span>
                  {templates.length > 0 && (
                    <select onChange={(e) => { if (e.target.value) applyTemplate(i, e.target.value); e.target.value = ''; }}
                      className="text-2xs text-accent bg-transparent border border-theme rounded-lg px-2 py-1 cursor-pointer focus-ring" defaultValue="">
                      <option value="" disabled>📋 Use template...</option>
                      {templates.map(t => <option key={t.id} value={t.id}>{t.category ? `[${t.category}] ` : ''}{t.title}</option>)}
                    </select>
                  )}
                </div>
                <input value={goal.title} onChange={(e) => updateGoalRow(i, 'title', e.target.value)} required className="input-base" placeholder="Goal title" maxLength={200} />
                <textarea value={goal.description} onChange={(e) => updateGoalRow(i, 'description', e.target.value)} rows={2} className="input-textarea" placeholder="Description (optional)" maxLength={2000} />
                <input type="date" value={goal.targetDate} onChange={(e) => updateGoalRow(i, 'targetDate', e.target.value)}
                  min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                  className="input-base" />
              </div>
            ))}

            <button type="button" onClick={addGoalRow}
              className="w-full py-2 border-2 border-dashed border-theme rounded-xl text-xs font-medium text-tertiary hover:text-primary hover:border-accent focus-ring transition-colors">
              + Add Another Goal
            </button>

            {/* Summary */}
            {selectedMembers.length > 0 && bulkGoals.some(g => g.title.trim()) && (
              <div className="card-stat p-3">
                <p className="text-xs text-primary font-medium">
                  {bulkGoals.filter(g => g.title.trim()).length} goal(s) × {selectedMembers.length} employee(s) = <strong className="text-accent">{bulkGoals.filter(g => g.title.trim()).length * selectedMembers.length} goals</strong> will be created
                </p>
              </div>
            )}

            <FormActions onCancel={() => setShowAssign(false)}
              submitLabel={assigning ? 'Assigning...' : `Assign ${bulkGoals.filter(g => g.title.trim()).length} Goal(s)`}
              loading={assigning}
              disabled={selectedMembers.length === 0 || bulkGoals.every(g => !g.title.trim())} />
          </form>
        </Modal>
      </div>
      <HeartButton />
    </DashboardLayout>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import HeartButton from '@/app/components/hearts/HeartButton';
import { Users, Target, Heart, ClipboardCheck, Search, X, Building2, Mail, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PageSkeleton from '@/app/components/shared/PageSkeleton';
import PageTitle from '@/app/components/shared/PageTitle';
import StatGrid from '@/app/components/shared/StatGrid';
import Modal from '@/app/components/shared/Modal';
import { FormActions } from '@/app/components/shared/FormField';
import TemplatePicker, { GoalTemplate } from '@/app/components/goals/TemplatePicker';

const todayStr = () => new Date().toISOString().split('T')[0];
const makeEmptyGoal = () => ({ title: '', description: '', category: '', targetDate: todayStr() });

interface TeamMember {
  id: string; name: string; email: string; department: string | null;
  position: string | null; role: string; isActive: boolean;
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
  const [bulkGoals, setBulkGoals] = useState<{ title: string; description: string; category: string; targetDate: string }[]>([makeEmptyGoal()]);
  const [assigning, setAssigning] = useState(false);
  const [assignResult, setAssignResult] = useState('');

  const fetchData = useCallback(async () => {
    // /api/team scope=own → manager sees direct reports; admin sees all employees
    const [users, s] = await Promise.all([
      fetch('/api/team?scope=own').then(r => r.ok ? r.json() : []),
      fetch('/api/analytics/dashboard').then(r => r.ok ? r.json() : null),
    ]);
    setMembers(users);
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

  const filteredMembers = members.filter(m => {
    const q = search.trim().toLowerCase();
    const d = deptFilter.trim().toLowerCase();
    if (q) {
      const hay = `${m.name} ${m.email} ${m.department ?? ''} ${m.position ?? ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (d) {
      const dept = (m.department ?? '').toLowerCase();
      if (!dept.includes(d)) return false;
    }
    return true;
  });

  const departments = Array.from(new Set(members.map(m => m.department).filter(Boolean))) as string[];

  const toggleMember = (id: string) => setSelectedMembers(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  const addGoalRow = () => setBulkGoals(prev => [...prev, makeEmptyGoal()]);
  const removeGoalRow = (i: number) => setBulkGoals(prev => prev.filter((_, idx) => idx !== i));
  const updateGoalRow = (i: number, field: string, value: string) => setBulkGoals(prev => prev.map((g, idx) => idx === i ? { ...g, [field]: value } : g));

  const applyTemplate = (i: number, t: GoalTemplate) => {
    setBulkGoals(prev => prev.map((g, idx) => idx === i
      ? { ...g, title: t.title, description: t.description || '', category: t.category || g.category }
      : g));
  };

  const templateCategories = Array.from(new Set(
    templates.map(t => t.category).filter(Boolean) as string[]
  )).sort();

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    const validGoals = bulkGoals.filter(g => g.title.trim());
    if (validGoals.length === 0 || selectedMembers.length === 0) return;
    setAssigning(true);

    const res = await fetch('/api/goals/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        goals: validGoals.map(g => ({
          title: g.title,
          description: g.description || undefined,
          category: g.category || undefined,
          targetDate: g.targetDate || undefined,
        })),
        assignToUserIds: selectedMembers,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setAssignResult(`${data.created} goals assigned successfully!`);
      setShowAssign(false);
      setBulkGoals([makeEmptyGoal()]);
      setSelectedMembers([]);
      setTimeout(() => setAssignResult(''), 5000);
    } else {
      const d = await res.json().catch(() => ({}));
      setAssignResult(`Failed to assign: ${d.error || 'unknown error'}`);
      setTimeout(() => setAssignResult(''), 6000);
    }
    setAssigning(false);
  };

  const resetAssign = () => {
    setBulkGoals([makeEmptyGoal()]);
    setSelectedMembers([]);
    setShowAssign(true);
  };

  const hasActiveFilters = !!(search || deptFilter);

  return (
    <DashboardLayout type="manager">
      <div className="max-w-7xl mx-auto space-y-6">
        <datalist id="goal-category-options">
          {templateCategories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <datalist id="team-dept-options">
          {departments.map(d => (
            <option key={d} value={d} />
          ))}
        </datalist>

        <PageTitle title="My Team" subtitle="Manage your team's goals and performance" icon={Users} iconColor="--color-accent"
          actions={
            <button onClick={resetAssign} className="btn-primary inline-flex items-center gap-2">
              <Target className="w-4 h-4" /> Assign Goals
            </button>
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

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary pointer-events-none" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, email, department, position..."
                  className="input-base pl-9"
                  aria-label="Search team"
                />
              </div>
              <div className="relative sm:w-56">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary pointer-events-none" />
                <input
                  type="text"
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  placeholder="All departments"
                  className="input-base pl-9 pr-8"
                  list="team-dept-options"
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
            </div>

            <p className="text-xs text-tertiary -mt-2">
              Showing {filteredMembers.length} of {members.length} team member
              {members.length === 1 ? '' : 's'}
              {hasActiveFilters && (
                <>
                  {' · '}
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('');
                      setDeptFilter('');
                    }}
                    className="text-accent hover:underline focus-ring rounded"
                  >
                    Clear filters
                  </button>
                </>
              )}
            </p>

            {filteredMembers.length === 0 ? (
              <div className="empty-container">
                <div
                  className="empty-icon-ring"
                  style={{ backgroundColor: 'rgba(var(--color-accent),0.1)' }}
                >
                  <Users className="w-10 h-10 text-accent" />
                </div>
                <p className="empty-title">No team members match the current filters</p>
                <p className="empty-description">Try a different search term or clear the department filter.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[calc(100vh-22rem)] overflow-y-auto scrollbar-hide pr-1 -mr-1">
                <AnimatePresence initial={false}>
                  {filteredMembers.map((m, i) => (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ delay: i * 0.02 }}
                      className="flex items-start justify-between gap-3 p-4 card-interactive"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="avatar-md avatar-gradient flex-shrink-0">
                          {m.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-primary truncate">{m.name}</p>
                          <p className="text-xs text-tertiary flex items-center gap-3 flex-wrap mt-0.5">
                            <span className="inline-flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {m.email}
                            </span>
                            {m.department && (
                              <span className="inline-flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                {m.department}
                              </span>
                            )}
                            {m.position && (
                              <span className="inline-flex items-center gap-1">
                                <Briefcase className="w-3 h-3" />
                                {m.position}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold bg-success-muted text-success border border-theme">
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: 'rgb(var(--color-success))' }}
                          />
                          Active
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setBulkGoals([makeEmptyGoal()]);
                            setSelectedMembers([m.id]);
                            setShowAssign(true);
                          }}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[rgba(var(--color-goal-active),0.1)] text-[rgb(var(--color-goal-active))] hover:bg-[rgba(var(--color-goal-active),0.2)] focus-ring inline-flex items-center gap-1"
                        >
                          <Target className="w-3.5 h-3.5" /> Assign Goal
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
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
                    <TemplatePicker templates={templates} onSelect={(t) => applyTemplate(i, t)} />
                  )}
                </div>
                <input value={goal.title} onChange={(e) => updateGoalRow(i, 'title', e.target.value)} required className="input-base" placeholder="Goal title" maxLength={200} />
                <textarea value={goal.description} onChange={(e) => updateGoalRow(i, 'description', e.target.value)} rows={2} className="input-textarea" placeholder="Description (optional)" maxLength={2000} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    value={goal.category}
                    onChange={(e) => updateGoalRow(i, 'category', e.target.value)}
                    className="input-base"
                    maxLength={50}
                    placeholder="Category (optional)"
                    list="goal-category-options"
                    autoComplete="off"
                    aria-label={`Category for goal ${i + 1}`}
                  />
                  <input
                    type="date"
                    value={goal.targetDate}
                    onChange={(e) => updateGoalRow(i, 'targetDate', e.target.value)}
                    min={todayStr()}
                    className="input-base"
                    aria-label={`Target date for goal ${i + 1}`}
                  />
                </div>
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

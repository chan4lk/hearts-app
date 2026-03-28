'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { PageHeader } from '@/app/components/shared/PageHeader';
import { motion } from 'framer-motion';
import { Plus, Calendar } from 'lucide-react';

interface Cycle {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  type: string;
  status: string;
  _count: { reviews: number };
}

export default function AdminCyclesPage() {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [type, setType] = useState('QUARTERLY');
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState('');

  useEffect(() => {
    fetch('/api/reviews/cycles').then(r => r.ok ? r.json() : []).then(d => { setCycles(d); setLoading(false); });
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    const res = await fetch('/api/reviews/cycles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, startDate, endDate, type }),
    });
    if (res.ok) {
      const data = await res.json();
      setResult(`Cycle created! ${data.reviewsGenerated} review pairs generated.`);
      setShowCreate(false);
      setName(''); setStartDate(''); setEndDate('');
      const refresh = await fetch('/api/reviews/cycles');
      if (refresh.ok) setCycles(await refresh.json());
      setTimeout(() => setResult(''), 5000);
    }
    setCreating(false);
  };

  return (
    <DashboardLayout type="admin">
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader title="Review Cycles" description="Create and manage performance review cycles" badge="Admin">
          <button onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-[rgb(var(--color-text-inverse))] rounded-lg text-sm font-medium hover:opacity-90 focus-ring">
            <Plus className="w-4 h-4" /> New Cycle
          </button>
        </PageHeader>

        {result && (
          <div className="bg-success-muted text-success rounded-lg px-4 py-3 text-sm font-medium">{result}</div>
        )}

        {loading ? (
          <div className="text-center py-12 text-secondary">Loading...</div>
        ) : cycles.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="w-16 h-16 text-tertiary mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-primary mb-2">No review cycles</h3>
            <p className="text-sm text-secondary">Create your first review cycle to start performance reviews</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cycles.map(cycle => (
              <motion.div key={cycle.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="card-stat">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-primary">{cycle.name}</h3>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cycle.status === 'ACTIVE' ? 'bg-success-muted text-success' : 'bg-surface-secondary text-secondary'}`}>
                        {cycle.status}
                      </span>
                    </div>
                    <p className="text-xs text-tertiary">
                      {new Date(cycle.startDate).toLocaleDateString()} – {new Date(cycle.endDate).toLocaleDateString()} · {cycle.type.replace('_', ' ')} · {cycle._count.reviews} reviews
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Create Modal */}
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowCreate(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="relative bg-surface-elevated rounded-xl border border-theme shadow-theme-xl p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold text-primary mb-4">New Review Cycle</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <input value={name} onChange={e => setName(e.target.value)} required placeholder="Cycle name (e.g., Q1 2026)"
                  className="w-full px-3 py-2 bg-surface-primary border border-theme rounded-lg text-sm text-primary focus-ring" />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-secondary mb-1 block">Start Date</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required
                      className="w-full px-3 py-2 bg-surface-primary border border-theme rounded-lg text-sm text-primary focus-ring" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-secondary mb-1 block">End Date</label>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required
                      className="w-full px-3 py-2 bg-surface-primary border border-theme rounded-lg text-sm text-primary focus-ring" />
                  </div>
                </div>
                <select value={type} onChange={e => setType(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-primary border border-theme rounded-lg text-sm text-primary focus-ring">
                  <option value="QUARTERLY">Quarterly</option>
                  <option value="SEMI_ANNUAL">Semi-Annual</option>
                  <option value="ANNUAL">Annual</option>
                </select>
                <p className="text-xs text-tertiary">Reviews will be auto-generated for all employees with assigned managers.</p>
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2 text-sm text-secondary focus-ring rounded-lg">Cancel</button>
                  <button type="submit" disabled={creating}
                    className="flex-1 px-4 py-2 bg-accent text-[rgb(var(--color-text-inverse))] rounded-lg text-sm font-medium focus-ring disabled:opacity-50">
                    {creating ? 'Creating...' : 'Create Cycle'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

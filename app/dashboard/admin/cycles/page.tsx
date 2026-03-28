'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import PageSkeleton from '@/app/components/shared/PageSkeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Calendar, X } from 'lucide-react';

interface Cycle {
  id: string; name: string; startDate: string; endDate: string; type: string; status: string; _count: { reviews: number };
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
    const res = await fetch('/api/reviews/cycles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, startDate, endDate, type }) });
    if (res.ok) {
      const data = await res.json();
      setResult(`Cycle created! ${data.reviewsGenerated} review pairs generated.`);
      setShowCreate(false); setName(''); setStartDate(''); setEndDate('');
      const refresh = await fetch('/api/reviews/cycles');
      if (refresh.ok) setCycles(await refresh.json());
      setTimeout(() => setResult(''), 5000);
    }
    setCreating(false);
  };

  return (
    <DashboardLayout type="admin">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="page-title"><Calendar className="w-6 h-6" style={{ color: 'rgb(var(--color-review))' }} /> Review Cycles</h1>
            <p className="page-subtitle">Create and manage performance review cycles</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Cycle
          </button>
        </div>

        {result && <div className="bg-success-muted text-success rounded-xl px-4 py-3 text-sm font-medium">{result}</div>}

        {loading ? (
          <PageSkeleton type="cards" count={2} />
        ) : cycles.length === 0 ? (
          <div className="empty-container">
            <div className="empty-icon-ring" style={{ backgroundColor: 'rgba(var(--color-review),0.1)' }}>
              <Calendar className="w-10 h-10" style={{ color: 'rgb(var(--color-review))' }} />
            </div>
            <p className="empty-title">No review cycles</p>
            <p className="empty-description">Create your first review cycle to start performance reviews</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cycles.map((cycle, i) => (
              <motion.div key={cycle.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="card-interactive p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="icon-box-lg" style={{ backgroundColor: 'rgba(var(--color-review),0.1)' }}>
                      <Calendar className="w-6 h-6" style={{ color: 'rgb(var(--color-review))' }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-sm font-semibold text-primary">{cycle.name}</h3>
                        <span className={`badge-base ${cycle.status === 'ACTIVE' ? 'bg-[rgba(var(--color-review),0.12)] text-[rgb(var(--color-review))]' : 'bg-surface-secondary text-secondary'}`}>{cycle.status}</span>
                      </div>
                      <p className="text-xs text-tertiary">
                        {new Date(cycle.startDate).toLocaleDateString()} – {new Date(cycle.endDate).toLocaleDateString()} · {cycle.type.replace('_', ' ')} · {cycle._count.reviews} reviews
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Create Modal */}
        <AnimatePresence>
          {showCreate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-backdrop" onClick={() => setShowCreate(false)} />
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="modal-panel max-w-md">
                <div className="flex justify-between items-center mb-5">
                  <h2 className="text-lg font-bold text-primary flex items-center gap-2">
                    <Calendar className="w-5 h-5" style={{ color: 'rgb(var(--color-review))' }} /> New Review Cycle
                  </h2>
                  <button onClick={() => setShowCreate(false)} className="text-secondary hover:text-primary focus-ring rounded-lg p-1"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div><label className="input-label">Cycle Name</label>
                    <input value={name} onChange={e => setName(e.target.value)} required placeholder="e.g., Q1 2026" className="input-base" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="input-label">Start Date</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required className="input-base" /></div>
                    <div><label className="input-label">End Date</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required className="input-base" /></div>
                  </div>
                  <div><label className="input-label">Type</label>
                    <select value={type} onChange={e => setType(e.target.value)} className="input-select w-full">
                      <option value="QUARTERLY">Quarterly</option><option value="SEMI_ANNUAL">Semi-Annual</option><option value="ANNUAL">Annual</option>
                    </select></div>
                  <p className="text-xs text-tertiary">Reviews will be auto-generated for all employees with assigned managers.</p>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
                    <button type="submit" disabled={creating} className="btn-primary flex-1">{creating ? 'Creating...' : 'Create Cycle'}</button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import PageSkeleton from '@/app/components/shared/PageSkeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Plus, ToggleLeft, ToggleRight } from 'lucide-react';

interface CompanyValue {
  id: string; name: string; isActive: boolean; createdAt: string; _count: { hearts: number };
}

export default function AdminValuesPage() {
  const [values, setValues] = useState<CompanyValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [newValueName, setNewValueName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const fetchValues = useCallback(async () => {
    const res = await fetch('/api/admin/values');
    if (res.ok) setValues(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchValues(); }, [fetchValues]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValueName.trim()) return;
    setCreating(true); setError('');
    const res = await fetch('/api/admin/values', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newValueName.trim() }) });
    if (res.ok) { setNewValueName(''); await fetchValues(); }
    else { const d = await res.json(); setError(d.error || 'Failed to create'); }
    setCreating(false);
  };

  const handleToggle = async (valueId: string, currentActive: boolean) => {
    await fetch(`/api/admin/values/${valueId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !currentActive }) });
    await fetchValues();
  };

  const activeCount = values.filter(v => v.isActive).length;
  const totalHearts = values.reduce((sum, v) => sum + v._count.hearts, 0);

  return (
    <DashboardLayout type="admin">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="page-title"><Heart className="w-6 h-6" style={{ color: 'rgb(var(--color-heart))' }} /> Company Values</h1>
          <p className="page-subtitle">Configure the values employees can recognize each other for</p>
        </div>

        {/* Stats */}
        {!loading && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total Values', value: values.length },
              { label: 'Active', value: activeCount },
              { label: 'Total Hearts', value: totalHearts },
            ].map(({ label, value }) => (
              <div key={label} className="card-stat text-center">
                <p className="text-2xl font-bold text-primary">{value}</p>
                <p className="text-2xs text-tertiary">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Create new value */}
        <form onSubmit={handleCreate} className="card-stat">
          <label className="input-label">Add New Value</label>
          <div className="flex gap-3">
            <input type="text" value={newValueName} onChange={(e) => setNewValueName(e.target.value)}
              placeholder="e.g., Innovation, Teamwork, Ownership..." className="input-base" maxLength={50} />
            <button type="submit" disabled={creating || !newValueName.trim()} className="btn-primary inline-flex items-center gap-2 flex-shrink-0">
              <Plus className="w-4 h-4" /> {creating ? 'Adding...' : 'Add'}
            </button>
          </div>
          {error && <p className="text-xs text-error mt-2">{error}</p>}
        </form>

        {/* Values list */}
        {loading ? (
          <PageSkeleton type="cards" count={3} />
        ) : values.length === 0 ? (
          <div className="empty-container">
            <div className="empty-icon-ring" style={{ backgroundColor: 'rgba(var(--color-heart),0.1)' }}>
              <Heart className="w-10 h-10" style={{ color: 'rgb(var(--color-heart))' }} />
            </div>
            <p className="empty-title">No company values yet</p>
            <p className="empty-description">Add values above so employees can recognize each other</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {values.map((value) => (
                <motion.div key={value.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex items-center justify-between p-4 card-interactive ${!value.isActive ? 'opacity-60' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className={`icon-box-md ${value.isActive ? 'bg-[rgba(var(--color-heart),0.1)]' : 'bg-surface-secondary'}`}>
                      <Heart className={`w-5 h-5 ${value.isActive ? 'text-[rgb(var(--color-heart))]' : 'text-tertiary'}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-primary">{value.name}</p>
                      <p className="text-xs text-tertiary">{value._count.hearts} {value._count.hearts === 1 ? 'heart' : 'hearts'} given{!value.isActive && ' · Inactive'}</p>
                    </div>
                  </div>
                  <button onClick={() => handleToggle(value.id, value.isActive)} className="focus-ring rounded-lg p-1"
                    title={value.isActive ? 'Deactivate' : 'Activate'} aria-label={value.isActive ? `Deactivate ${value.name}` : `Activate ${value.name}`}>
                    {value.isActive ? <ToggleRight className="w-8 h-8 text-success" /> : <ToggleLeft className="w-8 h-8 text-tertiary" />}
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { PageHeader } from '@/app/components/shared/PageHeader';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Plus, ToggleLeft, ToggleRight } from 'lucide-react';

interface CompanyValue {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  _count: { hearts: number };
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
    setCreating(true);
    setError('');

    const res = await fetch('/api/admin/values', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newValueName.trim() }),
    });

    if (res.ok) {
      setNewValueName('');
      await fetchValues();
    } else {
      const data = await res.json();
      setError(data.error || 'Failed to create value');
    }
    setCreating(false);
  };

  const handleToggle = async (valueId: string, currentActive: boolean) => {
    await fetch(`/api/admin/values/${valueId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !currentActive }),
    });
    await fetchValues();
  };

  const activeCount = values.filter(v => v.isActive).length;
  const totalHearts = values.reduce((sum, v) => sum + v._count.hearts, 0);

  return (
    <DashboardLayout type="admin">
      <div className="max-w-3xl mx-auto space-y-6">
        <PageHeader title="Company Values" description="Configure the values employees can recognize each other for" badge="Admin" />

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-surface-elevated rounded-lg border border-theme p-4 shadow-theme-sm text-center">
            <p className="text-2xl font-bold text-primary">{values.length}</p>
            <p className="text-xs text-secondary">Total Values</p>
          </div>
          <div className="bg-surface-elevated rounded-lg border border-theme p-4 shadow-theme-sm text-center">
            <p className="text-2xl font-bold text-success">{activeCount}</p>
            <p className="text-xs text-secondary">Active</p>
          </div>
          <div className="bg-surface-elevated rounded-lg border border-theme p-4 shadow-theme-sm text-center">
            <p className="text-2xl font-bold text-accent">{totalHearts}</p>
            <p className="text-xs text-secondary">Total Hearts</p>
          </div>
        </div>

        {/* Create new value */}
        <form onSubmit={handleCreate} className="bg-surface-elevated rounded-lg border border-theme p-4 shadow-theme-sm">
          <label className="text-sm font-medium text-secondary mb-2 block">Add New Value</label>
          <div className="flex gap-3">
            <input
              type="text"
              value={newValueName}
              onChange={(e) => setNewValueName(e.target.value)}
              placeholder="e.g., Innovation, Teamwork, Ownership..."
              className="flex-1 px-3 py-2 bg-surface-primary border border-theme rounded-lg text-sm text-primary placeholder:text-tertiary focus-ring"
              maxLength={50}
            />
            <button
              type="submit"
              disabled={creating || !newValueName.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-[rgb(var(--color-text-inverse))] rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 focus-ring"
            >
              <Plus className="w-4 h-4" />
              {creating ? 'Adding...' : 'Add'}
            </button>
          </div>
          {error && <p className="text-xs text-error mt-2">{error}</p>}
        </form>

        {/* Values list */}
        <div className="space-y-2">
          {loading ? (
            <div className="text-center py-12 text-secondary">Loading values...</div>
          ) : values.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="w-12 h-12 text-tertiary mx-auto mb-3" />
              <p className="text-secondary">No company values yet</p>
              <p className="text-xs text-tertiary mt-1">Add values above so employees can recognize each other</p>
            </div>
          ) : (
            <AnimatePresence>
              {values.map((value) => (
                <motion.div
                  key={value.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-center justify-between p-4 bg-surface-elevated rounded-lg border border-theme shadow-theme-sm ${
                    !value.isActive ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${value.isActive ? 'bg-accent-muted' : 'bg-surface-secondary'}`}>
                      <Heart className={`w-5 h-5 ${value.isActive ? 'text-accent' : 'text-tertiary'}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-primary">{value.name}</p>
                      <p className="text-xs text-tertiary">
                        {value._count.hearts} {value._count.hearts === 1 ? 'heart' : 'hearts'} given
                        {!value.isActive && ' · Inactive'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggle(value.id, value.isActive)}
                    className="focus-ring rounded-lg p-1"
                    title={value.isActive ? 'Deactivate value' : 'Activate value'}
                    aria-label={value.isActive ? `Deactivate ${value.name}` : `Activate ${value.name}`}
                  >
                    {value.isActive ? (
                      <ToggleRight className="w-8 h-8 text-success" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-tertiary" />
                    )}
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

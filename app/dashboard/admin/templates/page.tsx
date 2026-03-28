'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import PageSkeleton from '@/app/components/shared/PageSkeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Plus, ToggleLeft, ToggleRight } from 'lucide-react';

interface GoalTemplate {
  id: string; title: string; description: string | null; category: string | null; isActive: boolean;
}

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<GoalTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const fetchTemplates = useCallback(async () => {
    const res = await fetch('/api/goals/templates');
    if (res.ok) setTemplates(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true); setError('');
    const res = await fetch('/api/goals/templates', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim(), description: description || undefined, category: category || undefined }),
    });
    if (res.ok) { setTitle(''); setDescription(''); setCategory(''); await fetchTemplates(); }
    else { const d = await res.json(); setError(d.error || 'Failed'); }
    setCreating(false);
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    await fetch(`/api/goals/templates/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !isActive }) });
    await fetchTemplates();
  };

  return (
    <DashboardLayout type="admin">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="page-title"><Target className="w-6 h-6" style={{ color: 'rgb(var(--color-goal-active))' }} /> Goal Templates</h1>
          <p className="page-subtitle">Create reusable templates for quick goal creation</p>
        </div>

        {/* Create form */}
        <form onSubmit={handleCreate} className="card-stat space-y-3">
          <label className="input-label">New Template</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Template title (e.g., Complete Q1 OKRs)" className="input-base" maxLength={200} required />
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)" rows={2} className="input-textarea" maxLength={2000} />
          <div className="flex gap-3">
            <input value={category} onChange={e => setCategory(e.target.value)} placeholder="Category (optional)" className="input-base" maxLength={50} />
            <button type="submit" disabled={creating || !title.trim()} className="btn-primary inline-flex items-center gap-2 flex-shrink-0">
              <Plus className="w-4 h-4" /> {creating ? 'Adding...' : 'Add'}
            </button>
          </div>
          {error && <p className="text-xs text-error">{error}</p>}
        </form>

        {/* Templates list */}
        {loading ? (
          <PageSkeleton type="cards" count={3} />
        ) : templates.length === 0 ? (
          <div className="empty-container">
            <div className="empty-icon-ring" style={{ backgroundColor: 'rgba(var(--color-goal-active),0.1)' }}>
              <Target className="w-10 h-10" style={{ color: 'rgb(var(--color-goal-active))' }} />
            </div>
            <p className="empty-title">No goal templates yet</p>
            <p className="empty-description">Create templates above for quick goal creation</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {templates.map(t => (
                <motion.div key={t.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex items-center justify-between p-4 card-interactive ${!t.isActive ? 'opacity-60' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className={`icon-box-md ${t.isActive ? 'bg-[rgba(var(--color-goal-active),0.1)]' : 'bg-surface-secondary'}`}>
                      <Target className={`w-5 h-5 ${t.isActive ? 'text-[rgb(var(--color-goal-active))]' : 'text-tertiary'}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-primary">{t.title}</p>
                      <p className="text-xs text-tertiary">
                        {t.category && <span className="badge-base bg-surface-secondary text-secondary mr-1">{t.category}</span>}
                        {t.description && <span className="line-clamp-1">{t.description}</span>}
                        {!t.isActive && ' · Inactive'}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => handleToggle(t.id, t.isActive)} className="focus-ring rounded-lg p-1"
                    aria-label={t.isActive ? `Deactivate ${t.title}` : `Activate ${t.title}`}>
                    {t.isActive ? <ToggleRight className="w-8 h-8 text-success" /> : <ToggleLeft className="w-8 h-8 text-tertiary" />}
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

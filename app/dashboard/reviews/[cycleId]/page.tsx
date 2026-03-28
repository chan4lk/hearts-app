'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import HeartButton from '@/app/components/hearts/HeartButton';
import PageSkeleton from '@/app/components/shared/PageSkeleton';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, Clock, FileText, Lock } from 'lucide-react';
import Link from 'next/link';

interface Review {
  id: string;
  employeeId: string;
  managerId: string;
  selfComments: string | null;
  selfRating: number | null;
  selfSubmittedAt: string | null;
  managerComments: string | null;
  managerRating: number | null;
  managerSubmittedAt: string | null;
  isFinalized: boolean;
  employee: { id: string; name: string; department: string | null };
  manager: { id: string; name: string };
}

interface CycleDetail {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  type: string;
  status: string;
  reviews: Review[];
  stats: { total: number; selfCompleted: number; managerCompleted: number; finalized: number };
}

export default function CycleDetailPage() {
  const { cycleId } = useParams();
  const { data: session } = useSession();
  const router = useRouter();
  const [cycle, setCycle] = useState<CycleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeReview, setActiveReview] = useState<Review | null>(null);
  const [selfComments, setSelfComments] = useState('');
  const [selfRating, setSelfRating] = useState(3);
  const [managerComments, setManagerComments] = useState('');
  const [managerRating, setManagerRating] = useState(3);
  const [saving, setSaving] = useState(false);
  const [evidence, setEvidence] = useState<{ goals: any[]; hearts: any[] } | null>(null);

  useEffect(() => {
    fetch(`/api/reviews/cycles/${cycleId}`).then(r => r.ok ? r.json() : null).then(data => {
      setCycle(data);
      setLoading(false);
    });
  }, [cycleId]);

  const userId = session?.user?.id;
  const userRole = session?.user?.role;
  const isManager = userRole === 'MANAGER' || userRole === 'ADMIN';

  // Find my review (as employee)
  const myReview = cycle?.reviews.find(r => r.employeeId === userId);
  // Find reviews I need to do (as manager)
  const teamReviews = cycle?.reviews.filter(r => r.managerId === userId) || [];

  const openReview = async (review: Review) => {
    setActiveReview(review);
    setSelfComments(review.selfComments || '');
    setSelfRating(review.selfRating || 3);
    setManagerComments(review.managerComments || '');
    setManagerRating(review.managerRating || 3);
    // Load evidence (goals + hearts) for this employee
    const res = await fetch(`/api/reviews/${review.id}`);
    if (res.ok) {
      const data = await res.json();
      setEvidence(data.evidence || null);
    }
  };

  const saveSelfReview = async () => {
    if (!activeReview) return;
    setSaving(true);
    await fetch(`/api/reviews/${activeReview.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selfComments, selfRating }),
    });
    setSaving(false);
    setActiveReview(null);
    // Refresh
    const res = await fetch(`/api/reviews/cycles/${cycleId}`);
    if (res.ok) setCycle(await res.json());
  };

  const saveManagerReview = async () => {
    if (!activeReview) return;
    setSaving(true);
    await fetch(`/api/reviews/${activeReview.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ managerComments, managerRating }),
    });
    setSaving(false);
    setActiveReview(null);
    const res = await fetch(`/api/reviews/cycles/${cycleId}`);
    if (res.ok) setCycle(await res.json());
  };

  const finalizeReview = async (reviewId: string) => {
    if (!confirm('Finalize this review? It will become immutable.')) return;
    await fetch(`/api/reviews/${reviewId}/finalize`, { method: 'POST' });
    const res = await fetch(`/api/reviews/cycles/${cycleId}`);
    if (res.ok) setCycle(await res.json());
  };

  if (loading) return <DashboardLayout type="employee"><div className="max-w-4xl mx-auto pt-4"><PageSkeleton type="detail" /></div></DashboardLayout>;
  if (!cycle) return <DashboardLayout type="employee"><div className="text-center py-12 text-error">Cycle not found</div></DashboardLayout>;

  const completionPct = cycle.stats.total > 0 ? Math.round((cycle.stats.finalized / cycle.stats.total) * 100) : 0;

  return (
    <DashboardLayout type="employee">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/reviews" className="text-secondary hover:text-primary focus-ring rounded p-1">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-primary">{cycle.name}</h1>
            <p className="text-xs text-tertiary">{new Date(cycle.startDate).toLocaleDateString()} – {new Date(cycle.endDate).toLocaleDateString()} · {cycle.type.replace('_', ' ')}</p>
          </div>
        </div>

        {/* Progress stats */}
        <div className="card-stat">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-primary">Cycle Progress</span>
            <span className="text-sm font-bold text-accent">{completionPct}%</span>
          </div>
          <div className="h-3 bg-surface-secondary rounded-full overflow-hidden mb-3">
            <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${completionPct}%` }} />
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div><p className="text-lg font-bold text-primary">{cycle.stats.selfCompleted}/{cycle.stats.total}</p><p className="text-xs text-secondary">Self-Reviews</p></div>
            <div><p className="text-lg font-bold text-primary">{cycle.stats.managerCompleted}/{cycle.stats.total}</p><p className="text-xs text-secondary">Manager Reviews</p></div>
            <div><p className="text-lg font-bold text-success">{cycle.stats.finalized}/{cycle.stats.total}</p><p className="text-xs text-secondary">Finalized</p></div>
          </div>
        </div>

        {/* My Self-Review */}
        {myReview && (
          <div className="card-stat">
            <h3 className="text-sm font-semibold text-primary mb-3">My Self-Review</h3>
            {myReview.isFinalized ? (
              <div className="flex items-center gap-2 text-success">
                <Lock className="w-4 h-4" /> <span className="text-sm">Review finalized</span>
              </div>
            ) : myReview.selfSubmittedAt ? (
              <div className="flex items-center gap-2 text-info">
                <CheckCircle className="w-4 h-4" /> <span className="text-sm">Self-review submitted — waiting for manager</span>
              </div>
            ) : (
              <button onClick={() => openReview(myReview)} className="px-4 py-2 bg-accent text-[rgb(var(--color-text-inverse))] rounded-lg text-sm font-medium hover:opacity-90 focus-ring">
                Complete Self-Review
              </button>
            )}
          </div>
        )}

        {/* Manager: Team Reviews */}
        {isManager && teamReviews.length > 0 && (
          <div className="bg-surface-elevated rounded-xl border border-theme shadow-theme-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-theme">
              <h3 className="text-sm font-semibold text-primary">Team Reviews ({teamReviews.length})</h3>
            </div>
            <div className="divide-y divide-[rgb(var(--color-border-theme))]">
              {teamReviews.map((review) => (
                <div key={review.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-primary">{review.employee.name}</p>
                    <div className="flex items-center gap-2 text-xs text-tertiary mt-0.5">
                      {review.selfSubmittedAt ? <span className="text-success">Self-review done</span> : <span className="text-warning">Self-review pending</span>}
                      {review.managerSubmittedAt && <span className="text-info">· Your review done</span>}
                      {review.isFinalized && <span className="text-success">· Finalized</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!review.isFinalized && (
                      <>
                        <button onClick={() => openReview(review)} className="text-xs font-medium text-accent hover:opacity-80 focus-ring rounded px-2 py-1">
                          {review.managerSubmittedAt ? 'Edit' : 'Review'}
                        </button>
                        {review.managerSubmittedAt && (
                          <button onClick={() => finalizeReview(review.id)} className="text-xs font-medium text-success hover:opacity-80 focus-ring rounded px-2 py-1">
                            Finalize
                          </button>
                        )}
                      </>
                    )}
                    {review.isFinalized && <Lock className="w-4 h-4 text-tertiary" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Review Form Modal */}
        {activeReview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="modal-backdrop" onClick={() => setActiveReview(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="modal-panel max-w-lg max-h-[80vh] overflow-y-auto">
              <h2 className="text-lg font-semibold text-primary mb-4">
                {activeReview.employeeId === userId ? 'Self-Review' : `Review: ${activeReview.employee.name}`}
              </h2>

              {/* Evidence Panel — Hearts + Goals pre-populated */}
              {evidence && (
                <div className="space-y-3 mb-4">
                  {/* Goals evidence */}
                  {evidence.goals.length > 0 && (
                    <div className="bg-surface-secondary rounded-lg p-3">
                      <p className="text-xs font-semibold text-secondary mb-2">Goals ({evidence.goals.length})</p>
                      <div className="space-y-1.5">
                        {evidence.goals.map((g: any) => (
                          <div key={g.id} className="flex items-center justify-between text-xs">
                            <span className="text-primary font-medium truncate flex-1">{g.title}</span>
                            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                              <div className="w-16 h-1.5 bg-surface-primary rounded-full overflow-hidden">
                                <div className="h-full bg-accent rounded-full" style={{ width: `${g.progress}%` }} />
                              </div>
                              <span className="text-tertiary w-8 text-right">{g.progress}%</span>
                              <span className={`px-1.5 py-0.5 rounded text-2xs font-medium ${
                                g.status === 'COMPLETED' ? 'bg-success-muted text-success' :
                                g.status === 'ACTIVE' ? 'bg-info-muted text-info' : 'bg-surface-primary text-secondary'
                              }`}>{g.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Hearts evidence */}
                  {evidence.hearts.length > 0 && (
                    <div className="bg-surface-secondary rounded-lg p-3">
                      <p className="text-xs font-semibold text-secondary mb-2">Hearts Received ({evidence.hearts.length})</p>
                      <div className="space-y-1.5 max-h-[150px] overflow-y-auto">
                        {evidence.hearts.map((h: any) => (
                          <div key={h.id} className="flex items-center gap-2 text-xs">
                            <span className="text-accent font-medium">♥</span>
                            <span className="text-primary">{h.sender?.name}</span>
                            <span className="px-1.5 py-0.5 rounded-full bg-accent-muted text-accent text-2xs font-medium">{h.valueTag?.name}</span>
                            {h.message && <span className="text-tertiary truncate flex-1">— {h.message}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {evidence.goals.length === 0 && evidence.hearts.length === 0 && (
                    <p className="text-xs text-tertiary text-center py-2">No goals or hearts data for this review period</p>
                  )}
                </div>
              )}

              {/* Self-review form */}
              {activeReview.employeeId === userId && !activeReview.selfSubmittedAt && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-secondary mb-1 block">Self-Assessment</label>
                    <textarea value={selfComments} onChange={e => setSelfComments(e.target.value)} rows={5} maxLength={5000}
                      placeholder="Reflect on your performance this period..."
                      className="w-full px-3 py-2 bg-surface-primary border border-theme rounded-lg text-sm text-primary focus-ring resize-none" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-secondary mb-1 block">Self-Rating (1-5)</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button key={n} onClick={() => setSelfRating(n)}
                          className={`w-10 h-10 rounded-lg text-sm font-bold focus-ring ${selfRating === n ? 'bg-accent text-[rgb(var(--color-text-inverse))]' : 'bg-surface-secondary text-secondary hover:bg-surface-tertiary'}`}>
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button onClick={saveSelfReview} disabled={saving || !selfComments.trim()}
                    className="w-full py-2 bg-accent text-[rgb(var(--color-text-inverse))] rounded-lg text-sm font-medium focus-ring disabled:opacity-50">
                    {saving ? 'Saving...' : 'Submit Self-Review'}
                  </button>
                </div>
              )}

              {/* Manager review form */}
              {activeReview.managerId === userId && (
                <div className="space-y-4">
                  {/* Show employee's self-review if available */}
                  {activeReview.selfComments && (
                    <div className="bg-surface-secondary rounded-lg p-3">
                      <p className="text-xs font-semibold text-secondary mb-1">Employee Self-Review (Rating: {activeReview.selfRating}/5)</p>
                      <p className="text-sm text-primary whitespace-pre-wrap">{activeReview.selfComments}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-secondary mb-1 block">Manager Comments</label>
                    <textarea value={managerComments} onChange={e => setManagerComments(e.target.value)} rows={5} maxLength={5000}
                      placeholder="Provide your assessment..."
                      className="w-full px-3 py-2 bg-surface-primary border border-theme rounded-lg text-sm text-primary focus-ring resize-none" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-secondary mb-1 block">Rating (1-5)</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button key={n} onClick={() => setManagerRating(n)}
                          className={`w-10 h-10 rounded-lg text-sm font-bold focus-ring ${managerRating === n ? 'bg-accent text-[rgb(var(--color-text-inverse))]' : 'bg-surface-secondary text-secondary hover:bg-surface-tertiary'}`}>
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button onClick={saveManagerReview} disabled={saving || !managerComments.trim()}
                    className="w-full py-2 bg-accent text-[rgb(var(--color-text-inverse))] rounded-lg text-sm font-medium focus-ring disabled:opacity-50">
                    {saving ? 'Saving...' : 'Submit Manager Review'}
                  </button>
                </div>
              )}

              <button onClick={() => setActiveReview(null)} className="mt-3 w-full py-2 text-sm text-secondary hover:text-primary focus-ring rounded-lg">Cancel</button>
            </motion.div>
          </div>
        )}
      </div>
      <HeartButton />
    </DashboardLayout>
  );
}

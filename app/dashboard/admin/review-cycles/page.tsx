'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { LoadingSkeleton, ErrorState, EmptyState } from '@/app/components/shared/feedback';
import { ModalShell } from '@/app/components/ui/form-primitives';

import StatsSection, { StatItem } from '@/app/components/shared/StatsSection';

import ReviewCycleTable from './components/ReviewCycleTable';
import ReviewCycleForm from './components/ReviewCycleForm';
import ImportExcelModal from './components/ImportExcelModal';
import { Pagination } from '@/app/components/shared/Pagination';
import PageToolbar from '@/app/components/shared/PageToolbar';
import { BsArrowLeft, BsPerson, BsCheckCircle, BsClock, BsClipboardPlus, BsArrowRepeat } from 'react-icons/bs';
import Link from 'next/link';
import { DeleteConfirmationModal } from '@/app/components/shared/DeleteConfirmationModal';

interface ReviewCycle {
  id: string;
  userId: string;
  reportingPersonId?: string | null;
  jobCategory: string | null;
  designation: string | null;
  dateOfAppointment: string | null;
  after6Months: string | null;
  reviewMonth: string | null;
  adjustedReviewMonth: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    manager?: {
      id: string;
      name: string;
      email: string;
    } | null;
  };
  reportingPerson?: {
    id: string;
    name: string;
    email: string;
  } | null;
  updatedBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export default function ReviewCyclesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [reviewCycles, setReviewCycles] = useState<ReviewCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState<ReviewCycle | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [cycleToDelete, setCycleToDelete] = useState<ReviewCycle | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null>(null);

  // Auth check — separate from data fetching to prevent re-fetch on session object change
  useEffect(() => {
    if (!session?.user || session.user.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [session, router]);

  // Fetch data — only depends on pagination, not session object reference
  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchReviewCycles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  const fetchReviewCycles = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy: 'updatedAt',
        sortOrder: 'desc'
      });
      
      const response = await fetch(`/api/admin/review-cycles?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch review cycles');
      }
      const data = await response.json();
      
      // Handle both old format (array) and new format (object with reviewCycles and pagination)
      if (Array.isArray(data)) {
        setReviewCycles(data);
        setPagination(null);
      } else {
        setReviewCycles(data.reviewCycles || []);
        setPagination(data.pagination || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load review cycles');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const handleSave = async (formData: any) => {
    const isEditing = !!editingCycle;
    const previousEditingCycle = editingCycle;
    
    // Optimistically close form immediately for fast UI response
    setIsFormOpen(false);
    setEditingCycle(null);
    
    // Show success toast immediately
    // Toast removed
    
    // Optimistically update UI immediately
    if (isEditing && previousEditingCycle) {
      // Optimistically update existing cycle in the list
      setReviewCycles(prevCycles => 
        prevCycles.map(cycle => 
          cycle.id === previousEditingCycle.id 
            ? { 
                ...cycle, 
                ...formData,
                updatedAt: new Date().toISOString()
              }
            : cycle
        )
      );
    }
    // For new cycles, we'll add it after server response to ensure correct data
    
    try {
      // Include the id if editing
      const payload = isEditing ? { ...formData, id: previousEditingCycle?.id } : formData;

      const response = await fetch('/api/admin/review-cycles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save review cycle');
      }

      // Refresh data in background silently (no loading indicator) to get server response
      // This ensures we have the complete data from server (including user names, etc.)
      await fetchReviewCycles(false); // false = don't show loading indicator
    } catch (error) {
      // On error, revert optimistic update and reopen form
      setIsFormOpen(true);
      setEditingCycle(previousEditingCycle);
      
      // Revert optimistic update by refreshing from server
      fetchReviewCycles(false); // false = don't show loading indicator
      
      // Toast removed
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/review-cycles?id=${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete review cycle');
      }

      // Toast removed
      fetchReviewCycles();
    } catch (error) {
      // Toast removed
    }
  };

  const handleEdit = (cycle: ReviewCycle) => {
    setEditingCycle(cycle);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingCycle(null);
  };
  if (loading) {
    return (
      <DashboardLayout type="admin">
        <LoadingSkeleton variant="page" />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout type="admin">
        <ErrorState message={error} onRetry={() => { setError(null); fetchReviewCycles(); }} />
      </DashboardLayout>
    );
  }

  if (reviewCycles.length === 0 && !searchQuery) {
    return (
      <DashboardLayout type="admin">
        <EmptyState title="No review cycles found" description="There are no review cycles yet. Create your first review cycle to get started." actionLabel="Create Cycle" onAction={() => { setEditingCycle(null); setIsFormOpen(true); }} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type="admin">
      <div className="fixed inset-0 top-16 left-0 md:left-60 right-0 bottom-0 bg-surface-primary flex flex-col overflow-hidden z-0">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 pointer-events-none bg-grid" />

        <div className="relative max-w-7xl mx-auto px-6 py-6 flex flex-col h-full w-full overflow-hidden">
          {/* Review Cycles Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex-shrink-0 mb-4 relative overflow-hidden rounded-2xl bg-gradient-to-r from-[rgb(var(--color-accent))]/8 via-[rgb(var(--color-info))]/5 to-[rgb(var(--color-success))]/8 border border-theme shadow-theme-sm"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[rgb(var(--color-accent))] via-[rgb(var(--color-info))] to-[rgb(var(--color-success))]" />
            <div className="absolute top-0 left-0 w-48 h-48 bg-[rgb(var(--color-accent))]/5 rounded-full -translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />
            <div className="relative px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-accent/10 border border-[rgb(var(--color-accent))]/20 flex items-center justify-center">
                  <BsArrowRepeat className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-primary">Review Cycles</h1>
                  <p className="text-xs text-secondary">Track and manage employee review timelines</p>
                </div>
              </div>
              {/* Timeline visual indicator */}
              <div className="hidden md:flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center">
                      <div className={`w-2.5 h-2.5 rounded-full ${i < 2 ? 'bg-[rgb(var(--color-success))]' : i === 2 ? 'bg-[rgb(var(--color-warning))]' : 'bg-surface-secondary border border-theme'}`} />
                      {i < 3 && <div className={`w-6 h-0.5 ${i < 2 ? 'bg-[rgb(var(--color-success))]/40' : 'bg-surface-secondary'}`} />}
                    </div>
                  ))}
                </div>
                <span className="text-xs text-secondary ml-1">Phase Progress</span>
              </div>
            </div>
          </motion.div>

          {/* Toolbar */}
          <div className="flex-shrink-0 pb-3">
            <PageToolbar
              searchValue={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Search review cycles..."
              actions={[
                {
                  label: 'Import Excel',
                  onClick: () => setIsImportModalOpen(true),
                  variant: 'export',
                },
                {
                  label: 'Create Cycle',
                  onClick: () => {
                    setEditingCycle(null);
                    setIsFormOpen(true);
                  },
                  variant: 'primary',
                },
              ]}
            />
          </div>

          {/* Stats Section */}
          <div className="flex-shrink-0 pb-3">
            {(() => {
              const completedCount = reviewCycles.filter(c => c.reviewMonth && c.reviewMonth !== '').length;
              const pendingCount = reviewCycles.length - completedCount;
              
              const statItems: StatItem[] = [
                {
                  title: 'Total Cycles',
                  value: pagination?.total || reviewCycles.length,
                  icon: <BsClipboardPlus className="w-4 h-4" />,
                },
                {
                  title: 'Completed',
                  value: completedCount,
                  icon: <BsCheckCircle className="w-4 h-4" />,
                },
                {
                  title: 'Pending',
                  value: pendingCount,
                  icon: <BsClock className="w-4 h-4" />,
                },
                {
                  title: 'Users',
                  value: new Set(reviewCycles.map(c => c.userId)).size,
                  icon: <BsPerson className="w-4 h-4" />,
                }
              ];
              return <StatsSection stats={statItems} />;
            })()}
          </div>

          {/* Review Cycles Table - Scrollable Container */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 flex flex-col overflow-hidden min-h-0"
            >
              <ReviewCycleTable
                reviewCycles={reviewCycles}
                onEdit={handleEdit}
                onDelete={(cycle) => {
                  setCycleToDelete(cycle);
                  setDeleteConfirmOpen(true);
                }}
                onRefresh={fetchReviewCycles}
              />
            
            </motion.div>
            
            {/* Pagination - Fixed at bottom */}
            {pagination && (
              <div className="flex-shrink-0 pt-4 pb-3 bg-surface-primary border-t border-theme">
                <Pagination
                  page={pagination.page}
                  limit={pagination.limit}
                  total={pagination.total}
                  totalPages={pagination.totalPages}
                  hasNext={pagination.hasNext}
                  hasPrev={pagination.hasPrev}
                  onPageChange={(newPage) => {
                    setPage(newPage);
                  }}
                  onLimitChange={(newLimit) => {
                    setLimit(newLimit);
                    setPage(1);
                  }}
                />
              </div>
            )}
          </div>

          {/* Review Cycle Form Modal */}
          <ModalShell
            open={isFormOpen}
            onClose={handleCloseForm}
            title={editingCycle ? 'Edit Review Cycle' : 'Create Review Cycle'}
            maxWidth="max-w-2xl"
          >
            <ReviewCycleForm
              reviewCycle={editingCycle}
              onSave={handleSave}
              onClose={handleCloseForm}
            />
          </ModalShell>

          {/* Delete Confirmation Modal */}
          <DeleteConfirmationModal
            isOpen={deleteConfirmOpen}
            onClose={() => {
              setDeleteConfirmOpen(false);
              setCycleToDelete(null);
            }}
            onConfirm={async () => {
              if (cycleToDelete) {
                await handleDelete(cycleToDelete.id);
                setDeleteConfirmOpen(false);
                setCycleToDelete(null);
              }
            }}
            title="Delete Review Cycle"
            message={`Are you sure you want to delete the review cycle for ${cycleToDelete?.user.name}? This action cannot be undone.`}
          />

          {/* Import Excel Modal */}
          <ImportExcelModal
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            onImportComplete={() => {
              setIsImportModalOpen(false);
              fetchReviewCycles();
            }}
          />

        </div>
      </div>
    </DashboardLayout>
  );
}


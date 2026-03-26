'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { LoadingSkeleton, ErrorState, EmptyState } from '@/app/components/shared/feedback';
import { ModalShell } from '@/app/components/ui/form-primitives';
import { PageHeader } from '@/app/components/shared/PageHeader';
import MetricStrip, { Metric } from '@/app/components/shared/MetricStrip';
import { useToast } from '@/app/components/shared/Toast';

import ReviewCycleTable from './components/ReviewCycleTable';
import ReviewCycleForm from './components/ReviewCycleForm';
import ImportExcelModal from './components/ImportExcelModal';
import { Pagination } from '@/app/components/shared/Pagination';
import PageToolbar from '@/app/components/shared/PageToolbar';
import { DeleteConfirmationModal } from '@/app/components/shared/DeleteConfirmationModal';
import { usePagination, useModalState } from '@/app/hooks';

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
  const toast = useToast();
  const [reviewCycles, setReviewCycles] = useState<ReviewCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState<ReviewCycle | null>(null);
  const deleteModal = useModalState<ReviewCycle>();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination state
  const { page, limit, setPage, setLimit, pagination, setPagination, paginationProps } = usePagination();

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
      } else {
        setReviewCycles(data.reviewCycles || []);
        if (data.pagination) {
          setPagination(data.pagination);
        }
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

      toast.success(isEditing ? 'Review cycle updated successfully' : 'Review cycle created successfully');

      // Refresh data in background silently (no loading indicator) to get server response
      // This ensures we have the complete data from server (including user names, etc.)
      await fetchReviewCycles(false); // false = don't show loading indicator
    } catch (error) {
      // On error, revert optimistic update and reopen form
      setIsFormOpen(true);
      setEditingCycle(previousEditingCycle);

      // Revert optimistic update by refreshing from server
      fetchReviewCycles(false); // false = don't show loading indicator

      toast.error(error instanceof Error ? error.message : 'Failed to save review cycle');
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

      toast.success('Review cycle deleted successfully');
      fetchReviewCycles();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete review cycle');
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

  const completedCount = reviewCycles.filter(c => c.reviewMonth && c.reviewMonth !== '').length;
  const pendingCount = reviewCycles.length - completedCount;

  const metrics: Metric[] = [
    {
      label: 'Total Cycles',
      value: pagination?.total || reviewCycles.length,
      color: 'accent',
    },
    {
      label: 'Completed',
      value: completedCount,
      color: 'success',
    },
    {
      label: 'Pending',
      value: pendingCount,
      color: 'warning',
    },
    {
      label: 'Users',
      value: new Set(reviewCycles.map(c => c.userId)).size,
      color: 'info',
    }
  ];

  return (
    <DashboardLayout type="admin">
      <div className="fixed inset-0 top-16 left-0 md:left-60 right-0 bottom-0 bg-surface-primary flex flex-col overflow-hidden z-0">
        <div className="relative max-w-7xl mx-auto px-6 py-6 flex flex-col h-full w-full overflow-hidden space-y-6">
          {/* Page Header */}
          <PageHeader
            title="Review Cycles"
            description="Track and manage employee review timelines"
            badge="Admin"
          />

          {/* Metric Strip */}
          <MetricStrip metrics={metrics} />

          {/* Toolbar */}
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

          {/* Review Cycles Table - Scrollable Container */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <div className="flex-1 flex flex-col overflow-hidden min-h-0">
              <ReviewCycleTable
                reviewCycles={reviewCycles}
                onEdit={handleEdit}
                onDelete={(cycle) => {
                  deleteModal.open(cycle);
                }}
                onRefresh={fetchReviewCycles}
              />
            </div>

            {/* Pagination - Fixed at bottom */}
            {paginationProps && (
              <div className="flex-shrink-0 pt-4 pb-3 bg-surface-primary border-t border-theme">
                <Pagination {...paginationProps} />
              </div>
            )}
          </div>

        </div>
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
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.close}
        onConfirm={async () => {
          if (deleteModal.data) {
            await handleDelete(deleteModal.data.id);
            deleteModal.close();
          }
        }}
        title="Delete Review Cycle"
        message={`Are you sure you want to delete the review cycle for ${deleteModal.data?.user.name}? This action cannot be undone.`}
      />

      {/* Import Excel Modal */}
      <ImportExcelModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={() => {
          setIsImportModalOpen(false);
          toast.success('Excel data imported successfully');
          fetchReviewCycles();
        }}
      />
    </DashboardLayout>
  );
}

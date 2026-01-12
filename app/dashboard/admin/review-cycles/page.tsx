'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import HeroSection from './components/HeroSection';
import ReviewCycleTable from './components/ReviewCycleTable';
import ReviewCycleForm from './components/ReviewCycleForm';
import ExcelImportModal from './components/ExcelImportModal';
import { Pagination } from '@/app/components/shared/Pagination';
import { showToast } from '@/app/utils/toast';
import { BsArrowLeft } from 'react-icons/bs';
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
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState<ReviewCycle | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [cycleToDelete, setCycleToDelete] = useState<ReviewCycle | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  
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

  useEffect(() => {
    if (!session?.user || session.user.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }
    fetchReviewCycles();
  }, [session, router, page, limit]);

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
    } catch (error) {
      console.error('Error fetching review cycles:', error);
      showToast.error('Failed to load review cycles', error);
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
    showToast.success(
      isEditing ? 'Review Cycle Updated' : 'Review Cycle Created', 
      'Review cycle information has been saved successfully'
    );
    
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
      
      showToast.error('Error', error instanceof Error ? error.message : 'Failed to save review cycle');
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

      showToast.success('Review Cycle Deleted', 'Review cycle has been deleted successfully');
      fetchReviewCycles();
    } catch (error) {
      showToast.error('Error', error instanceof Error ? error.message : 'Failed to delete review cycle');
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
  return (
    <DashboardLayout type="admin">
      <div className="fixed inset-0 top-16 left-0 md:left-64 right-0 bottom-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col overflow-hidden z-0">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5 pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto px-6 py-6 flex flex-col h-full w-full overflow-hidden">
          {/* Hero Section - Fixed */}
          <div className="flex-shrink-0 pt-3 pb-3 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 z-10 relative">
            <HeroSection 
              onAddNew={() => setIsFormOpen(true)}
              onImport={() => setImportModalOpen(true)}
            />
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
              <div className="flex-shrink-0 pt-4 pb-3 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-t border-gray-700/50">
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
          <AnimatePresence>
            {isFormOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                onClick={handleCloseForm}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-gray-900/95 backdrop-blur-sm rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-white/10"
                >
                  <ReviewCycleForm
                    reviewCycle={editingCycle}
                    onSave={handleSave}
                    onClose={handleCloseForm}
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

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

          {/* Excel Import Modal */}
          <ExcelImportModal
            isOpen={importModalOpen}
            onClose={() => setImportModalOpen(false)}
            onImportSuccess={() => {
              fetchReviewCycles();
            }}
          />

        </div>
      </div>
    </DashboardLayout>
  );
}


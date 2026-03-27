 'use client';
 
 import { useState, useEffect, useMemo } from 'react';
 import { useSession } from 'next-auth/react';
 import { useRouter } from 'next/navigation';
 import DashboardLayout from '@/app/components/layout/DashboardLayout';

 import MetricStrip, { Metric } from '@/app/components/shared/MetricStrip';
 import PageToolbar, { FilterSelect } from '@/app/components/shared/PageToolbar';

 import { PageHeader } from '@/app/components/shared/PageHeader';
 import { useToast } from '@/app/components/shared/Toast';
 import { LoadingSkeleton, ErrorState } from '@/app/components/shared/feedback';
 import { GoalWithRating } from '@/app/components/shared/types';
 import { Pagination } from '@/app/components/shared/Pagination';
import RatingGoalCard from '@/app/components/shared/RatingGoalCard';

 
 export default function SelfRatingPage() {
   const { data: session, status } = useSession();
   const router = useRouter();
   const toast = useToast();
   const [goals, setGoals] = useState<GoalWithRating[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
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
   const [selectedStatus, setSelectedStatus] = useState('all');
   const [selectedPriority, setSelectedPriority] = useState('');
   const [selectedCategory, setSelectedCategory] = useState('all');
   const [search, setSearch] = useState('');
   const [submittingMap, setSubmittingMap] = useState<Record<string, boolean>>({});
 
   useEffect(() => {
     if (status === 'unauthenticated') {
       router.push('/login');
       return;
     }
     if (status === 'authenticated') {
       fetchGoals();
     }
   }, [status, router, page, limit, selectedStatus, selectedPriority, selectedCategory, search]);
 
   const fetchGoals = async () => {
     try {
       setLoading(true);
       setError(null);
       // Only load rateable goals (exclude DRAFT, PENDING, REJECTED — can't rate those)
       const rateableStatus = selectedStatus && selectedStatus !== 'all'
         ? selectedStatus
         : undefined;
       const params = new URLSearchParams({
         view: 'my-goals',
         page: page.toString(),
         limit: limit.toString(),
         sortBy: 'createdAt',
         sortOrder: 'desc',
         ...(rateableStatus && { status: rateableStatus }),
         ...(selectedPriority && selectedPriority !== '' && { priority: selectedPriority }),
         ...(selectedCategory && selectedCategory !== '' && selectedCategory !== 'all' && { category: selectedCategory }),
         ...(search && search.trim() !== '' && { search })
       });
       const res = await fetch(`/api/goals?${params}`);
       if (!res.ok) {
         setGoals([]);
         setPagination(null);
         setLoading(false);
         return;
       }
       const data = await res.json();
       const list = Array.isArray(data) ? data : (data.goals || []);
       setGoals(list);
       if (data.pagination) {
         setPagination(data.pagination);
       }
     } catch (err) {
       setError(err instanceof Error ? err.message : 'Failed to load goals');
       setGoals([]);
     } finally {
       setLoading(false);
     }
   };
 
   // Only show rateable goals (APPROVED, IN_PROGRESS, COMPLETED, ON_HOLD, BLOCKED)
   const filteredGoals = useMemo(() => {
     const rateableStatuses = ['APPROVED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'BLOCKED'];
     return goals.filter(g => rateableStatuses.includes(g.status));
   }, [goals]);
 
   const statsMetrics: Metric[] = useMemo(() => {
     const total = filteredGoals.length;
     const completed = filteredGoals.filter(g => g.status === 'COMPLETED').length;
     const rated = filteredGoals.filter(g => g.rating?.selfScore != null).length;
     const completionRate = total > 0 ? Math.round((completed / total) * 1000) / 10 : 0;
     return [
       { label: 'My Goals', value: total, color: 'accent' as const },
       { label: 'Completed', value: completed, color: 'success' as const },
       { label: 'Self Rated', value: rated, color: 'info' as const },
       { label: 'Completion Rate', value: `${completionRate}%`, color: 'warning' as const },
     ];
   }, [filteredGoals]);
 
   const handleSelfRating = async (goalId: string, value: number) => {
     if (!goalId || isNaN(value)) return;
     setSubmittingMap(prev => ({ ...prev, [goalId]: true }));
     try {
       const res = await fetch(`/api/goals/${goalId}/self-rating`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ score: value, comments: '' })
       });
       if (!res.ok) {
         setSubmittingMap(prev => ({ ...prev, [goalId]: false }));
         toast.error('Failed to submit rating');
         return;
       }
       const data = await res.json();
       setGoals(prev => prev.map(g => g.id === goalId ? {
         ...g,
         rating: {
           id: data.id,
           goalId: goalId,
           selfScore: data.selfScore ?? undefined,
           score: data.selfScore ?? data.score ?? undefined,
           selfComments: data.comments ?? undefined,
           selfRatedAt: data.selfRatedAt ?? undefined,
           selfRatedById: data.selfRatedBy?.id ?? undefined,
           managerScore: data.managerScore ?? undefined,
           managerComments: data.managerComments ?? undefined,
           managerRatedAt: data.managerRatedAt ?? undefined,
           managerRatedById: data.managerRatedBy?.id ?? undefined,
           updatedAt: data.updatedAt ?? new Date().toISOString()
         }
       } : g));
       toast.success(`Rating updated to ${value} stars`);
     } finally {
       setSubmittingMap(prev => ({ ...prev, [goalId]: false }));
     }
   };
 
   return (
     <DashboardLayout type="employee">
       {loading ? <LoadingSkeleton variant="page" /> : error ? <ErrorState message={error} onRetry={() => { setError(null); fetchGoals(); }} /> :
       <div className="max-w-7xl mx-auto space-y-6">
           <PageHeader
             title="Self Rating"
             description="Rate your own performance"
           />

           <MetricStrip metrics={statsMetrics} />
           <PageToolbar
             searchValue={search}
             onSearchChange={(value) => {
               setSearch(value);
               setPage(1);
             }}
             searchPlaceholder="Search goals..."
             hasActiveFilters={selectedStatus !== 'all' || selectedPriority !== '' || selectedCategory !== 'all'}
             onClearFilters={() => {
               setSelectedStatus('all');
               setSelectedPriority('');
               setSelectedCategory('all');
               setSearch('');
               setPage(1);
             }}
           >
             <FilterSelect
               value={selectedStatus === 'all' ? '' : selectedStatus}
               onChange={(value) => {
                 setSelectedStatus(value || 'all');
                 setPage(1);
               }}
               options={[
                 { value: 'DRAFT', label: 'Draft' },
                 { value: 'PENDING', label: 'Pending' },
                 { value: 'APPROVED', label: 'Approved' },
                 { value: 'REJECTED', label: 'Rejected' },
                 { value: 'COMPLETED', label: 'Completed' },
               ]}
               placeholder="All Status"
             />
             <FilterSelect
               value={selectedPriority}
               onChange={(value) => {
                 setSelectedPriority(value);
                 setPage(1);
               }}
               options={[
                 { value: 'LOW', label: 'Low' },
                 { value: 'MEDIUM', label: 'Medium' },
                 { value: 'HIGH', label: 'High' },
                 { value: 'CRITICAL', label: 'Critical' },
               ]}
               placeholder="All Priority"
             />
             <FilterSelect
               value={selectedCategory === 'all' ? '' : selectedCategory}
               onChange={(value) => {
                 setSelectedCategory(value || 'all');
                 setPage(1);
               }}
               options={[
                 { value: 'PROFESSIONAL', label: 'Professional' },
                 { value: 'TECHNICAL', label: 'Technical' },
                 { value: 'LEADERSHIP', label: 'Leadership' },
                 { value: 'PERSONAL', label: 'Personal' },
                 { value: 'TRAINING', label: 'Training' },
                 { value: 'KPI', label: 'KPI' },
               ]}
               placeholder="All Categories"
             />
           </PageToolbar>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
             {filteredGoals.map(goal => (
               <RatingGoalCard
                 key={goal.id}
                 goal={goal}
                 onRatingChange={handleSelfRating}
                 submitting={submittingMap}
                 variant="self"
               />
             ))}
           </div>
           {pagination && (
             <div className="mt-6 pt-4 border-t border-theme">
               <Pagination
                 page={pagination.page}
                 limit={pagination.limit}
                 total={pagination.total}
                 totalPages={pagination.totalPages}
                 hasNext={pagination.hasNext}
                 hasPrev={pagination.hasPrev}
                 onPageChange={(newPage) => {
                   setPage(newPage);
                   window.scrollTo({ top: 0, behavior: 'smooth' });
                 }}
                 onLimitChange={(newLimit) => {
                   setLimit(newLimit);
                   setPage(1);
                 }}
               />
             </div>
           )}
       </div>}
     </DashboardLayout>
   );
 }

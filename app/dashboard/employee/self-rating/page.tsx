 'use client';
 
 import { useState, useEffect, useMemo } from 'react';
 import { useSession } from 'next-auth/react';
 import { useRouter } from 'next/navigation';
 import { motion } from 'framer-motion';
 import DashboardLayout from '@/app/components/layout/DashboardLayout';

 import StatsSection, { StatItem } from '@/app/components/shared/StatsSection';
 import PageToolbar, { FilterSelect } from '@/app/components/shared/PageToolbar';

 import { BsStarFill, BsClipboardData, BsCheckCircle, BsPercent } from 'react-icons/bs';
 import { GoalWithRating } from '@/app/components/shared/types';
 import { Pagination } from '@/app/components/shared/Pagination';
import RatingGoalCard from '@/app/components/shared/RatingGoalCard';

 
 export default function SelfRatingPage() {
   const { data: session, status } = useSession();
   const router = useRouter();
   const [goals, setGoals] = useState<GoalWithRating[]>([]);
   const [loading, setLoading] = useState(true);
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
       const params = new URLSearchParams({
         view: 'my-goals',
         page: page.toString(),
         limit: limit.toString(),
         sortBy: 'createdAt',
         sortOrder: 'desc',
         ...(selectedStatus && selectedStatus !== 'all' && { status: selectedStatus }),
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
     } finally {
       setLoading(false);
     }
   };
 
   const filteredGoals = useMemo(() => {
     return goals;
   }, [goals]);
 
   const statsItems: StatItem[] = useMemo(() => {
     const total = filteredGoals.length;
     const completed = filteredGoals.filter(g => g.status === 'COMPLETED').length;
     const rated = filteredGoals.filter(g => g.rating?.selfScore != null).length;
     const completionRate = total > 0 ? Math.round((completed / total) * 1000) / 10 : 0;
     return [
       {
         title: 'My Goals',
         value: total,
         icon: <BsClipboardData className="w-4 h-4" />,
       },
       {
         title: 'Completed',
         value: completed,
         icon: <BsCheckCircle className="w-4 h-4" />,
       },
       {
         title: 'Self Rated',
         value: rated,
         icon: <BsStarFill className="w-4 h-4" />,
       },
       {
         title: 'Completion Rate',
         value: `${completionRate}%`,
         icon: <BsPercent className="w-4 h-4" />,
       }
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
     } finally {
       setSubmittingMap(prev => ({ ...prev, [goalId]: false }));
     }
   };
 
   return (
     <DashboardLayout type="employee">
       <div className="relative max-w-7xl mx-auto space-y-6">
           {/* Floating Background Decorations */}
           <div className="absolute -top-16 -right-16 w-64 h-64 bg-[rgb(var(--color-warning))]/[0.03] rounded-full blur-3xl pointer-events-none" />
           <div className="absolute bottom-20 -left-12 w-48 h-48 bg-[rgb(var(--color-accent))]/[0.03] rounded-full blur-3xl pointer-events-none" />

           {/* Page Header with Star Decoration */}
           <motion.div
             initial={{ opacity: 0, y: -10 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.5 }}
             className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[rgb(var(--color-warning))]/10 via-[rgb(var(--color-rating-3))]/5 to-[rgb(var(--color-accent))]/10 border border-[rgba(var(--color-warning),0.15)] p-6 md:p-8"
           >
             <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[rgb(var(--color-warning))] via-[rgb(var(--color-rating-3))] to-[rgb(var(--color-accent))]" />
             <div className="absolute top-4 right-6 flex gap-1 opacity-[0.07]">
               <BsStarFill className="w-8 h-8 text-warning" />
               <BsStarFill className="w-6 h-6 text-warning mt-2" />
               <BsStarFill className="w-4 h-4 text-warning mt-4" />
             </div>
             <div className="relative flex items-center gap-4">
               <div className="p-3 bg-warning-muted rounded-xl">
                 <BsStarFill className="w-6 h-6 text-warning" />
               </div>
               <div>
                 <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[rgb(var(--color-warning))] to-[rgb(var(--color-accent))] bg-clip-text text-transparent">
                   Self Rating
                 </h1>
                 <p className="text-sm text-secondary mt-1">Rate your own progress and reflect on your achievements.</p>
               </div>
             </div>
             {/* Progress Summary Bar */}
             {(() => {
               const total = filteredGoals.length;
               const rated = filteredGoals.filter(g => g.rating?.selfScore != null).length;
               const pct = total > 0 ? Math.round((rated / total) * 100) : 0;
               return total > 0 ? (
                 <div className="mt-4 flex items-center gap-3">
                   <div className="flex-1 h-2 bg-surface-secondary rounded-full overflow-hidden">
                     <motion.div
                       initial={{ width: 0 }}
                       animate={{ width: `${pct}%` }}
                       transition={{ duration: 0.8, ease: 'easeOut' }}
                       className="h-full bg-gradient-to-r from-[rgb(var(--color-warning))] to-[rgb(var(--color-accent))] rounded-full"
                     />
                   </div>
                   <span className="text-xs font-semibold text-warning">{rated}/{total} rated</span>
                 </div>
               ) : null;
             })()}
           </motion.div>

           <div className="space-y-3">
             <StatsSection stats={statsItems} />
           </div>
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
                 viewMode="grid"
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
       </div>
     </DashboardLayout>
   );
 }

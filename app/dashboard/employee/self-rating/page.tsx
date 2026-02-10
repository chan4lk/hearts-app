 'use client';
 
 import { useState, useEffect, useMemo } from 'react';
 import { useSession } from 'next-auth/react';
 import { useRouter } from 'next/navigation';
 import { motion } from 'framer-motion';
 import DashboardLayout from '@/app/components/layout/DashboardLayout';
 import HeroSection from '@/app/components/shared/HeroSection';
 import StatsSection, { StatItem } from '@/app/components/shared/StatsSection';
 import Filters from '@/app/components/shared/Filters';
 import { HERO_GRADIENTS } from '@/app/components/shared/filterConfig';
 import { BsStarFill, BsClipboardData, BsCheckCircle, BsPercent } from 'react-icons/bs';
 import { GoalWithRating } from '@/app/components/shared/types';
 import { Pagination } from '@/app/components/shared/Pagination';
import RatingGoalCard from '@/app/components/shared/RatingGoalCard';
import BackgroundElements from '@/app/components/shared/BackgroundElements';
 
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
         gradient: 'from-indigo-500 to-purple-500',
         bgColor: 'bg-indigo-500/10',
         borderColor: 'border-indigo-500/30'
       },
       {
         title: 'Completed',
         value: completed,
         icon: <BsCheckCircle className="w-4 h-4" />,
         gradient: 'from-emerald-500 to-teal-500',
         bgColor: 'bg-emerald-500/10',
         borderColor: 'border-emerald-500/30'
       },
       {
         title: 'Self Rated',
         value: rated,
         icon: <BsStarFill className="w-4 h-4" />,
         gradient: 'from-amber-500 to-orange-500',
         bgColor: 'bg-amber-500/10',
         borderColor: 'border-amber-500/30'
       },
       {
         title: 'Completion Rate',
         value: `${completionRate}%`,
         icon: <BsPercent className="w-4 h-4" />,
         gradient: 'from-blue-500 to-cyan-500',
         bgColor: 'bg-blue-500/10',
         borderColor: 'border-blue-500/30'
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
       <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
         <BackgroundElements />
         <div className="relative z-10 p-4 space-y-4">
           <HeroSection
             title="Self Rating"
             subtitle="Rate your completed goals"
             gradient={HERO_GRADIENTS.EMPLOYEE}
           />
           <div className="space-y-3">
             <StatsSection stats={statsItems} variant="auto" />
           </div>
           <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-4 border border-white/20 dark:border-gray-700/50 space-y-4">
             <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
               <div className="relative flex-1 max-w-md w-full">
                 <input
                   type="text"
                   placeholder="Search goals..."
                   value={search}
                   onChange={(e) => {
                     setSearch(e.target.value);
                     setPage(1);
                   }}
                   className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all duration-200"
                 />
               </div>
               <Filters
                 selectedStatus={selectedStatus}
                 onStatusChange={(value: string) => {
                   setSelectedStatus(value);
                   setPage(1);
                 }}
                 selectedPriority={selectedPriority}
                 onPriorityChange={(value: string) => {
                   setSelectedPriority(value);
                   setPage(1);
                 }}
                 selectedCategory={selectedCategory}
                 onCategoryChange={(value: string) => {
                   setSelectedCategory(value);
                   setPage(1);
                 }}
                 onClear={() => {
                   setSelectedStatus('all');
                   setSelectedPriority('');
                   setSelectedCategory('all');
                   setSearch('');
                   setPage(1);
                 }}
               />
             </div>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
             <div className="mt-6 pt-4 border-t border-gray-700/50">
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
       </div>
     </DashboardLayout>
   );
 }

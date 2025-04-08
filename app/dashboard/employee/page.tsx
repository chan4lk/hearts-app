'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { 
  BsSearch, 
  BsListUl, 
  BsCalendar, 
  BsFlag, 
  BsX, 
  BsCheckCircle, 
  BsXCircle, 
  BsClock, 
  BsPlus,
  BsLightningCharge,
  BsStars,
  BsBarChart,
  BsTrophy,
  BsArrowUp,
  BsArrowDown,
  BsEye,
  BsThreeDotsVertical,
  BsChevronRight,
  BsFilter
} from 'react-icons/bs';

interface Goal {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedDate: string;
  managerComments?: string;
}

export default function EmployeeDashboard() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Load goals from the database
  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const response = await fetch('/api/goals/employee');
        if (!response.ok) {
          throw new Error('Failed to fetch goals');
        }
        const data = await response.json();
        console.log('Fetched goals:', data); // Debug log
        setGoals(data);
      } catch (error) {
        console.error('Error fetching goals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGoals();
  }, []);

  const filteredGoals = goals.filter(goal => {
    const matchesSearch = goal.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !selectedStatus || goal.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getGoalStats = () => {
    const total = goals.length;
    const approved = goals.filter(g => g.status === 'APPROVED').length;
    const pending = goals.filter(g => g.status === 'PENDING').length;
    const rejected = goals.filter(g => g.status === 'REJECTED').length;
    
    const approvalRate = total ? Math.round((approved / total) * 100) : 0;
    const pendingRate = total ? Math.round((pending / total) * 100) : 0;
    
    return { total, approved, pending, rejected, approvalRate, pendingRate };
  };

  if (loading) {
    return (
      <DashboardLayout type="employee">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Loading goals...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type="employee">
      <div className="space-y-6">
        {/* Dashboard Header */}
        <div className="bg-[#1E2028] p-6 rounded-xl shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <BsStars className="w-8 h-8 text-indigo-400" />
            <div>
              <h1 className="text-2xl font-bold text-white">My Goals Dashboard</h1>
              <p className="text-gray-400">Track and manage your performance goals</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {/* Total Goals */}
            <div className="bg-[#252832] rounded-xl p-4 border border-gray-800 hover:border-indigo-500/50 transition-all group">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Goals</p>
                  <h3 className="text-2xl font-bold text-white mt-1">{getGoalStats().total}</h3>
                </div>
                <div className="bg-indigo-500/10 p-2 rounded-lg group-hover:scale-110 transition-transform">
                  <BsBarChart className="w-6 h-6 text-indigo-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1 text-sm">
                <BsArrowUp className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Active</span>
                <span className="text-gray-400 ml-1">{getGoalStats().pending} in progress</span>
              </div>
            </div>

            {/* Approved Goals */}
            <div className="bg-[#252832] rounded-xl p-4 border border-gray-800 hover:border-emerald-500/50 transition-all group">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Approved Goals</p>
                  <h3 className="text-2xl font-bold text-white mt-1">{getGoalStats().approved}</h3>
                </div>
                <div className="bg-emerald-500/10 p-2 rounded-lg group-hover:scale-110 transition-transform">
                  <BsCheckCircle className="w-6 h-6 text-emerald-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1 text-sm">
                <span className="text-emerald-400">{getGoalStats().approvalRate}%</span>
                <span className="text-gray-400">approval rate</span>
              </div>
            </div>

            {/* Pending Goals */}
            <div className="bg-[#252832] rounded-xl p-4 border border-gray-800 hover:border-amber-500/50 transition-all group">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Pending Review</p>
                  <h3 className="text-2xl font-bold text-white mt-1">{getGoalStats().pending}</h3>
                </div>
                <div className="bg-amber-500/10 p-2 rounded-lg group-hover:scale-110 transition-transform">
                  <BsClock className="w-6 h-6 text-amber-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1 text-sm">
                <span className="text-amber-400">{getGoalStats().pendingRate}%</span>
                <span className="text-gray-400">awaiting approval</span>
              </div>
            </div>

            {/* Achievement Rate */}
            <div className="bg-[#252832] rounded-xl p-4 border border-gray-800 hover:border-purple-500/50 transition-all group">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Achievement Score</p>
                  <h3 className="text-2xl font-bold text-white mt-1">{getGoalStats().approvalRate}%</h3>
                </div>
                <div className="bg-purple-500/10 p-2 rounded-lg group-hover:scale-110 transition-transform">
                  <BsTrophy className="w-6 h-6 text-purple-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1 text-sm">
                <BsLightningCharge className="w-4 h-4 text-purple-400" />
                <span className="text-purple-400">Performance</span>
                <span className="text-gray-400 ml-1">score</span>
              </div>
            </div>
          </div>
        </div>

        {/* Goals Overview Section */}
        <div className="bg-[#1E2028] p-6 rounded-xl shadow-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              <BsListUl className="w-6 h-6 text-indigo-400" />
              <h2 className="text-xl font-semibold text-white">Goals Overview</h2>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative group flex-1 sm:flex-none">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <BsSearch className="text-gray-400 group-hover:text-indigo-400 transition-colors" />
                </div>
                <input
                  type="text"
                  placeholder="Search goals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64 pl-10 pr-4 py-2 bg-[#252832] text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent hover:bg-[#2d2f36] transition-colors"
                />
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <BsFilter className="text-gray-400 group-hover:text-indigo-400 transition-colors" />
                </div>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-[#252832] text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:bg-[#2d2f36] transition-colors appearance-none cursor-pointer w-full sm:w-auto"
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>


            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredGoals.length > 0 ? (
              filteredGoals.map((goal) => (
                <div
                  key={goal.id}
                  className="bg-[#252832] rounded-xl p-5 border border-gray-800 hover:border-indigo-500/50 transition-all group cursor-pointer"
                  onClick={() => {
                    setSelectedGoal(goal);
                    setShowDetailModal(true);
                  }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-medium text-white group-hover:text-indigo-400 transition-colors flex items-center gap-2">
                      {goal.title}
                      <BsChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all" />
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs flex items-center gap-2 ${
                      goal.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' :
                      goal.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-400' :
                      'bg-amber-500/10 text-amber-400'
                    }`}>
                      {goal.status === 'APPROVED' && <BsCheckCircle className="w-3 h-3" />}
                      {goal.status === 'REJECTED' && <BsXCircle className="w-3 h-3" />}
                      {goal.status === 'PENDING' && <BsClock className="w-3 h-3" />}
                      {goal.status.charAt(0) + goal.status.slice(1).toLowerCase()}
                    </span>
                  </div>

                  <p className="text-gray-400 text-sm mb-4 line-clamp-2 group-hover:text-gray-300 transition-colors">
                    {goal.description}
                  </p>

                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <div className="flex items-center gap-2 bg-[#1E2028] px-3 py-1.5 rounded-lg">
                      <BsCalendar className="w-4 h-4" />
                      <span>Due: {new Date(goal.dueDate).toLocaleDateString()}</span>
                    </div>
                    <button
                      className="flex items-center gap-2 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedGoal(goal);
                        setShowDetailModal(true);
                      }}
                    >
                      <BsEye className="w-4 h-4" />
                      <span>View Details</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full bg-[#252832] rounded-xl p-8 text-center border border-gray-800">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#1E2028] mb-4">
                  <BsFlag className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-medium text-white mb-2">No goals found</h3>
                <p className="text-gray-400 mb-6">
                  {selectedStatus 
                    ? `No goals with status "${selectedStatus.toLowerCase()}" found.`
                    : "You haven't created any goals yet."}
                </p>
                <button
                  onClick={() => router.push('/dashboard/goals/create')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-all group"
                >
                  <BsPlus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                  <span>Create your first goal</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Goal Detail Modal */}
        {showDetailModal && selectedGoal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-[#1E2028] rounded-xl p-6 w-full max-w-2xl mx-4 border border-gray-800 shadow-2xl">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className={`px-3 py-1 rounded-full text-xs inline-flex items-center gap-2 mb-3 ${
                    selectedGoal.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' :
                    selectedGoal.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-400' :
                    'bg-amber-500/10 text-amber-400'
                  }`}>
                    {selectedGoal.status === 'APPROVED' && <BsCheckCircle className="w-3 h-3" />}
                    {selectedGoal.status === 'REJECTED' && <BsXCircle className="w-3 h-3" />}
                    {selectedGoal.status === 'PENDING' && <BsClock className="w-3 h-3" />}
                    {selectedGoal.status.charAt(0) + selectedGoal.status.slice(1).toLowerCase()}
                  </span>
                  <h2 className="text-2xl font-bold text-white">{selectedGoal.title}</h2>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <BsX className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">Description</h3>
                  <p className="text-gray-400">{selectedGoal.description}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-[#252832] rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                      <BsCalendar className="w-4 h-4" />
                      <span className="text-sm font-medium">Due Date</span>
                    </div>
                    <p className="text-white">
                      {new Date(selectedGoal.dueDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>

                  <div className="bg-[#252832] rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                      <BsClock className="w-4 h-4" />
                      <span className="text-sm font-medium">Submitted Date</span>
                    </div>
                    <p className="text-white">
                      {new Date(selectedGoal.submittedDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                {selectedGoal.status === 'REJECTED' && selectedGoal.managerComments && (
                  <div className="bg-rose-500/10 rounded-lg p-4 border border-rose-500/20">
                    <h4 className="text-rose-400 font-medium mb-2 flex items-center gap-2">
                      <BsXCircle className="w-4 h-4" />
                      Manager Feedback
                    </h4>
                    <p className="text-gray-400">{selectedGoal.managerComments}</p>
                  </div>
                )}

                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
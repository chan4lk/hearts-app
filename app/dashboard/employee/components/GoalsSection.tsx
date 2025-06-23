import { BsListUl, BsSearch, BsFilter, BsShield, BsStars, BsFlag, BsPlus, BsPencil, BsTrash } from 'react-icons/bs';
import { useRouter } from 'next/navigation';
import { Goal } from './types';
import GoalCard from './GoalCard';
import { useState } from 'react';

interface GoalsSectionProps {
  goals: Goal[];
  searchQuery: string;
  selectedStatus: string;
  onSearchChange: (query: string) => void;
  onStatusChange: (status: string) => void;
  onGoalClick: (goal: Goal) => void;
  onEditGoal?: (goal: Goal) => void;
  onDeleteGoal?: (goalId: string) => void;
}

type ViewType = 'assigned' | 'created';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'MODIFIED', label: 'Modified' },
  { value: 'COMPLETED', label: 'Completed' }
];

export default function GoalsSection({
  goals,
  searchQuery,
  selectedStatus,
  onSearchChange,
  onStatusChange,
  onGoalClick,
  onEditGoal,
  onDeleteGoal,
}: GoalsSectionProps) {
  const router = useRouter();
  const [activeView, setActiveView] = useState<ViewType>('assigned');

  // Separate assigned and self-created goals
  const assignedGoals = goals.filter(goal => goal.manager && goal.manager.id !== goal.employee.id);
  const selfCreatedGoals = goals.filter(goal => !goal.manager || goal.manager.id === goal.employee.id);

  const currentGoals = activeView === 'assigned' ? assignedGoals : selfCreatedGoals;
  const filteredGoals = currentGoals.filter(goal => 
    (!selectedStatus || goal.status === selectedStatus) &&
    (goal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
     goal.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="relative bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-xl shadow-xl border border-white/10">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-indigo-500/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-purple-500/5 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
      </div>

      <div className="relative p-3 sm:p-4">
        {/* Header Section */}
        <div className="flex flex-col gap-4 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-500/10 p-2 rounded-lg backdrop-blur-sm">
                <BsListUl className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
              </div>
              <h2 className="text-base sm:text-lg font-semibold text-white/90">Goals Overview</h2>
            </div>

            {/* View Toggle Buttons */}
            <div className="flex gap-2 p-1 bg-gray-800 rounded-lg backdrop-blur-sm w-full sm:w-auto">
              <button
                onClick={() => setActiveView('assigned')}
                className={`flex items-center justify-center gap-2 px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm transition-all flex-1 sm:flex-initial ${
                  activeView === 'assigned'
                    ? 'bg-indigo-500 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <BsShield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Assigned Goals</span>
                <span className="xs:hidden">Assigned</span>
                <span className="bg-white/10 px-1.5 py-0.5 rounded text-xs ml-1">
                  {assignedGoals.length}
                </span>
              </button>
              <button
                onClick={() => setActiveView('created')}
                className={`flex items-center justify-center gap-2 px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm transition-all flex-1 sm:flex-initial ${
                  activeView === 'created'
                    ? 'bg-purple-500 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <BsStars className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">My Created Goals</span>
                <span className="xs:hidden">Created</span>
                <span className="bg-white/10 px-1.5 py-0.5 rounded text-xs ml-1">
                  {selfCreatedGoals.length}
                </span>
              </button>
            </div>
          </div>
          
          {/* Search and Filter Section */}
          <div className="flex flex-col xs:flex-row gap-2 sm:gap-3">
            <div className="relative group flex-1">
              <div className="absolute inset-y-0 left-0 pl-2.5 sm:pl-3 flex items-center pointer-events-none">
                <BsSearch className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 group-hover:text-indigo-400 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search goals..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 bg-gray-800 text-white/90 text-xs sm:text-sm rounded-lg border border-white/10 
                         focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent 
                         hover:bg-white/10 transition-colors placeholder-gray-400"
              />
            </div>

            <div className="relative group xs:w-32 sm:w-48">
              <div className="absolute inset-y-0 left-0 pl-2.5 sm:pl-3 flex items-center pointer-events-none">
                <BsFilter className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 group-hover:text-indigo-400 transition-colors" />
              </div>
              <select
                value={selectedStatus}
                onChange={(e) => onStatusChange(e.target.value)}
                className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 bg-gray-800 text-white/90 text-xs sm:text-sm rounded-lg 
                         border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 
                         hover:bg-white/10 transition-colors appearance-none cursor-pointer"
              >
                {STATUS_OPTIONS.map(option => (
                  <option key={option.value} value={option.value} className="bg-gray-800">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Goals Grid */}
        <div className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 gap-2 sm:gap-3">
            {filteredGoals.length > 0 ? (
              filteredGoals.map((goal) => (
                <div key={goal.id} className="relative group">
                  <GoalCard
                    goal={goal}
                    onClick={() => onGoalClick(goal)}
                  />
                  {/* Action Buttons */}
                  <div className="absolute top-2 sm:top-3 right-2 sm:right-3 flex items-center gap-1.5 sm:gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    {activeView === 'created' && onEditGoal && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditGoal(goal);
                        }}
                        className="p-1 sm:p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-colors"
                      >
                        <BsPencil className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </button>
                    )}
                    {activeView === 'created' && onDeleteGoal && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteGoal(goal.id);
                        }}
                        className="p-1 sm:p-1.5 bg-rose-500/10 text-rose-400 rounded-lg hover:bg-rose-500/20 transition-colors"
                      >
                        <BsTrash className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 sm:p-6 text-center border border-white/10">
                <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/5 mb-2 sm:mb-3">
                  <BsFlag className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                </div>
                <h3 className="text-sm sm:text-base font-medium text-white/90 mb-1.5 sm:mb-2">
                  {activeView === 'assigned' ? 'No assigned goals' : 'No self-created goals'}
                </h3>
                <p className="text-xs sm:text-sm text-gray-400 mb-3 sm:mb-4">
                  {activeView === 'assigned' 
                    ? "You don't have any goals assigned by your manager yet."
                    : "You haven't created any goals yet."}
                </p>
                {activeView === 'created' && (
                  <button
                    onClick={() => router.push('/dashboard/employee/goals/create')}
                    className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-500 text-white text-xs sm:text-sm rounded-lg 
                             hover:bg-indigo-400 transition-all group active:scale-[0.98]"
                  >
                    <BsPlus className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-90 transition-transform" />
                    <span>Create your first goal</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
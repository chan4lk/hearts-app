import { BsListUl, BsShield, BsStars, BsPlus } from 'react-icons/bs';
import { useRouter } from 'next/navigation';
import { Goal } from '@/app/components/shared/types';
import GoalsTable from '@/app/components/shared/GoalsTable';
import { useState } from 'react';

interface GoalsSectionProps {
  goals: Goal[];
  searchQuery: string;
  selectedStatus: string;
  onSearchChange: (query: string) => void;
  onStatusChange: (status: string) => void;
  onGoalClick: (goal: Goal) => void;
  onEditGoal?: (goal: Goal) => void;
  onDeleteGoal?: (goal: Goal) => void;
  onStatusUpdate?: (goalId: string, newStatus: string, updatedGoal: Goal) => void;
  userRole?: string;
}

type ViewType = 'assigned' | 'created';


export default function GoalsSection({
  goals,
  searchQuery,
  selectedStatus,
  onSearchChange,
  onStatusChange,
  onGoalClick,
  onEditGoal,
  onDeleteGoal,
  onStatusUpdate,
  userRole,
}: GoalsSectionProps) {
  const router = useRouter();
  const [activeView, setActiveView] = useState<ViewType>(userRole === 'ADMIN' ? 'created' : 'assigned');

  // Separate assigned and self-created goals
  const assignedGoals = goals.filter(goal => 
    goal.manager && 
    goal.employee && 
    goal.manager.id !== goal.employee.id
  );
  const selfCreatedGoals = goals.filter(goal => 
    goal.employee && 
    (!goal.manager || goal.manager.id === goal.employee.id)
  );

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

      <div className="relative p-4">
        {/* Header Section */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-500/10 p-2 rounded-lg backdrop-blur-sm">
                <BsListUl className="w-5 h-5 text-indigo-400" />
              </div>
              <h2 className="text-lg font-semibold text-white/90">Goals Overview</h2>
            </div>

            {/* View Toggle Buttons */}
            <div className="flex gap-2 p-1 bg-gray-800 rounded-lg backdrop-blur-sm">
              <button
                onClick={() => setActiveView('assigned')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all ${
                  activeView === 'assigned'
                    ? 'bg-indigo-500 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <BsShield className="w-4 h-4" />
                <span className="hidden sm:inline">My Assigned Goals</span>
                <span className="sm:hidden">Assigned</span>
                <span className="bg-white/10 px-1.5 py-0.5 rounded text-xs ml-1">
                  {assignedGoals.length}
                </span>
              </button>
              <button
                onClick={() => setActiveView('created')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all ${
                  activeView === 'created'
                    ? 'bg-purple-500 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <BsStars className="w-4 h-4" />
                <span className="hidden sm:inline">My Growth Plan</span>
                <span className="sm:hidden">Created</span>
                <span className="bg-white/10 px-1.5 py-0.5 rounded text-xs ml-1">
                  {selfCreatedGoals.length}
                </span>
              </button>
            </div>
          </div>
          
        </div>

        {/* Goals Table */}
        <div className="mt-6">
          <GoalsTable
            goals={filteredGoals}
            searchQuery={searchQuery}
            selectedStatus={selectedStatus}
            onSearchChange={onSearchChange}
            onStatusChange={onStatusChange}
            onGoalClick={onGoalClick}
            onEdit={activeView === 'created' ? onEditGoal : undefined}
            onDelete={activeView === 'created' ? onDeleteGoal : undefined}
            onStatusUpdate={onStatusUpdate}
            showActions={activeView === 'created'}
          />
        </div>
      </div>
    </div>
  );
} 
import { BsListUl, BsSearch, BsFilter, BsShield, BsStars, BsFlag, BsPlus } from 'react-icons/bs';
import { useRouter } from 'next/navigation';
import { Goal } from './types';
import GoalCard from './GoalCard';

interface GoalsSectionProps {
  goals: Goal[];
  searchQuery: string;
  selectedStatus: string;
  onSearchChange: (query: string) => void;
  onStatusChange: (status: string) => void;
  onGoalClick: (goal: Goal) => void;
}

export default function GoalsSection({
  goals,
  searchQuery,
  selectedStatus,
  onSearchChange,
  onStatusChange,
  onGoalClick,
}: GoalsSectionProps) {
  const router = useRouter();

  // Separate assigned and self-created goals
  const assignedGoals = goals.filter(goal => goal.manager && goal.manager.id !== goal.employee.id);
  const selfCreatedGoals = goals.filter(goal => !goal.manager || goal.manager.id === goal.employee.id);

  return (
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
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2 bg-[#252832] text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent hover:bg-[#2d2f36] transition-colors"
            />
          </div>

          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <BsFilter className="text-gray-400 group-hover:text-indigo-400 transition-colors" />
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => onStatusChange(e.target.value)}
              className="pl-10 pr-4 py-2 bg-[#252832] text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:bg-[#2d2f36] transition-colors appearance-none cursor-pointer w-full sm:w-auto"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="MODIFIED">Modified</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Assigned Goals Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <BsShield className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-medium text-white">Assigned Goals</h3>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {assignedGoals.length > 0 ? (
            assignedGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onClick={() => onGoalClick(goal)}
              />
            ))
          ) : (
            <div className="col-span-full bg-[#252832] rounded-xl p-8 text-center border border-gray-800">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#1E2028] mb-4">
                <BsFlag className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">No assigned goals</h3>
              <p className="text-gray-400">You don't have any goals assigned by your manager yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Self-Created Goals Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <BsStars className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-medium text-white">My Created Goals</h3>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {selfCreatedGoals.length > 0 ? (
            selfCreatedGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onClick={() => onGoalClick(goal)}
              />
            ))
          ) : (
            <div className="col-span-full bg-[#252832] rounded-xl p-8 text-center border border-gray-800">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#1E2028] mb-4">
                <BsFlag className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">No self-created goals</h3>
              <p className="text-gray-400 mb-6">You haven't created any goals yet.</p>
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
    </div>
  );
} 
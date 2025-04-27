import { Goal } from './types';
import { GoalCard } from './GoalCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BsListTask, BsCheckCircle, BsClock, BsXCircle } from 'react-icons/bs';

interface GoalManagementSectionProps {
  goals: Goal[];
  stats: {
    totalGoals: number;
    completedGoals: number;
    inProgressGoals: number;
    pendingGoals: number;
  };
  onView: (goal: Goal) => void;
  onEdit: (goal: Goal) => void;
  onDelete: (goalId: string) => void;
  onCreate: () => void;
}

export function GoalManagementSection({ 
  goals, 
  stats, 
  onView, 
  onEdit, 
  onDelete,
  onCreate 
}: GoalManagementSectionProps) {
  return (
    <div className="space-y-6">
     
      {/* Goals Grid - Responsive Layout */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl font-bold text-white">Goal Management</h2>
          
        </div>

        {goals.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 bg-[#1E2028] rounded-lg border border-gray-800 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
              <BsListTask className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Goals Found</h3>
            <p className="text-gray-400 mb-4 max-w-md">
              Start by creating a new goal to track progress and achievements.
            </p>
            <button
              onClick={onCreate}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Create New Goal
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 
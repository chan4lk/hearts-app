import { BsCheckCircle } from 'react-icons/bs';
import { Goal, EmployeeStats } from '@/app/components/shared/types';
import GoalCard from '@/app/components/shared/GoalCard';

interface GoalsGridProps {
  goals: Goal[];
  onGoalClick: (goal: Goal) => void;
  employees?: EmployeeStats[];
}

export default function GoalsGrid({ goals, onGoalClick, employees }: GoalsGridProps) {
  if (goals.length === 0) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700/50 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gray-700/50 mb-4">
          <BsCheckCircle className="w-6 h-6 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">No goals found</h3>
        <p className="text-gray-400 text-sm">
          There are no employee goals to review at this time.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {goals.map((goal) => (
        <GoalCard
          key={goal.id}
          goal={goal}
          onClick={() => onGoalClick(goal)}
          showActions={false}
          showEmployee={true}
        />
      ))}
    </div>
  );
}
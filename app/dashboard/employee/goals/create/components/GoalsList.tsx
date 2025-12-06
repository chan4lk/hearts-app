import { motion } from 'framer-motion';
import { BsListTask, BsArrowRepeat } from 'react-icons/bs';
import { Goal } from '@/app/components/shared/types';
import { useSession } from 'next-auth/react';
import GoalsTable from '@/app/components/shared/GoalsTable';

interface GoalsListProps {
  goals: Goal[];
  selectedStatus: string;
  selectedCategory: string;
  selectedPriority?: string;
  setSelectedStatus: (status: string) => void;
  setSelectedCategory: (category: string) => void;
  onViewGoal: (goal: Goal) => void;
  onRefresh: () => void;
  refreshing?: boolean;
}

export const GoalsList = ({
  goals,
  selectedStatus,
  selectedCategory,
  selectedPriority = '',
  setSelectedStatus,
  setSelectedCategory,
  onViewGoal,
  onRefresh,
  refreshing = false,
}: GoalsListProps) => {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  // Only show goals created by the current user
  const userCreatedGoals = goals.filter(goal => goal.createdBy?.id === userId);

  const filteredGoals = userCreatedGoals.filter(goal => {
    const matchesStatus = selectedStatus === 'all' || goal.status === selectedStatus;
    const matchesCategory = selectedCategory === 'all' || goal.category === selectedCategory;
    const matchesPriority = !selectedPriority || goal.priority === selectedPriority;
    return matchesStatus && matchesCategory && matchesPriority;
  });

  return (
    <div className="relative bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-xl shadow-sm">
      {/* Decorative Elements */}
      
      <div className="relative p-4">
        {/* Goals Table */}
        <div className="mt-6">
          <GoalsTable
            goals={filteredGoals}
            selectedStatus={selectedStatus === 'all' ? '' : selectedStatus}
            onStatusChange={(status) => setSelectedStatus(status === '' ? 'all' : status)}
            onGoalClick={onViewGoal}
            showActions={false}
          />
        </div>
      </div>
    </div>
  );
};

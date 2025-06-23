import { motion } from 'framer-motion';
import { BsCalendar, BsTag, BsGear, BsXCircle, BsCheckCircle, BsClock } from 'react-icons/bs';
import { Goal } from '../types';

interface GoalCardProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onDelete: (goalId: string) => void;
}

export const GoalCard = ({ goal, onEdit, onDelete }: GoalCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'text-green-500';
      case 'PENDING': return 'text-yellow-500';
      case 'REJECTED': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED': return <BsCheckCircle className="w-5 h-5" />;
      case 'PENDING': return <BsClock className="w-5 h-5" />;
      case 'REJECTED': return <BsXCircle className="w-5 h-5" />;
      default: return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
      whileHover={{ scale: 1.02 }}
      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 border border-white/20 dark:border-gray-700/50"
    >
      <div className="flex items-center justify-between mb-4">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(goal.status)} bg-opacity-20 flex items-center gap-2`}>
          {getStatusIcon(goal.status)}
          {goal.status}
        </span>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <BsCalendar className="w-3 h-3" />
            <span>{formatDate(goal.dueDate)}</span>
          </div>
          <div className="flex items-center gap-1">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onEdit(goal)}
              className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors rounded-lg hover:bg-blue-500/10"
              title="Edit Goal"
            >
              <BsGear className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onDelete(goal.id)}
              className="p-1.5 text-gray-400 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10"
              title="Delete Goal"
            >
              <BsXCircle className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </div>
      <h3 className="text-gray-900 dark:text-white font-medium mb-2">{goal.title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{goal.description}</p>
      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <BsTag className="w-3 h-3" />
        <span>{goal.category}</span>
      </div>
    </motion.div>
  );
}; 
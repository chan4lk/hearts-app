import { motion, AnimatePresence } from 'framer-motion';
import { BsCalendar, BsTag, BsXCircle, BsCheckCircle, BsClock } from 'react-icons/bs';
import { Goal } from '../../types';

interface GoalDetailsModalProps {
  goal: Goal | null;
  isOpen: boolean;
  onClose: () => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'APPROVED': return 'text-green-500 bg-green-500/10';
    case 'PENDING': return 'text-yellow-500 bg-yellow-500/10';
    case 'REJECTED': return 'text-red-500 bg-red-500/10';
    default: return 'text-gray-500 bg-gray-500/10';
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

export const GoalDetailsModal = ({ goal, isOpen, onClose }: GoalDetailsModalProps) => {
  if (!goal || !isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50" onClick={onClose}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-xl shadow-2xl"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getStatusColor(goal.status)}`}>
                    {getStatusIcon(goal.status)}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{goal.title}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(goal.status)}`}>
                        {goal.status}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs bg-purple-500/10 text-purple-500">
                        {goal.category}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <BsXCircle className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</h3>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                    <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{goal.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                      <BsCalendar className="w-4 h-4 text-gray-400" />
                      <span>Due Date</span>
                    </div>
                    <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                      {formatDate(goal.dueDate)}
                    </p>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                      <BsTag className="w-4 h-4 text-gray-400" />
                      <span>Category</span>
                    </div>
                    <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                      {goal.category}
                    </p>
                  </div>
                </div>

                {goal.progress !== undefined && (
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Progress</span>
                      <span className="text-xs font-semibold text-gray-900 dark:text-white">{goal.progress}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300"
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}; 
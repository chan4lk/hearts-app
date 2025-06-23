import { motion } from 'framer-motion';
import { BsBriefcase, BsEye, BsPencil, BsTrash, BsCalendar, BsPerson } from 'react-icons/bs';
import { Goal, User } from '../types';
import { EmployeeFilter } from './EmployeeFilter';

interface GoalListProps {
  goals: Goal[];
  assignedEmployees: User[];
  selectedEmployee: string;
  onEmployeeChange: (value: string) => void;
  onViewGoal: (goal: Goal) => void;
  onEditGoal: (goal: Goal) => void;
  onDeleteGoal: (goalId: string) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 }
};

export function GoalList({ 
  goals, 
  assignedEmployees, 
  selectedEmployee, 
  onEmployeeChange,
  onViewGoal,
  onEditGoal,
  onDeleteGoal
}: GoalListProps) {
  const filteredGoals = selectedEmployee === 'all' 
    ? goals 
    : goals.filter(goal => goal.employee?.id === selectedEmployee);

  return (
    <motion.div variants={itemVariants}>
      <div className="bg-gradient-to-b from-black/40 to-black/20 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="px-4 py-3 flex items-center justify-between gap-3 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 p-2 rounded-lg shadow-inner">
              <BsBriefcase className="w-4 h-4 text-indigo-300" />
            </div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              Goals
              <span className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 px-2 py-0.5 rounded-full text-xs">
                {filteredGoals.length}
              </span>
            </h3>
          </div>
          
          <EmployeeFilter
            selectedEmployee={selectedEmployee}
            onEmployeeChange={onEmployeeChange}
            assignedEmployees={assignedEmployees}
          />
        </div>

        {filteredGoals.length === 0 ? (
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10 mb-3 shadow-inner">
              <BsBriefcase className="w-6 h-6 text-indigo-300" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">No goals found</h3>
            <p className="text-sm text-white/70">
              {selectedEmployee !== 'all'
                ? "This employee has no assigned goals"
                : "Create your first goal to get started"}
            </p>
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            className="divide-y divide-white/10"
          >
            {filteredGoals.map((goal) => (
              <motion.div
                key={goal.id}
                variants={itemVariants}
                className="group relative hover:bg-white/5 transition-all duration-200"
              >
                <div className="px-4 py-3 flex items-center gap-4">
                  {/* Status Indicator */}
                  <div className={`w-1 h-8 rounded-full shadow-lg ${
                    goal.status === 'COMPLETED' ? 'bg-gradient-to-b from-emerald-400 to-emerald-500' :
                    goal.status === 'PENDING' ? 'bg-gradient-to-b from-amber-400 to-amber-500' :
                    goal.status === 'APPROVED' ? 'bg-gradient-to-b from-blue-400 to-blue-500' :
                    goal.status === 'REJECTED' ? 'bg-gradient-to-b from-red-400 to-red-500' :
                    'bg-gradient-to-b from-purple-400 to-purple-500'
                  }`} />

                  {/* Goal Title and Description */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="text-sm font-semibold text-white truncate">{goal.title}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        goal.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30' :
                        goal.status === 'PENDING' ? 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30' :
                        goal.status === 'APPROVED' ? 'bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/30' :
                        goal.status === 'REJECTED' ? 'bg-red-500/20 text-red-300 ring-1 ring-red-500/30' :
                        'bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/30'
                      }`}>
                        {goal.status}
                      </span>
                    </div>
                    <p className="text-sm text-white/70 truncate">{goal.description}</p>
                  </div>

                  {/* Meta Information */}
                  <div className="flex items-center gap-4 text-white/70">
                    <div className="flex items-center gap-2 bg-white/5 px-2 py-1 rounded-full">
                      <BsCalendar className="w-3.5 h-3.5" />
                      <span className="text-xs">{new Date(goal.dueDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 px-2 py-1 rounded-full">
                      <BsPerson className="w-3.5 h-3.5" />
                      <span className="text-xs">{goal.employee?.name}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 transform group-hover:translate-x-0 translate-x-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onViewGoal(goal)}
                      className="p-1.5 rounded-lg bg-gradient-to-r from-blue-500/10 to-blue-500/20 hover:from-blue-500/20 hover:to-blue-500/30 text-blue-300 ring-1 ring-blue-500/30 shadow-lg transition-all duration-200"
                    >
                      <BsEye className="w-3.5 h-3.5" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onEditGoal(goal)}
                      className="p-1.5 rounded-lg bg-gradient-to-r from-purple-500/10 to-purple-500/20 hover:from-purple-500/20 hover:to-purple-500/30 text-purple-300 ring-1 ring-purple-500/30 shadow-lg transition-all duration-200"
                    >
                      <BsPencil className="w-3.5 h-3.5" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onDeleteGoal(goal.id)}
                      className="p-1.5 rounded-lg bg-gradient-to-r from-red-500/10 to-red-500/20 hover:from-red-500/20 hover:to-red-500/30 text-red-300 ring-1 ring-red-500/30 shadow-lg transition-all duration-200"
                    >
                      <BsTrash className="w-3.5 h-3.5" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
} 
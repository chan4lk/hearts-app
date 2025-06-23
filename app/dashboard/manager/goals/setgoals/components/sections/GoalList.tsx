import { motion } from 'framer-motion';
import { BsBriefcase, BsThreeDotsVertical, BsEye, BsPencil, BsTrash, BsCalendar, BsPerson } from 'react-icons/bs';
import { colors } from '../styles/colors';
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
      <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden">
        <div className="p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500/10 p-2 rounded-lg">
              <BsBriefcase className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                Goal Management
                <span className="bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full text-xs font-medium">
                  {filteredGoals.length}
                </span>
              </h3>
            </div>
          </div>
          
          <EmployeeFilter
            selectedEmployee={selectedEmployee}
            onEmployeeChange={onEmployeeChange}
            assignedEmployees={assignedEmployees}
          />
        </div>

        {filteredGoals.length === 0 ? (
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/5 mb-3">
              <BsBriefcase className="w-6 h-6 text-white/40" />
            </div>
            <h3 className="text-lg font-medium text-white/90 mb-1">No goals found</h3>
            <p className="text-sm text-white/60">
              {selectedEmployee !== 'all'
                ? "This employee has no assigned goals"
                : "Create your first goal to get started"}
            </p>
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            className="divide-y divide-white/5"
          >
            {filteredGoals.map((goal) => (
              <motion.div
                key={goal.id}
                variants={itemVariants}
                className="group relative hover:bg-white/5 transition-colors"
              >
                <div className="p-4 flex items-center gap-4">
                  {/* Status Indicator */}
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    goal.status === 'COMPLETED' ? 'bg-emerald-400' :
                    goal.status === 'PENDING' ? 'bg-amber-400' :
                    goal.status === 'APPROVED' ? 'bg-blue-400' :
                    goal.status === 'REJECTED' ? 'bg-red-400' :
                    'bg-purple-400'
                  }`} />

                  {/* Goal Title and Description */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-white truncate">{goal.title}</h4>
                    <p className="text-xs text-white/60 truncate mt-0.5">{goal.description}</p>
                  </div>

                  {/* Meta Information */}
                  <div className="flex items-center gap-4 text-white/60">
                    <div className="flex items-center gap-1.5">
                      <BsCalendar className="w-3.5 h-3.5" />
                      <span className="text-xs">{new Date(goal.dueDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <BsPerson className="w-3.5 h-3.5" />
                      <span className="text-xs">{goal.employee?.name}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onViewGoal(goal)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-blue-500/20 text-white/60 hover:text-blue-400 transition-colors"
                    >
                      <BsEye className="w-3.5 h-3.5" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onEditGoal(goal)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-purple-500/20 text-white/60 hover:text-purple-400 transition-colors"
                    >
                      <BsPencil className="w-3.5 h-3.5" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onDeleteGoal(goal.id)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/60 hover:text-red-400 transition-colors"
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
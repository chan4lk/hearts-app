import { motion } from 'framer-motion';
import React from 'react';
import { 
  BsBriefcase, BsEye, BsPencil, BsTrash, BsCalendar, BsPerson, BsRocket, 
  BsLightbulb, BsAward, BsBook, BsGear, BsGraphUp, BsHeart, BsLaptop, BsCodeSlash
} from 'react-icons/bs';
import { IconType } from 'react-icons';
import { Goal, User } from '@/app/components/shared/types';
import { EmployeeFilter } from './EmployeeFilter';
import { CATEGORIES } from '@/app/components/shared/constants';

type GoalStatus = 'COMPLETED' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'DRAFT';

interface GoalListProps {
  goals: Goal[];
  assignedEmployees: User[];
  selectedEmployee: string;
  onEmployeeChange: (value: string) => void;
  onViewGoal: (goal: Goal) => void;
  onEditGoal: (goal: Goal) => void;
  onDeleteGoal: (goalId: string) => void;
}

interface StatusColorConfig {
  bg: string;
  text: string;
  border: string;
  icon: IconType;
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

const defaultStatusColor: StatusColorConfig = {
  bg: 'from-gray-500/10 to-gray-500/20',
  text: 'text-gray-300',
  border: 'border-gray-500/30',
  icon: BsLightbulb
};

const statusColors: Record<GoalStatus, StatusColorConfig> = {
  COMPLETED: {
    bg: 'from-emerald-500/10 to-emerald-500/20',
    text: 'text-emerald-300',
    border: 'border-emerald-500/30',
    icon: BsAward
  },
  PENDING: {
    bg: 'from-amber-500/10 to-amber-500/20',
    text: 'text-amber-300',
    border: 'border-amber-500/30',
    icon: BsRocket
  },
  APPROVED: {
    bg: 'from-blue-500/10 to-blue-500/20',
    text: 'text-blue-300',
    border: 'border-blue-500/30',
    icon: BsLightbulb
  },
  REJECTED: {
    bg: 'from-red-500/10 to-red-500/20',
    text: 'text-red-300',
    border: 'border-red-500/30',
    icon: BsTrash
  },
  DRAFT: {
    bg: 'from-purple-500/10 to-purple-500/20',
    text: 'text-purple-300',
    border: 'border-purple-500/30',
    icon: BsPencil
  }
};

const getCategoryConfig = (category: string) => {
  const categoryConfig = CATEGORIES.find(c => c.value === category);
  if (!categoryConfig) return CATEGORIES[0];
  return categoryConfig;
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
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="px-6 py-4 flex items-center justify-between gap-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 p-2.5 rounded-xl shadow-inner">
              <BsBriefcase className="w-5 h-5 text-indigo-300" />
            </div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              Goals
              <span className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full text-sm">
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
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 mb-4 shadow-inner">
              <BsBriefcase className="w-8 h-8 text-indigo-300" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No goals found</h3>
            <p className="text-base text-white/70">
              {selectedEmployee !== 'all'
                ? "This employee has no assigned goals"
                : "Create your first goal to get started"}
            </p>
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4"
          >
            {filteredGoals.map((goal) => {
              const status = (goal.status || 'PENDING') as GoalStatus;
              const statusColor = statusColors[status] || defaultStatusColor;
              const categoryConfig = getCategoryConfig(goal.category);
              const Icon = categoryConfig.icon;

              return (
                <motion.button
                  key={goal.id}
                  variants={itemVariants}
                  className="group relative overflow-hidden w-full text-left h-[200px]"
                  onClick={() => onViewGoal(goal)}
                >
                  <div className={`relative h-full p-4 rounded-xl backdrop-blur-xl border border-white/10 transition-all duration-300
                    ${categoryConfig.bgColor} ${categoryConfig.bgGradient}
                    hover:shadow-2xl hover:shadow-purple-500/10`}
                  >
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl transform translate-x-16 -translate-y-16" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-3xl transform -translate-x-16 translate-y-16" />
                    
                    <div className="relative h-full flex flex-col">
                      {/* Header */}
                      <div className="flex items-start gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${categoryConfig.iconColor} bg-opacity-20 backdrop-blur-xl
                          ring-1 ring-white/20 shadow-lg transform transition-transform duration-300
                          group-hover:scale-110 group-hover:rotate-[10deg] flex-shrink-0`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-semibold text-white group-hover:text-transparent 
                            group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400
                            transition-all duration-300 truncate">{goal.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-400 truncate">
                              {goal.employee?.name}
                            </span>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${statusColor.bg} ${statusColor.text} flex items-center gap-1 flex-shrink-0`}>
                          <statusColor.icon className="w-3 h-3" />
                          <span>{status.charAt(0) + status.slice(1).toLowerCase()}</span>
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-gray-400 text-sm leading-relaxed line-clamp-2 mb-auto">{goal.description}</p>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-2 border-t border-white/10 mt-2">
                        <div className="flex items-center gap-4 text-xs">
                          <div className="flex items-center gap-1.5 text-gray-400">
                            <span>Due: {goal.dueDate ? new Date(goal.dueDate).toLocaleDateString() : 'N/A'}</span>
                          </div>
                          {goal.createdAt && (
                            <div className="flex items-center gap-1.5 text-gray-400">
                              <span>Created: {new Date(goal.createdAt).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Hover Effects */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500
                      bg-gradient-to-t from-purple-950/30 via-transparent to-transparent" />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500
                      bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)]" />
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
} 
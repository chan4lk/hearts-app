import { motion } from 'framer-motion';
import React from 'react';
import { 
  BsBriefcase, BsEye, BsPencil, BsTrash, BsCalendar, BsPerson, BsRocket, 
  BsLightbulb, BsAward, BsBook, BsGear, BsGraphUp, BsHeart, BsLaptop, BsCodeSlash
} from 'react-icons/bs';
import { IconType } from 'react-icons';
import { Goal, User } from '../types';
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
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6"
          >
            {filteredGoals.map((goal) => {
              const status = (goal.status || 'PENDING') as GoalStatus;
              const statusColor = statusColors[status] || defaultStatusColor;
              const StatusIcon = statusColor.icon;
              const categoryConfig = getCategoryConfig(goal.category);

              return (
                <motion.div
                  key={goal.id}
                  variants={itemVariants}
                  className="group relative overflow-hidden cursor-pointer"
                  onClick={() => onViewGoal(goal)}
                >
                  <div className={`relative p-6 rounded-2xl backdrop-blur-xl border border-white/10 
                    ${categoryConfig.bgColor} transition-all duration-300 hover:shadow-2xl 
                    hover:shadow-purple-500/10 h-full`}
                  >
                    {/* Decorative Elements */}
                    <div className={`absolute top-0 right-0 w-full h-full bg-gradient-to-br ${categoryConfig.bgGradient} opacity-20`} />
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl transform translate-x-16 -translate-y-16" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-3xl transform -translate-x-16 translate-y-16" />

                    <div className="relative space-y-4">
                      {/* Header */}
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl bg-gradient-to-r ${categoryConfig.bgGradient}
                          ring-1 ring-white/20 shadow-lg transform transition-transform duration-300
                          group-hover:scale-110 group-hover:rotate-[10deg] ${categoryConfig.bgColor}`}>
                          {React.createElement(categoryConfig.icon, { className: `w-6 h-6 ${categoryConfig.iconColor}` })}
                        </div>
                        <div>
                          <h3 className={`text-lg font-semibold text-white group-hover:text-transparent 
                            group-hover:bg-clip-text group-hover:bg-gradient-to-r 
                            ${status === 'REJECTED' ? 'group-hover:text-red-400' : 'group-hover:text-white'}
                            transition-all duration-300`}>{goal.title}</h3>
                          <p className="text-sm text-gray-300/90">{goal.employee?.name}</p>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-gray-300/80 text-sm leading-relaxed">{goal.description}</p>

                      {/* Meta Information */}
                      <div className="flex items-center gap-3 text-sm text-white/70">
                        <div className="flex items-center gap-2 bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                          <BsCalendar className="w-4 h-4" />
                          <span>{new Date(goal.dueDate).toLocaleDateString()}</span>
                        </div>
                        <span className={`px-3 py-1.5 rounded-full text-sm font-medium 
                          bg-gradient-to-r ${statusColor.bg} ${statusColor.text} backdrop-blur-sm`}>
                          {goal.status}
                        </span>
                      </div>
                    </div>

                    {/* Hover Effects */}
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500
                      bg-gradient-to-t ${categoryConfig.bgGradient}`} />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500
                      bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)]" />
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
} 
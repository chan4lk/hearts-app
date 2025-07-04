'use client';

import { motion } from 'framer-motion';
import { 
  BsPeople, BsFilter, BsEye, BsPencilSquare, BsTrash, 
  BsLightbulb, BsRocket, BsAward, BsBook, BsGear, BsCalendar 
} from 'react-icons/bs';
import { Goal, User } from '@/app/components/shared/types';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/app/components/ui/select';
import { CATEGORIES } from '@/app/components/shared/constants';

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
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

interface GoalManagementSectionProps {
  goals: Goal[];
  stats: {
    totalGoals: number;
    completedGoals: number;
    inProgressGoals: number;
    pendingGoals: number;
  };
  selectedEmployee: string;
  selectedStatus: string;
  onEmployeeChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  users: User[];
  onView: (goal: Goal) => void;
  onEdit: (goal: Goal) => void;
  onDelete: (goalId: string) => void;
  onCreate: () => void;
}

const getCategoryConfig = (category: string) => {
  const categoryConfig = CATEGORIES.find(c => c.value === category);
  if (!categoryConfig) return CATEGORIES[0];
  return categoryConfig;
};

const statusColors: Record<string, { bg: string; text: string; icon: any }> = {
  COMPLETED: { bg: 'from-emerald-500/10 to-emerald-500/20', text: 'text-emerald-400', icon: BsAward },
  PENDING: { bg: 'from-amber-500/10 to-amber-500/20', text: 'text-amber-400', icon: BsRocket },
  APPROVED: { bg: 'from-blue-500/10 to-blue-500/20', text: 'text-blue-400', icon: BsLightbulb },
  REJECTED: { bg: 'from-red-500/10 to-red-500/20', text: 'text-red-400', icon: BsTrash },
  DRAFT: { bg: 'from-purple-500/10 to-purple-500/20', text: 'text-purple-400', icon: BsPencilSquare }
};

export function GoalManagementSection({
  goals,
  stats,
  selectedEmployee,
  selectedStatus,
  onEmployeeChange,
  onStatusChange,
  users,
  onView,
  onEdit,
  onDelete,
  onCreate
}: GoalManagementSectionProps) {
  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
            Goal Management
            <span className="bg-blue-500/10 px-2 py-0.5 rounded-md text-blue-600 dark:text-blue-400 text-xs font-normal">
              {goals.length}
            </span>
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={selectedEmployee}
            onValueChange={onEmployeeChange}
          >
            <SelectTrigger className="w-[180px] h-9 text-xs bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-white/20 dark:border-gray-600/50 focus:ring-2 focus:ring-blue-500/30 text-gray-900 dark:text-white rounded-lg transition-all duration-200">
              <SelectValue>
                <div className="flex items-center gap-2">
                  {selectedEmployee === 'all' ? (
                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/10">
                      <BsPeople className="h-3 w-3 text-blue-500" />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white text-xs font-medium">
                      {users.find(u => u.id === selectedEmployee)?.name.charAt(0)}
                    </div>
                  )}
                  <span className="truncate max-w-[120px]">
                    {selectedEmployee === 'all' ? 'All Users' : users.find(u => u.id === selectedEmployee)?.name}
                  </span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 rounded-lg shadow-lg">
              <SelectItem value="all" className="text-xs focus:bg-gray-100 dark:focus:bg-gray-700 rounded-md">
                <div className="flex items-center gap-2 py-1">
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/10">
                    <BsPeople className="h-3 w-3 text-blue-500" />
                  </div>
                  <span>All Users</span>
                </div>
              </SelectItem>
              <div className="my-1 h-px bg-gray-200 dark:bg-gray-700" />
              {users
                .filter(user => user.role !== 'ADMIN')
                .map((user) => (
                  <SelectItem 
                    key={user.id} 
                    value={user.id}
                    className="text-xs focus:bg-gray-100 dark:focus:bg-gray-700 rounded-md"
                  >
                    <div className="flex items-center justify-between gap-2 py-1 w-full">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white text-xs font-medium">
                          {user.name.charAt(0)}
                        </div>
                        <span className="truncate">{user.name}</span>
                      </div>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/50 px-1.5 py-0.5 rounded-full">
                        {user.role}
                      </span>
                    </div>
                  </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedStatus}
            onValueChange={onStatusChange}
          >
            <SelectTrigger className="relative w-[140px] h-8 text-xs bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-white/20 dark:border-gray-600/50 focus:ring-1 focus:ring-blue-500/50 text-gray-900 dark:text-white">
              <SelectValue>
                <div className="flex items-center gap-1.5">
                  <BsFilter className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                  <span>{selectedStatus === 'all' ? 'All Statuses' : selectedStatus}</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent 
              position="popper"
              sideOffset={4}
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 min-w-[140px] shadow-lg"
            >
              <SelectItem value="all" className="text-xs focus:bg-gray-100 dark:focus:bg-gray-700">
                <div className="flex items-center gap-1.5">
                  <BsFilter className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                  <span>All Statuses</span>
                </div>
              </SelectItem>
              <SelectItem value="DRAFT" className="text-xs focus:bg-gray-100 dark:focus:bg-gray-700">
                <span>Draft</span>
              </SelectItem>
              <SelectItem value="PENDING" className="text-xs focus:bg-gray-100 dark:focus:bg-gray-700">
                <span>Pending</span>
              </SelectItem>
              <SelectItem value="APPROVED" className="text-xs focus:bg-gray-100 dark:focus:bg-gray-700">
                <span>Approved</span>
              </SelectItem>
              <SelectItem value="COMPLETED" className="text-xs focus:bg-gray-100 dark:focus:bg-gray-700">
                <span>Completed</span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Goals Grid */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {goals.map(goal => {
          const categoryConfig = getCategoryConfig(goal.category);
          const status = goal.status || 'PENDING';
          const statusColor = statusColors[status];
          
          return (
            <motion.div
              key={goal.id}
              variants={itemVariants}
              className="group relative overflow-hidden"
            >
              <div 
                className={`relative h-[200px] p-4 rounded-xl backdrop-blur-xl border border-white/10 transition-all duration-300
                  ${categoryConfig.bgColor} ${categoryConfig.bgGradient}
                  hover:shadow-2xl hover:shadow-purple-500/10 cursor-pointer`}
                onClick={() => onView(goal)}
              >
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl transform translate-x-16 -translate-y-16" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-3xl transform -translate-x-16 translate-y-16" />
                
                <div className="relative h-full flex flex-col">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="flex flex-col items-center gap-1">
                        <div className={`p-2 rounded-lg ${categoryConfig.iconColor} bg-opacity-20 backdrop-blur-xl
                          ring-1 ring-white/20 shadow-lg transform transition-transform duration-300
                          group-hover:scale-110 group-hover:rotate-[10deg]`}>
                          <categoryConfig.icon className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] text-gray-400 font-medium">
                          {categoryConfig.label}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-semibold text-white group-hover:text-transparent 
                          group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400
                          transition-all duration-300 truncate mb-2">
                          {goal.title}
                        </h3>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 truncate flex items-center gap-1">
                              <BsPeople className="w-3 h-3" />
                              {users.find(u => u.id === goal.employee?.id)?.name}
                            </span>
                          </div>
                          {goal.dueDate && (
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <BsCalendar className="w-3 h-3" />
                              <span>Due: {new Date(goal.dueDate).toLocaleDateString()}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${statusColor.bg} ${statusColor.text} flex items-center gap-1`}>
                      <statusColor.icon className="w-3 h-3" />
                      <span>{status.charAt(0) + status.slice(1).toLowerCase()}</span>
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-gray-400 text-sm leading-relaxed line-clamp-2 mb-auto mt-2">
                    {goal.description}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/10 mt-2">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      {/* Empty footer - keeping for visual structure */}
                    </div>
                  </div>
                </div>

                {/* Hover Effects */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500
                  bg-gradient-to-t from-purple-950/30 via-transparent to-transparent" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500
                  bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)]" />
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
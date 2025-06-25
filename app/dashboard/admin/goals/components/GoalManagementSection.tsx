'use client';

import { motion } from 'framer-motion';
import { BsPeople, BsFilter, BsEye, BsPencilSquare, BsTrash, BsThreeDotsVertical } from 'react-icons/bs';
import { Goal, User } from '../types';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select';

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
      <div className="flex items-center justify-between mb-3">
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

      {/* Goals List */}
      <div className="space-y-2">
        {goals.map(goal => (
          <motion.div
            key={goal.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-200 border border-white/10 dark:border-gray-700/30"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">{goal.title}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{goal.description}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onView(goal)}
                  className="flex items-center gap-1 px-2 py-1 text-xs rounded-md text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                >
                  <BsEye className="h-3.5 w-3.5" />
                  View
                </button>
                <button
                  onClick={() => onEdit(goal)}
                  className="flex items-center gap-1 px-2 py-1 text-xs rounded-md text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                >
                  <BsPencilSquare className="h-3.5 w-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => onDelete(goal.id)}
                  className="flex items-center gap-1 px-2 py-1 text-xs rounded-md text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <BsTrash className="h-3.5 w-3.5" />
                  Delete
                </button>
                <button
                  className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-md transition-colors"
                >
                  <BsThreeDotsVertical className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
} 
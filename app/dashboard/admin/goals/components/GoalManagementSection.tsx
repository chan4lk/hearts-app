'use client';

import { motion } from 'framer-motion';
import { BsPeople, BsFilter } from 'react-icons/bs';
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
    <div>
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
            <SelectTrigger className="w-[140px] h-8 text-xs bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-white/20 dark:border-gray-600/50 focus:ring-1 focus:ring-blue-500/50 text-gray-900 dark:text-white">
              <SelectValue>
                <div className="flex items-center gap-1.5">
                  <BsPeople className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                  <span>{selectedEmployee === 'all' ? 'All Users' : users.find(u => u.id === selectedEmployee)?.name}</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-white/20 dark:border-gray-700/50">
              <SelectItem value="all" className="text-xs focus:bg-gray-100 dark:focus:bg-gray-700">
                <div className="flex items-center gap-1.5">
                  <BsPeople className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                  <span>All Users</span>
                </div>
              </SelectItem>
              {users
                .filter(user => user.role !== 'ADMIN')
                .map((user) => (
                  <SelectItem 
                    key={user.id} 
                    value={user.id}
                    className="text-xs focus:bg-gray-100 dark:focus:bg-gray-700"
                  >
                    <div className="flex items-center gap-1.5">
                      <BsPeople className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                      <span>{user.name}</span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">({user.role})</span>
                    </div>
                  </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedStatus}
            onValueChange={onStatusChange}
          >
            <SelectTrigger className="w-[140px] h-8 text-xs bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm border border-white/20 dark:border-gray-600/50 focus:ring-1 focus:ring-blue-500/50 text-gray-900 dark:text-white">
              <SelectValue>
                <div className="flex items-center gap-1.5">
                  <BsFilter className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                  <span>{selectedStatus === 'all' ? 'All Statuses' : selectedStatus}</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-white/20 dark:border-gray-700/50">
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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onView(goal)}
                  className="text-xs text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                >
                  View
                </button>
                <button
                  onClick={() => onEdit(goal)}
                  className="text-xs text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(goal.id)}
                  className="text-xs text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                >
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
} 
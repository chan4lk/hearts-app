'use client';

import { User } from '../types';
import { Role } from '@prisma/client';
import { BsX, BsPencil, BsEnvelope, BsPerson, BsShield, BsCheckCircle, BsXCircle, BsCalendar, BsPeople } from 'react-icons/bs';
import { motion } from 'framer-motion';

interface UserDetailsProps {
  user: User;
  onClose: () => void;
  onEdit: () => void;
}

// Create a mapping for display names
const ROLE_DISPLAY_NAMES: Record<Role, string> = {
  [Role.ADMIN]: 'Admin',
  [Role.MANAGER]: 'Manager',
  [Role.EMPLOYEE]: 'Employee'
};

export default function UserDetails({ user, onClose, onEdit }: UserDetailsProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="relative w-full max-w-[240px] sm:max-w-[600px]"
    >
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative">
        {/* Header */}
        <div className="flex justify-between items-center p-1.5 sm:px-4 sm:py-3 border-b border-gray-700/30 bg-gray-800/30">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-0.5 sm:p-1.5 bg-indigo-500/20 rounded">
              <BsPerson className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xs sm:text-base font-medium text-gray-100">{user.name}</h2>
              <p className="text-[10px] sm:text-sm text-gray-400">{ROLE_DISPLAY_NAMES[user.role as Role]}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="text-gray-400 hover:text-gray-300 p-0.5 sm:p-1.5 hover:bg-gray-500/10 rounded transition-colors"
              title="Close"
            >
              <BsX className="w-3 h-3 sm:w-5 sm:h-5" />
            </motion.button>
          </div>
        </div>

        {/* Content */}
        <div className="p-1.5 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-3">
            <div className="space-y-1.5 sm:space-y-3">
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-1.5 sm:gap-3 p-1.5 sm:p-3 bg-gray-800/40 rounded hover:bg-gray-800/50 transition-colors group"
              >
                <BsEnvelope className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-purple-400 group-hover:text-purple-300 transition-colors" />
                <div>
                  <p className="text-[10px] sm:text-xs font-medium text-gray-400 group-hover:text-gray-300">Email</p>
                  <p className="text-[11px] sm:text-sm text-gray-200">{user.email}</p>
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-1.5 sm:gap-3 p-1.5 sm:p-3 bg-gray-800/40 rounded hover:bg-gray-800/50 transition-colors group"
              >
                <BsShield className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-amber-400 group-hover:text-amber-300 transition-colors" />
                <div>
                  <p className="text-[10px] sm:text-xs font-medium text-gray-400 group-hover:text-gray-300">Role & Permissions</p>
                  <p className="text-[11px] sm:text-sm text-gray-200">{ROLE_DISPLAY_NAMES[user.role as Role]}</p>
                  <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1">
                    {user.role === Role.ADMIN && "Full system access"}
                    {user.role === Role.MANAGER && "Can manage team members and approve goals"}
                    {user.role === Role.EMPLOYEE && "Can set and track personal goals"}
                  </p>
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-1.5 sm:gap-3 p-1.5 sm:p-3 bg-gray-800/40 rounded hover:bg-gray-800/50 transition-colors group"
              >
                {user.status === 'ACTIVE' ? (
                  <BsCheckCircle className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
                ) : (
                  <BsXCircle className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-rose-400 group-hover:text-rose-300 transition-colors" />
                )}
                <div>
                  <p className="text-[10px] sm:text-xs font-medium text-gray-400 group-hover:text-gray-300">Account Status</p>
                  <p className={`text-[11px] sm:text-sm ${
                    user.status === 'ACTIVE' ? 'text-emerald-400 group-hover:text-emerald-300' : 'text-rose-400 group-hover:text-rose-300'
                  }`}>
                    {user.status}
                  </p>
                </div>
              </motion.div>
            </div>

            <div className="space-y-1.5 sm:space-y-3">
              {/* Manager Information */}
              {user.role !== Role.ADMIN && (
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-1.5 sm:gap-3 p-1.5 sm:p-3 bg-gray-800/40 rounded hover:bg-gray-800/50 transition-colors group"
                >
                  <BsPerson className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-blue-400 group-hover:text-blue-300 transition-colors" />
                  <div>
                    <p className="text-[10px] sm:text-xs font-medium text-gray-400 group-hover:text-gray-300">Reports To</p>
                    {user.manager ? (
                      <>
                        <p className="text-[11px] sm:text-sm text-gray-200">{user.manager.name}</p>
                        <p className="text-[10px] sm:text-xs text-gray-400">{user.manager.email}</p>
                      </>
                    ) : (
                      <p className="text-[11px] sm:text-sm text-gray-400">No manager assigned</p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Team Size - Only show for managers */}
              {user.role === Role.MANAGER && (
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-1.5 sm:gap-3 p-1.5 sm:p-3 bg-gray-800/40 rounded hover:bg-gray-800/50 transition-colors group"
                >
                  <BsPeople className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-green-400 group-hover:text-green-300 transition-colors" />
                  <div>
                    <p className="text-[10px] sm:text-xs font-medium text-gray-400 group-hover:text-gray-300">Team Size</p>
                    <p className="text-[11px] sm:text-sm text-gray-200">
                      {user.employees?.length || 0} team members
                    </p>
                  </div>
                </motion.div>
              )}

              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-1.5 sm:gap-3 p-1.5 sm:p-3 bg-gray-800/40 rounded hover:bg-gray-800/50 transition-colors group"
              >
                <BsCalendar className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-gray-400 group-hover:text-gray-300 transition-colors" />
                <div>
                  <p className="text-[10px] sm:text-xs font-medium text-gray-400 group-hover:text-gray-300">Account Details</p>
                  <p className="text-[11px] sm:text-sm text-gray-200">
                    Created: {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                  {user.lastLogin && (
                    <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1">
                      Last login: {new Date(user.lastLogin).toLocaleString()}
                    </p>
                  )}
                </div>
              </motion.div>
            </div>
          </div>

          <div className="flex justify-end gap-1 sm:gap-2 pt-1.5 sm:pt-3 border-t border-gray-700/30 mt-2 sm:mt-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="px-1.5 sm:px-3 py-0.5 sm:py-1.5 text-[10px] sm:text-sm font-medium text-gray-300 bg-gray-800/70 rounded hover:bg-gray-800/90 transition-colors"
            >
              Close
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onEdit}
              className="px-1.5 sm:px-3 py-0.5 sm:py-1.5 text-[10px] sm:text-sm font-medium text-white bg-indigo-500/80 rounded hover:bg-indigo-500 transition-colors flex items-center gap-0.5 sm:gap-1"
            >
              <BsPencil className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
              Edit
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
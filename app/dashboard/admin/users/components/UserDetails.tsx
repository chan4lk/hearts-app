'use client';

import { User } from '../types';
import { BsX, BsPencil, BsEnvelope, BsPerson, BsShield, BsCheckCircle, BsXCircle, BsCalendar } from 'react-icons/bs';
import { motion } from 'framer-motion';

interface UserDetailsProps {
  user: User;
  onClose: () => void;
  onEdit: () => void;
}

export default function UserDetails({ user, onClose, onEdit }: UserDetailsProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="relative "
    >
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative">
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-700/30 bg-gray-800/30">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-indigo-500/20 rounded-lg">
              <BsPerson className="w-4 h-4 text-indigo-400" />
            </div>
            <h2 className="text-base font-medium text-gray-100">{user.name}</h2>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onEdit}
              className="text-blue-400 hover:text-blue-300 p-1.5 hover:bg-blue-500/10 rounded-lg transition-colors"
              title="Edit user"
            >
              <BsPencil className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="text-gray-400 hover:text-gray-300 p-1.5 hover:bg-gray-500/10 rounded-lg transition-colors"
              title="Close"
            >
              <BsX className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-3">
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-3 p-3 bg-gray-800/40 rounded-lg hover:bg-gray-800/50 transition-colors group"
              >
                <BsEnvelope className="w-4 h-4 text-purple-400 group-hover:text-purple-300 transition-colors" />
                <div>
                  <p className="text-xs font-medium text-gray-400 group-hover:text-gray-300">Email</p>
                  <p className="text-sm text-gray-200">{user.email}</p>
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-3 p-3 bg-gray-800/40 rounded-lg hover:bg-gray-800/50 transition-colors group"
              >
                <BsShield className="w-4 h-4 text-amber-400 group-hover:text-amber-300 transition-colors" />
                <div>
                  <p className="text-xs font-medium text-gray-400 group-hover:text-gray-300">Role</p>
                  <p className="text-sm text-gray-200">{user.role}</p>
                </div>
              </motion.div>

              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-3 p-3 bg-gray-800/40 rounded-lg hover:bg-gray-800/50 transition-colors group"
              >
                {user.status === 'ACTIVE' ? (
                  <BsCheckCircle className="w-4 h-4 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
                ) : (
                  <BsXCircle className="w-4 h-4 text-rose-400 group-hover:text-rose-300 transition-colors" />
                )}
                <div>
                  <p className="text-xs font-medium text-gray-400 group-hover:text-gray-300">Status</p>
                  <p className={`text-sm ${
                    user.status === 'ACTIVE' ? 'text-emerald-400 group-hover:text-emerald-300' : 'text-rose-400 group-hover:text-rose-300'
                  }`}>
                    {user.status}
                  </p>
                </div>
              </motion.div>
            </div>

            <div className="space-y-3">
              {user.manager && (
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-3 p-3 bg-gray-800/40 rounded-lg hover:bg-gray-800/50 transition-colors group"
                >
                  <BsPerson className="w-4 h-4 text-blue-400 group-hover:text-blue-300 transition-colors" />
                  <div>
                    <p className="text-xs font-medium text-gray-400 group-hover:text-gray-300">Manager</p>
                    <p className="text-sm text-gray-200">{user.manager.name}</p>
                  </div>
                </motion.div>
              )}

              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-3 p-3 bg-gray-800/40 rounded-lg hover:bg-gray-800/50 transition-colors group"
              >
                <BsCalendar className="w-4 h-4 text-gray-400 group-hover:text-gray-300 transition-colors" />
                <div>
                  <p className="text-xs font-medium text-gray-400 group-hover:text-gray-300">Created</p>
                  <p className="text-sm text-gray-200">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </motion.div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-700/30 mt-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="px-3 py-1.5 text-sm font-medium text-gray-300 bg-gray-800/70 rounded-lg hover:bg-gray-800/90 transition-colors"
            >
              Close
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onEdit}
              className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-500/80 rounded-lg hover:bg-indigo-500 transition-colors flex items-center gap-1.5"
            >
              <BsPencil className="w-3.5 h-3.5" />
              Edit
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
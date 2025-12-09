'use client';

import { useState, useEffect, useMemo } from 'react';
import { BsSearch, BsX, BsPerson, BsCheck } from 'react-icons/bs';
import { motion, AnimatePresence } from 'framer-motion';
import { User, UserManager } from '@/app/components/shared/types';
import { Role } from '@prisma/client';

interface ManagerSelectorProps {
  currentManager: User | UserManager | null;
  userId: string;
  userName: string;
  onSelect: (managerId: string | null) => void;
  onClose: () => void;
  isLoading?: boolean;
}

interface ManagerOption extends User {
  displayName: string;
}

export default function ManagerSelector({
  currentManager,
  userId,
  userName,
  onSelect,
  onClose,
  isLoading = false
}: ManagerSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [managers, setManagers] = useState<ManagerOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch managers and admins
  useEffect(() => {
    const fetchManagers = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/users?minimal=true&limit=1000&page=1&sortBy=name&sortOrder=asc');
        
        if (!response.ok) {
          throw new Error('Failed to fetch managers');
        }

        const data = await response.json();
        const usersList = Array.isArray(data) ? data : (data.users || []);
        
        // Filter to only ADMIN and MANAGER roles, and exclude the current user
        const managerList = usersList
          .filter((user: User) => 
            (user.role === Role.ADMIN || user.role === Role.MANAGER) && 
            user.id !== userId
          )
          .map((user: User) => ({
            ...user,
            displayName: `${user.name} (${user.email})`
          }));

        setManagers(managerList);
      } catch (error) {
        console.error('Error fetching managers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchManagers();
  }, [userId]);

  // Filter managers based on search term
  const filteredManagers = useMemo(() => {
    if (!searchTerm.trim()) {
      return managers;
    }

    const searchLower = searchTerm.toLowerCase();
    return managers.filter(manager =>
      manager.name.toLowerCase().includes(searchLower) ||
      manager.email.toLowerCase().includes(searchLower) ||
      manager.displayName.toLowerCase().includes(searchLower)
    );
  }, [managers, searchTerm]);

  const handleSelect = (managerId: string | null) => {
    onSelect(managerId);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        />

        {/* Modal - Full Screen Centered */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full h-full max-w-2xl max-h-[90vh] bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-2xl border border-gray-700/50 overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-700/50 flex-shrink-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-semibold text-white">Assign Manager</h3>
              <button
                onClick={onClose}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors"
              >
                <BsX className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-400">
              Select a manager for <span className="text-white font-medium">{userName}</span>
            </p>
          </div>

          {/* Search Input */}
          <div className="p-3 border-b border-gray-700/50 flex-shrink-0">
            <div className="relative">
              <BsSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-gray-900/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                autoFocus
              />
            </div>
          </div>

          {/* Manager List - Improved Scrolling */}
          <div 
            className="flex-1 overflow-y-auto overscroll-contain manager-selector-scroll"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(75, 85, 99, 0.5) rgba(31, 41, 55, 0.3)'
            }}
          >
            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
                <p className="mt-3 text-sm text-gray-400">Loading managers...</p>
              </div>
            ) : (
              <>
                {/* Unassigned Option */}
                <button
                  onClick={() => handleSelect(null)}
                  disabled={isLoading}
                  className={`w-full px-3 py-2.5 text-left hover:bg-gray-700/50 transition-colors border-b border-gray-700/30 ${
                    !currentManager ? 'bg-indigo-500/10 border-l-3 border-l-indigo-500' : ''
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gray-700/50 flex items-center justify-center flex-shrink-0">
                      <BsPerson className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm text-white font-medium">Unassigned</span>
                        {!currentManager && (
                          <BsCheck className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">No manager assigned</p>
                    </div>
                  </div>
                </button>

                {/* Manager Options */}
                {filteredManagers.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-sm text-gray-400">No managers found</p>
                    {searchTerm && (
                      <p className="text-xs text-gray-500 mt-1.5">Try a different search term</p>
                    )}
                  </div>
                ) : (
                  filteredManagers.map((manager) => {
                    const isSelected = currentManager?.id === manager.id;
                    const isAdmin = manager.role === Role.ADMIN;

                    return (
                      <button
                        key={manager.id}
                        onClick={() => handleSelect(manager.id)}
                        disabled={isLoading}
                        className={`w-full px-3 py-2.5 text-left hover:bg-gray-700/50 transition-colors border-b border-gray-700/30 ${
                          isSelected ? 'bg-indigo-500/10 border-l-3 border-l-indigo-500' : ''
                        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isAdmin 
                              ? 'bg-purple-500/20 text-purple-400' 
                              : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            <BsPerson className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm text-white font-medium truncate">{manager.name}</span>
                              {isSelected && (
                                <BsCheck className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <p className="text-xs text-gray-400 truncate">{manager.email}</p>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 ${
                                isAdmin
                                  ? 'bg-purple-500/20 text-purple-400'
                                  : 'bg-blue-500/20 text-blue-400'
                              }`}>
                                {isAdmin ? 'ADMIN' : 'MGR'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-700/50 bg-gray-900/30 flex-shrink-0">
            <p className="text-xs text-gray-500 text-center">
              {filteredManagers.length} manager{filteredManagers.length !== 1 ? 's' : ''} available
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}


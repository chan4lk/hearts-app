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

  // Fetch ALL managers and admins independently - no filters from parent
  useEffect(() => {
    let isMounted = true;
    let abortController = new AbortController();
    
    const fetchManagers = async () => {
      try {
        setLoading(true);
        // Always reset search term when modal opens
        setSearchTerm('');
        
        // Fetch ALL users with minimal fields - NO FILTER PARAMETERS
        // Only include essential pagination/sorting params, NO filter params
        // This ensures we get ALL users regardless of any parent component filters
        const url = new URL('/api/admin/users', window.location.origin);
        url.searchParams.set('minimal', 'true');
        url.searchParams.set('limit', '1000');
        url.searchParams.set('page', '1');
        url.searchParams.set('sortBy', 'name');
        url.searchParams.set('sortOrder', 'asc');
        // DO NOT include: role, isActive, search, department, managerId
        // This ensures NO server-side filtering is applied
        
        const response = await fetch(url.toString(), {
          method: 'GET',
          credentials: 'include',
          signal: abortController.signal,
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store' // Ensure fresh data, no cache
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status}`);
        }

        const data = await response.json();
        const usersList = Array.isArray(data) ? data : (data.users || []);
        
        // Filter to ONLY ADMIN and MANAGER roles, exclude current user
        // This is client-side filtering - search will work on this filtered list
        const managerList = usersList
          .filter((user: User) => 
            (user.role === Role.ADMIN || user.role === Role.MANAGER) && 
            user.id !== userId
          )
          .map((user: User) => ({
            ...user,
            displayName: `${user.name} (${user.email})`
          }))
          .sort((a: ManagerOption, b: ManagerOption) => a.name.localeCompare(b.name));

        if (isMounted) {
          setManagers(managerList);
        }
      } catch (error: any) {
        // Ignore abort errors (component unmounted)
        if (error.name === 'AbortError') {
          return;
        }
        if (isMounted) {
          setManagers([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchManagers();
    
    // Cleanup: abort fetch and prevent state updates if component unmounts
    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [userId]);

  // Client-side search filtering - works on ALL loaded managers
  // This is completely independent of any parent component filters
  const filteredManagers = useMemo(() => {
    // If no search term, return ALL managers (no filtering)
    if (!searchTerm.trim()) {
      return managers; // Return all loaded managers
    }

    // Filter managers based on search term (name or email only)
    // This filtering happens entirely client-side on the loaded managers list
    const searchLower = searchTerm.toLowerCase().trim();
    return managers.filter(manager =>
      manager.name.toLowerCase().includes(searchLower) ||
      manager.email.toLowerCase().includes(searchLower)
    );
  }, [managers, searchTerm]);

  const handleSelect = (managerId: string | null) => {
    onSelect(managerId);
    // Reset search term when closing
    setSearchTerm('');
    onClose();
  };

  // Reset search term when modal closes
  const handleClose = () => {
    setSearchTerm('');
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
          onClick={handleClose}
          className="absolute inset-0 modal-overlay backdrop-blur-sm"
        />

        {/* Modal - Simple and Compact */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md bg-surface-elevated rounded-lg shadow-xl border border-theme overflow-hidden flex flex-col"
          style={{ maxHeight: 'calc(6 * 3.5rem + 8rem)' }} // Show ~6 items + header/search/footer
        >
          {/* Compact Header */}
          <div className="px-4 py-3 border-b border-theme flex items-center justify-between flex-shrink-0">
            <div>
              <h3 className="text-base font-semibold text-primary">Assign Manager</h3>
              <p className="text-xs text-secondary mt-0.5">{userName}</p>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 text-secondary hover:text-primary hover:bg-surface-secondary rounded transition-colors"
            >
              <BsX className="w-4 h-4" />
            </button>
          </div>

          {/* Compact Search */}
          <div className="px-4 py-2.5 border-b border-theme flex-shrink-0">
            <div className="relative">
              <BsSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-surface-secondary border border-theme rounded-md text-primary placeholder-gray-500 focus:outline-none focus-ring/50 focus:border-[rgba(var(--color-accent),0.5)] transition-all"
                autoFocus
              />
            </div>
          </div>

          {/* Scrollable List - Shows 6 by default, then scrolls */}
          <div 
            className="flex-1 overflow-y-auto min-h-0"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(107, 114, 128, 0.5) transparent',
              maxHeight: 'calc(6 * 3.5rem)' // Show 6 items initially
            }}
          >
            {loading ? (
              <div className="py-12 text-center">
                <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-gray-600 border-t-indigo-500"></div>
                <p className="mt-2 text-xs text-secondary">Loading...</p>
              </div>
            ) : (
              <div className="py-1">
                {/* Unassigned - Compact */}
                <button
                  onClick={() => handleSelect(null)}
                  disabled={isLoading}
                  className={`w-full px-4 py-2.5 text-left hover:bg-surface-secondary transition-colors ${
                    !currentManager ? 'bg-indigo-500/10' : ''
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-2.5">
                    <BsPerson className="w-4 h-4 text-secondary flex-shrink-0" />
                    <span className="text-sm text-primary">Unassigned</span>
                    {!currentManager && (
                      <BsCheck className="w-3.5 h-3.5 text-indigo-400 ml-auto flex-shrink-0" />
                    )}
                  </div>
                </button>

                {/* Managers - Compact List, Shows 6 by default */}
                {filteredManagers.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-sm text-secondary">No managers found</p>
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
                        className={`w-full px-4 py-2.5 text-left hover:bg-surface-secondary transition-colors ${
                          isSelected ? 'bg-indigo-500/10' : ''
                        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isAdmin ? 'bg-purple-500/20' : 'bg-blue-500/20'
                          }`}>
                            <BsPerson className={`w-3.5 h-3.5 ${isAdmin ? 'text-purple-400' : 'text-blue-400'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-primary truncate">{manager.name}</span>
                              <span className={`text-2xs px-1.5 py-0.5 rounded flex-shrink-0 ${
                                isAdmin ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                              }`}>
                                {isAdmin ? 'ADMIN' : 'MGR'}
                              </span>
                              {isSelected && (
                                <BsCheck className="w-3.5 h-3.5 text-indigo-400 ml-auto flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-secondary truncate mt-0.5">{manager.email}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Compact Footer */}
          {!loading && (
            <div className="px-4 py-2 border-t border-theme bg-surface-secondary flex-shrink-0">
              <p className="text-xs text-tertiary text-center">
                {filteredManagers.length} available
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}


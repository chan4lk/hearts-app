'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import UserTable from './components/UserTable';

import PageToolbar, { FilterSelect } from '@/app/components/shared/PageToolbar';
import StatsSection, { StatItem } from '@/app/components/shared/StatsSection';

import { BsPeople, BsGraphUp, BsShieldExclamation } from 'react-icons/bs';
import { Pagination } from '@/app/components/shared/Pagination';
import { DeleteConfirmationModal } from '@/app/components/shared/DeleteConfirmationModal';
import { User, UserFilters } from '@/app/components/shared/types';
import { Role } from '.prisma/client';

interface RawUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  manager?: {
    id: string;
    name: string;
    email: string;
    role: Role;
  } | null;
  employees?: User[];
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
  department?: string | null;
  position?: string | null;
}

function UsersPageContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Initialize filters from URL params
  const getInitialFilters = (searchParams: URLSearchParams): UserFilters => {
    const roleParam = searchParams.get('role');
    const validRoles = ['EMPLOYEE', 'MANAGER', 'ADMIN'];
    return {
      role: roleParam && validRoles.includes(roleParam) ? roleParam : '',
      status: '',
      manager: ''
    };
  };

  const getInitialPage = (searchParams: URLSearchParams): number => {
    const pageParam = searchParams.get('page');
    if (pageParam) {
      const pageNum = parseInt(pageParam, 10);
      if (!isNaN(pageNum) && pageNum > 0) return pageNum;
    }
    return 1;
  };

  const [users, setUsers] = useState<User[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Total counts for stats (always show total, not filtered)
  const [totalStats, setTotalStats] = useState({
    total: 0,
    active: 0,
    managers: 0,
    employees: 0,
    admins: 0
  });

  const [filters, setFilters] = useState<UserFilters>(() => getInitialFilters(searchParams));
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  
  // Pagination state
  const [page, setPage] = useState(() => getInitialPage(searchParams));
  const [limit, setLimit] = useState(20);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null>(null);

  // Add auto-refresh functionality
  const REFRESH_INTERVAL = 30000; // 30 seconds

  // Update filters when URL params change (for navigation)
  useEffect(() => {
    const roleParam = searchParams.get('role');
    const pageParam = searchParams.get('page');
    
    if (roleParam) {
      const validRoles = ['EMPLOYEE', 'MANAGER', 'ADMIN'];
      if (validRoles.includes(roleParam) && filters.role !== roleParam) {
        setFilters((prev: UserFilters) => ({
          ...prev,
          role: roleParam
        }));
      }
    } else if (filters.role !== '') {
      // Clear role filter if not in URL
      setFilters((prev: UserFilters) => ({
        ...prev,
        role: ''
      }));
    }
    
    if (pageParam) {
      const pageNum = parseInt(pageParam, 10);
      if (!isNaN(pageNum) && pageNum > 0 && page !== pageNum) {
        setPage(pageNum);
      }
    }
  }, [searchParams]);

  // Fetch total stats from admin/stats API (1 lightweight request instead of loading 10K users)
  const fetchTotalStats = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (!response.ok) return;

      const data = await response.json();
      setTotalStats({
        total: data.totalUsers || 0,
        active: data.activeSessions || 0,
        managers: data.managerCount || 0,
        employees: data.employeeCount || 0,
        admins: data.adminCount || 0
      });
    } catch (error) { // handled silently
    }
  }, []);

  const fetchUsers = async (currentPage = page) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        ...(filters.role && filters.role !== '' && { role: filters.role }),
        ...(filters.status && filters.status !== '' && { isActive: filters.status === 'ACTIVE' ? 'true' : 'false' }),
        ...(filters.manager && filters.manager !== '' && { managerId: filters.manager }),
        ...(searchTerm && searchTerm !== '' && { search: searchTerm })
      });

      const response = await fetch(`/api/admin/users?${params}`);
      if (!response.ok) {
        if (response.status === 401) {
          // Toast removed
          router.push('/login');
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle both old format (array) and new format (object with users and pagination)
      const usersData = Array.isArray(data) ? data : data.users || [];
      const transformedUsers = usersData.map((user: RawUser): User => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        manager: user.manager ? {
          ...user.manager,
          role: user.manager.role
        } : null,
        employees: user.employees || [],
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        status: user.isActive ? 'ACTIVE' : 'INACTIVE',
        department: user.department || null,
        position: user.position || null
      }));

      setUsers(transformedUsers);
      setManagers(transformedUsers.filter((user: User) => 
        user.role === Role.MANAGER || user.role === Role.ADMIN
      ));
      
      // Set pagination if available
      if (data.pagination) {
        setPagination(data.pagination);
      }
      
      setLastRefresh(new Date());
    } catch (error) { // handled silently
      // Toast removed
    } finally {
      setIsLoading(false);
    }
  };


  // Reset to page 1 when filters or search term changes
  useEffect(() => {
    if (page !== 1) {
      setPage(1);
    }
  }, [filters, searchTerm]);

  useEffect(() => {
    if (!session?.user || session.user.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }

    // Fetch total stats once on mount
    fetchTotalStats();

    // Initial fetch
    fetchUsers(page);

    // Set up auto-refresh
    const intervalId = setInterval(() => {
      fetchUsers(page);
      fetchTotalStats(); // Refresh stats too
    }, REFRESH_INTERVAL);

    // Cleanup on unmount
    return () => clearInterval(intervalId);
  }, [session, router, page, limit, filters, searchTerm]);

  // Filtering is now done on the server, but we keep this for any client-side filtering needed
  const filteredUsers = users;

  // Handle quick role update from table
  const handleQuickRoleUpdate = (userId: string, newRole: string, updatedUser: User) => {
    // Optimistically update the user list
    setUsers(prev => prev.map(user => 
      user.id === userId ? updatedUser : user
    ));
    
    // Update managers list if role changed
    if (newRole === 'MANAGER' || newRole === 'ADMIN') {
      setManagers(prev => {
        const exists = prev.find(m => m.id === userId);
        if (!exists) {
          return [...prev, updatedUser];
        }
        return prev.map(m => m.id === userId ? updatedUser : m);
      });
    } else {
      setManagers(prev => prev.filter(m => m.id !== userId));
    }
  };

  // Handle quick status update from table
  const handleQuickStatusUpdate = (userId: string, newStatus: string, updatedUser: User) => {
    // Optimistically update the user list
    setUsers(prev => prev.map(user => 
      user.id === userId ? updatedUser : user
    ));
  };

  // Handle quick manager update from table
  const handleQuickManagerUpdate = (userId: string, newManagerId: string | null, updatedUser: User) => {
    // Optimistically update the user list
    setUsers(prev => prev.map(user => 
      user.id === userId ? updatedUser : user
    ));
  };

  // Handle delete user
  const handleDeleteUser = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    setUserToDelete(user);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    try {
      const response = await fetch(`/api/admin/users?id=${userToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete user');
      }

      setUsers(prev => prev.filter(user => user.id !== userToDelete.id));
      setIsDeleteConfirmOpen(false);
      setUserToDelete(null);
      // Toast removed
    } catch (error) { // handled silently
      // Toast removed
    }
  };



  // Use total stats (always show total counts, not filtered)
  const userStats = {
    total: totalStats.total,
    active: totalStats.active,
    managers: totalStats.managers,
    employees: totalStats.employees,
    admins: totalStats.admins
  };

  // Handle stat card clicks to filter
  const handleStatFilter = (filterType: 'role' | 'clear', value?: string) => {
    if (filterType === 'clear') {
      setFilters((prev: UserFilters) => ({
        ...prev,
        role: ''
      }));
      // Update URL to remove role filter
      const params = new URLSearchParams(window.location.search);
      params.delete('role');
      router.push(`/dashboard/admin/users?${params.toString()}`);
    } else if (filterType === 'role' && value) {
      setFilters((prev: UserFilters) => ({
        ...prev,
        role: value
      }));
      // Update URL with role filter
      const params = new URLSearchParams(window.location.search);
      params.set('role', value);
      params.delete('page'); // Reset to page 1
      router.push(`/dashboard/admin/users?${params.toString()}`);
    }
    setPage(1); // Reset to first page
  };

  return (
    <DashboardLayout type="admin">
      <div className="fixed inset-0 top-16 left-0 md:left-60 right-0 bottom-0 bg-surface-primary flex flex-col overflow-hidden z-0">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 pointer-events-none bg-grid" />
        
        <div className="relative max-w-7xl mx-auto px-6 py-6 flex flex-col h-full w-full overflow-hidden">
          {/* Stats Section - Fixed */}
          <div className="flex-shrink-0 pb-3">
            {(() => {
              const statItems: StatItem[] = [
                {
                  title: 'Total Users',
                  value: userStats.total,
                  icon: <BsPeople className="w-4 h-4" />,
                },
                {
                  title: 'Employees',
                  value: userStats.employees,
                  icon: <BsPeople className="w-4 h-4" />,
                  onClick: () => handleStatFilter('role', 'EMPLOYEE')
                },
                {
                  title: 'Managers',
                  value: userStats.managers,
                  icon: <BsGraphUp className="w-4 h-4" />,
                  onClick: () => handleStatFilter('role', 'MANAGER')
                },
                {
                  title: 'Admins',
                  value: userStats.admins,
                  icon: <BsShieldExclamation className="w-4 h-4" />,
                  onClick: () => handleStatFilter('role', 'ADMIN')
                }
              ];
              return <StatsSection stats={statItems} variant="auto" />;
            })()}
          </div>

          {/* Toolbar + Filters */}
          <div className="flex-shrink-0 pb-3">
            <PageToolbar
              searchValue={searchTerm}
              onSearchChange={setSearchTerm}
              searchPlaceholder="Search users by name or email..."
              hasActiveFilters={filters.role !== '' || filters.status !== ''}
              onClearFilters={() => {
                setFilters({ role: '', status: '', manager: '' });
                setSearchTerm('');
              }}
            >
              <FilterSelect
                value={filters.role}
                onChange={(value) => setFilters((prev: UserFilters) => ({ ...prev, role: value }))}
                options={[
                  { value: 'EMPLOYEE', label: 'Employee' },
                  { value: 'MANAGER', label: 'Manager' },
                  { value: 'ADMIN', label: 'Admin' },
                ]}
                placeholder="All Roles"
              />
              <FilterSelect
                value={filters.status}
                onChange={(value) => setFilters((prev: UserFilters) => ({ ...prev, status: value }))}
                options={[
                  { value: 'ACTIVE', label: 'Active' },
                  { value: 'INACTIVE', label: 'Inactive' },
                ]}
                placeholder="All Status"
              />
            </PageToolbar>
          </div>

          {/* User Table - Scrollable Container */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex-1 flex flex-col overflow-hidden min-h-0"
            >
              <div className="relative bg-surface-elevated rounded-lg border border-theme overflow-hidden shadow-sm flex flex-col h-full">
                <div className="p-4 flex flex-col flex-1 overflow-hidden min-h-0">
                  <UserTable
                    users={filteredUsers}
                    managers={managers}
                    onRoleUpdate={handleQuickRoleUpdate}
                    onStatusUpdate={handleQuickStatusUpdate}
                    onManagerUpdate={handleQuickManagerUpdate}
                    onDeleteAction={handleDeleteUser}
                  />
                </div>
              </div>
            </motion.div>
            
            {/* Pagination - Fixed at bottom */}
            {pagination && (
              <div className="flex-shrink-0 pt-4 pb-3 border-t border-theme">
                <Pagination
                  page={pagination.page}
                  limit={pagination.limit}
                  total={pagination.total}
                  totalPages={pagination.totalPages}
                  hasNext={pagination.hasNext}
                  hasPrev={pagination.hasPrev}
                  onPageChange={(newPage) => {
                    setPage(newPage);
                  }}
                  onLimitChange={(newLimit) => {
                    setLimit(newLimit);
                    setPage(1);
                  }}
                />
              </div>
            )}
          </div>
        </div>

        <DeleteConfirmationModal
          isOpen={isDeleteConfirmOpen}
          onClose={() => {
            setIsDeleteConfirmOpen(false);
            setUserToDelete(null);
          }}
          onConfirm={confirmDelete}
          title="Delete User"
          message={userToDelete ? `Are you sure you want to delete "${userToDelete.name}"? This action cannot be undone.` : "Are you sure you want to delete this user? This action cannot be undone."}
          confirmText="Delete"
          cancelText="Cancel"
        />

        {/* Toaster removed */}
      </div>
    </DashboardLayout>
  );
}

export default function UsersPage() {
  return (
    <Suspense fallback={
      <DashboardLayout type="admin">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-white">Loading...</div>
        </div>
      </DashboardLayout>
    }>
      <UsersPageContent />
    </Suspense>
  );
}

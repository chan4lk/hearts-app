'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Toaster } from 'sonner';
import { motion } from 'framer-motion';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import LoadingComponent from '@/app/components/LoadingScreen';
import UserTable from './components/UserTable';
import UserFilters from './components/Filters';
import HeroSection from './components/HeroSection';
import StatsSection from './components/StatsSection';
import { Pagination } from '@/app/components/shared/Pagination';
import { DeleteConfirmationModal } from '@/app/components/shared/DeleteConfirmationModal';
import { User, Filters } from '@/app/components/shared/types';
import { Role } from '.prisma/client';
import { showToast } from '@/app/utils/toast';

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

export default function UsersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const [filters, setFilters] = useState<Filters>({
    role: '',
    status: '',
    manager: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  
  // Pagination state
  const [page, setPage] = useState(1);
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
          showToast.user.error('Unauthorized access');
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
    } catch (error) {
      console.error('Error fetching users:', error);
      showToast.user.error('Failed to fetch users');
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

    // Initial fetch
    fetchUsers(page);

    // Set up auto-refresh
    const intervalId = setInterval(() => {
      fetchUsers(page);
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
      showToast.user.deleted();
    } catch (error) {
      showToast.error('Failed to delete user', error);
    }
  };

  if (isLoading) {
    return <LoadingComponent />;
  }

  // Calculate stats for StatsSection
  const userStats = {
    total: users.length,
    active: users.filter(u => u.status === 'ACTIVE').length,
    managers: users.filter(u => u.role === 'MANAGER').length,
    employees: users.filter(u => u.role === 'EMPLOYEE').length
  };

  return (
    <DashboardLayout type="admin">
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        {/* Subtle Background Pattern */}
        <div className="fixed inset-0 bg-[url('/grid.svg')] opacity-5 pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto px-4 py-3 space-y-4">
          {/* Hero Section */}
          <HeroSection />

          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <StatsSection users={userStats} />
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <UserFilters
              onFilterChangeAction={setFilters}
              onSearchAction={setSearchTerm}
              currentUserRole={session?.user?.role as Role}
              initialFilters={filters}
              initialSearchTerm={searchTerm}
            />
          </motion.div>

          {/* User Table */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="relative bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-xl shadow-xl">
              <div className="p-4">
                <UserTable
                  users={filteredUsers}
                  managers={managers}
                  onRoleUpdate={handleQuickRoleUpdate}
                  onStatusUpdate={handleQuickStatusUpdate}
                  onManagerUpdate={handleQuickManagerUpdate}
                  onDeleteAction={handleDeleteUser}
                />
                
                {/* Pagination */}
                {pagination && (
                  <div className="mt-6 pt-4 border-t border-gray-700/50">
                    <Pagination
                      page={pagination.page}
                      limit={pagination.limit}
                      total={pagination.total}
                      totalPages={pagination.totalPages}
                      hasNext={pagination.hasNext}
                      hasPrev={pagination.hasPrev}
                      onPageChange={(newPage) => {
                        setPage(newPage);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
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
          </motion.div>
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

        <Toaster 
          position="top-center"
          richColors
          closeButton
          theme="dark"
          toastOptions={{
            style: {
              background: 'rgba(30, 32, 40, 0.95)',
              color: '#fff',
              border: '1px solid rgba(45, 55, 72, 0.5)',
              borderRadius: '16px',
              padding: '20px 24px',
              fontSize: '16px',
              fontWeight: '600',
              textAlign: 'center',
              width: 'auto',
              maxWidth: '450px',
              margin: '0 auto',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            },
            duration: 4000,
            className: 'modern-toast'
          }}
        />
      </div>
    </DashboardLayout>
  );
}

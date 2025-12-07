'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Toaster } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import LoadingComponent from '@/app/components/LoadingScreen';
import UserTable from './components/UserTable';
import UserForm from './components/UserForm';
import UserDetails from './components/UserDetails';
import UserFilters from './components/Filters';
import StatsSection from './components/StatsSection';
import HeroSection from './components/HeroSection';
import { DeleteConfirmationModal } from '@/app/components/shared/DeleteConfirmationModal';
import { User, FormData, Filters } from '@/app/components/shared/types';
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
  const [loading, setLoading] = useState(true);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
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

  // Add auto-refresh functionality
  const REFRESH_INTERVAL = 30000; // 30 seconds

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        if (response.status === 401) {
          showToast.user.error('Unauthorized access');
          router.push('/login');
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const transformedUsers = data.map((user: RawUser): User => ({
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
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching users:', error);
      showToast.user.error('Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!session?.user || session.user.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }

    // Initial fetch
    fetchUsers();

    // Set up auto-refresh
    const intervalId = setInterval(() => {
      // Only refresh if no modals are open
      if (!isFormOpen && !isDetailsOpen && !isDeleteConfirmOpen) {
        fetchUsers();
      }
    }, REFRESH_INTERVAL);

    // Cleanup on unmount
    return () => clearInterval(intervalId);
  }, [session, router, isFormOpen, isDetailsOpen, isDeleteConfirmOpen]);

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = filters.role === '' || user.role === filters.role;
    const matchesStatus = filters.status === '' || user.status === filters.status;
    const matchesManager = filters.manager === '' || 
      (user.manager && user.manager.id === filters.manager);

    // If current user is a manager, only show their employees and other managers
    if (session?.user?.role === Role.MANAGER && session?.user?.id) {
      return (user.manager?.id === session.user.id) || user.role === Role.MANAGER;
    }

    return matchesSearch && matchesRole && matchesStatus && matchesManager;
  });

  const handleCreateUser = async (formData: FormData) => {
    try {
      console.log('Creating user with data:', {
        ...formData,
        password: '[REDACTED]'
      });

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          managerId: formData.managerId || null,
          isActive: formData.status === 'ACTIVE'
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Failed to create user:', {
          status: response.status,
          statusText: response.statusText,
          error: data.error
        });
        throw new Error(data.error || 'Failed to create user');
      }

      console.log('User created successfully:', {
        ...data,
        password: undefined
      });

      setUsers(prev => [data, ...prev]);
      // Update managers list if the new user is a manager or admin
      if (data.role === Role.MANAGER || data.role === Role.ADMIN) {
        setManagers(prev => [data, ...prev]);
      }
      setIsFormOpen(false);
      showToast.user.created();
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to create user';
      showToast.user.error(errorMessage);
      console.error('Error creating user:', error);
    }
  };

  const handleUpdateUser = async (formData: FormData) => {
    if (!selectedUser) return;

    try {
      // Determine managerId based on role and current selection
      const managerId = formData.managerId || null;

      console.log('Updating user with data:', {
        id: selectedUser.id,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        managerId,
        isActive: formData.status === 'ACTIVE'
      });

      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedUser.id,
          name: formData.name,
          email: formData.email,
          role: formData.role as Role,
          managerId,
          isActive: formData.status === 'ACTIVE'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Update failed with error:', errorData);
        throw new Error(errorData.error || 'Failed to update user');
      }

      const updatedUser = await response.json();
      console.log('Successfully updated user:', updatedUser);
      
      setUsers(prev => prev.map(user => 
        user.id === updatedUser.id ? updatedUser : user
      ));
      setIsFormOpen(false);
      setSelectedUser(null);
      showToast.user.updated();
    } catch (error) {
      console.error('Error in handleUpdateUser:', error);
      showToast.error('Failed to update user', error);
    }
  };

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
          <HeroSection onAddUser={() => {
            setSelectedUser(null);
            setIsFormOpen(true);
          }} />

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
              managers={managers.map((user: User) => ({
                id: user.id,
                name: user.name,
                role: user.role
              }))}
              currentUserRole={session?.user?.role as Role}
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
                  onViewDetailsAction={(user: User) => {
                    setSelectedUser(user);
                    setIsDetailsOpen(true);
                  }}
                  onEditAction={(user: User) => {
                    setSelectedUser(user);
                    setIsFormOpen(true);
                  }}
                  onDeleteAction={handleDeleteUser}
                  onRoleUpdate={handleQuickRoleUpdate}
                  onStatusUpdate={handleQuickStatusUpdate}
                  onManagerUpdate={handleQuickManagerUpdate}
                />
              </div>
            </div>
          </motion.div>
        </div>

        <AnimatePresence>
          {isFormOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                className="bg-gray-900/95 backdrop-blur-xl rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 shadow-xl sm:shadow-2xl border border-white/20 dark:border-gray-700/30 transform-gpu"
              >
                <UserForm
                  initialData={selectedUser || undefined}
                  managers={managers}
                  onSubmitAction={selectedUser ? handleUpdateUser : handleCreateUser}
                  onCancelAction={() => {
                    setSelectedUser(null);
                    setIsFormOpen(false);
                  }}
                  isEditing={!!selectedUser}
                />
              </motion.div>
            </motion.div>
          )}

          {isDetailsOpen && selectedUser && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl max-w-2xl border border-white/20 dark:border-gray-700/30 overflow-hidden"
              >
                <UserDetails
                  user={selectedUser}
                  onCloseAction={() => {
                    setSelectedUser(null);
                    setIsDetailsOpen(false);
                  }}
                  onEditAction={() => {
                    setIsDetailsOpen(false);
                    setIsFormOpen(true);
                  }}
                />
              </motion.div>
            </motion.div>
          )}

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
        </AnimatePresence>

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

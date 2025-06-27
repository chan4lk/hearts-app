'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { BsPeople, BsCheckCircle, BsPersonBadge, BsBuilding } from 'react-icons/bs';
import { Toaster } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import LoadingComponent from '@/app/components/LoadingScreen';
import UserTable from './components/UserTable';
import UserForm from './components/UserForm';
import UserDetails from './components/UserDetails';
import UserFilters from './components/UserFilters';
import StatsCard from './components/StatsCard';
import HeroSection from './components/HeroSection';
import BackgroundElements from './components/BackgroundElements';
import { User, FormData, Filters } from './types';
import { Role } from '@prisma/client';
import { showToast } from '@/app/utils/toast';

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
      const transformedUsers = data.map((user: any) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        manager: user.manager,
        employees: user.employees,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        status: user.isActive ? 'ACTIVE' : 'INACTIVE'
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
    if (session?.user?.role === Role.MANAGER && session.user.id) {
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
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedUser.id,
          name: formData.name,
          email: formData.email,
          role: formData.role,
          managerId: formData.role === 'EMPLOYEE' ? formData.managerId : null,
          isActive: formData.status === 'ACTIVE',
          password: formData.newPassword || undefined
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
      }

      const updatedUser = await response.json();
      setUsers(prev => prev.map(user => 
        user.id === updatedUser.id ? updatedUser : user
      ));
      setIsFormOpen(false);
      setSelectedUser(null);
      showToast.user.updated();
    } catch (error) {
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

  if (isLoading) {
    return <LoadingComponent />;
  }

  const statsCards = [
    {
      icon: BsPeople,
      title: 'Total Users',
      value: users.length,
      total: users.length,
      color: 'from-blue-500 to-blue-600',
      delay: 0.5
    },
    {
      icon: BsCheckCircle,
      title: 'Active Users',
      value: users.filter(u => u.status === 'ACTIVE').length,
      total: users.length,
      color: 'from-green-500 to-green-600',
      delay: 0.6
    },
    {
      icon: BsPersonBadge,
      title: 'Managers',
      value: users.filter(u => u.role === 'MANAGER').length,
      total: users.length,
      color: 'from-purple-500 to-purple-600',
      delay: 0.7
    },
    {
      icon: BsBuilding,
      title: 'Employees',
      value: users.filter(u => u.role === 'EMPLOYEE').length,
      total: users.length,
      color: 'from-orange-500 to-orange-600',
      delay: 0.8
    }
  ];

  return (
    <DashboardLayout type="admin">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <BackgroundElements />

        <div className="relative z-10 p-3 space-y-4">
          <HeroSection onAddUser={() => {
            setSelectedUser(null);
            setIsFormOpen(true);
          }} />

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {statsCards.map((card, index) => (
              <StatsCard key={index} {...card} />
            ))}
          </motion.div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            <motion.div variants={itemVariants}>
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30">
                <div className="p-4">
                  <UserFilters
                    onFilterChange={setFilters}
                    onSearch={setSearchTerm}
                    managers={managers}
                    currentUserRole={session?.user.role as Role}
                  />
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 overflow-hidden">
                <div className="p-4">
                  <UserTable
                    users={filteredUsers}
                    onViewDetails={(user) => {
                      setSelectedUser(user);
                      setIsDetailsOpen(true);
                    }}
                    onEdit={(user) => {
                      setSelectedUser(user);
                      setIsFormOpen(true);
                    }}
                    onDelete={handleDeleteUser}
                  />
                </div>
              </div>
            </motion.div>
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
                className=" backdrop-blur-xl rounded-2xl p-6 shadow-2xl  border border-white/20 dark:border-gray-700/30"
              >
                <UserForm
                  initialData={selectedUser || undefined}
                  managers={managers}
                  onSubmit={selectedUser ? handleUpdateUser : handleCreateUser}
                  onCancel={() => {
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
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-2xl border border-white/20 dark:border-gray-700/30 overflow-hidden"
              >
                <UserDetails
                  user={selectedUser}
                  onClose={() => {
                    setSelectedUser(null);
                    setIsDetailsOpen(false);
                  }}
                  onEdit={() => {
                    setIsDetailsOpen(false);
                    setIsFormOpen(true);
                  }}
                />
              </motion.div>
            </motion.div>
          )}

          {isDeleteConfirmOpen && userToDelete && (
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
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-2xl w-full max-w-md border border-white/20 dark:border-gray-700/30"
              >
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Delete User</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                  Are you sure you want to delete <span className="font-semibold text-gray-800 dark:text-gray-200">{userToDelete.name}</span>?
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setIsDeleteConfirmOpen(false);
                      setUserToDelete(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700/50 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 transition-all duration-200"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};
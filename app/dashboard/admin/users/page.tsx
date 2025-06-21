'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { BsPeople, BsCheckCircle, BsPersonBadge, BsBuilding } from 'react-icons/bs';
import { Toaster, toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import UserTable from './components/UserTable';
import UserForm from './components/UserForm';
import UserDetails from './components/UserDetails';
import UserFilters from './components/UserFilters';
import StatsCard from './components/StatsCard';
import HeroSection from './components/HeroSection';
import BackgroundElements from './components/BackgroundElements';
import { User, FormData, Filters } from './types';

export default function UsersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
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

  useEffect(() => {
    if (!session?.user || session.user.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }
    fetchUsers();
  }, [session, router]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Unauthorized access');
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
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        status: user.isActive ? 'ACTIVE' : 'INACTIVE'
      }));
      setUsers(transformedUsers);
      setManagers(transformedUsers.filter((user: User) => user.role === 'MANAGER'));
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = filters.role === '' || user.role === filters.role;
    const matchesStatus = filters.status === '' || user.status === filters.status;
    const matchesManager = filters.manager === '' || 
      (user.manager && user.manager.id === filters.manager);

    return matchesSearch && matchesRole && matchesStatus && matchesManager;
  });

  const handleCreateUser = async (formData: FormData) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          managerId: formData.role === 'EMPLOYEE' ? formData.managerId : null,
          isActive: formData.status === 'ACTIVE'
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create user');
      }

      const newUser = await response.json();
      setUsers(prev => [newUser, ...prev]);
      setIsFormOpen(false);
      toast.success('User created successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create user');
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
      toast.success('User updated successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update user');
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
      toast.success('User deleted successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete user');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout type="admin">
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full"
          />
        </div>
      </DashboardLayout>
    );
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
          <HeroSection />

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3"
          >
            {statsCards.map((card, index) => (
              <StatsCard key={index} {...card} />
            ))}
          </motion.div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            <motion.div variants={itemVariants}>
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-lg p-3 shadow-md border border-white/20 dark:border-gray-700/50">
                <UserFilters
                  onFilterChange={setFilters}
                  onSearch={setSearchTerm}
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants}>
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-lg p-3 shadow-md border border-white/20 dark:border-gray-700/50">
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
            </motion.div>
          </motion.div>
        </div>

        <AnimatePresence>
          {isFormOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-lg p-4 shadow-lg w-full max-w-2xl border border-white/20 dark:border-gray-700/50"
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
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-lg shadow-lg w-full max-w-2xl border border-white/20 dark:border-gray-700/50"
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
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-lg p-4 shadow-lg w-full max-w-md border border-white/20 dark:border-gray-700/50"
              >
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Delete User</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Are you sure you want to delete <span className="font-semibold">{userToDelete.name}</span>?
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setIsDeleteConfirmOpen(false);
                      setUserToDelete(null);
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-red-500 to-red-600 rounded-md hover:from-red-600 hover:to-red-700 transition-all duration-300"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: 'rgba(30, 32, 40, 0.95)',
              color: '#fff',
              border: '1px solid rgba(45, 55, 72, 0.5)',
              padding: '8px',
              borderRadius: '6px',
              fontSize: '12px',
            },
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
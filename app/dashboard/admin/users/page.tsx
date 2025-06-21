'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { BsPlus, BsPencil, BsTrash, BsEye, BsEyeSlash, BsX, BsSearch, BsFilter, BsPeople, BsCalendar, BsEnvelope, BsBuilding, BsPersonBadge, BsShield, BsCheckCircle, BsXCircle, BsArrowUpRight, BsGear, BsBell } from 'react-icons/bs';
import { Toaster, toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import UserTable from './components/UserTable';
import UserForm from './components/UserForm';
import UserDetails from './components/UserDetails';
import UserFilters from './components/UserFilters';
import { User, FormData, Filters, ROLES } from './types';

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
    console.log('Current session:', session);
    if (!session?.user || session.user.role !== 'ADMIN') {
      console.log('Not authorized as admin, redirecting...');
      router.push('/dashboard');
      return;
    }
    fetchUsers();
  }, [session, router]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Unauthorized access. Please log in again.');
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
      toast.error('Failed to fetch users. Please try again later.');
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
      if (!session?.user || session.user.role !== 'ADMIN') {
        toast.error('You are not authorized to create users');
        return;
      }

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
      const transformedUser: User = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        manager: newUser.manager,
        createdAt: newUser.createdAt,
        status: newUser.isActive ? 'ACTIVE' : 'INACTIVE'
      };
      
      setUsers(prev => [transformedUser, ...prev]);
      setIsFormOpen(false);
      toast.success('User created successfully!', {
        duration: 3000,
        position: 'top-right',
        style: {
          background: '#1E2028',
          color: '#fff',
          border: '1px solid #2D3748',
        },
      });
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create user');
    }
  };

  const handleUpdateUser = async (formData: FormData) => {
    if (!selectedUser) return;

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
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
      const transformedUser: User = {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        manager: updatedUser.manager,
        createdAt: updatedUser.createdAt,
        status: updatedUser.isActive ? 'ACTIVE' : 'INACTIVE'
      };
      
      setUsers(prev => prev.map(user => 
        user.id === transformedUser.id ? transformedUser : user
      ));
      setIsFormOpen(false);
      setSelectedUser(null);
      toast.success('User details updated successfully!', {
        duration: 3000,
        position: 'top-right',
        style: {
          background: '#1E2028',
          color: '#fff',
          border: '1px solid #2D3748',
        },
      });
    } catch (error) {
      console.error('Error updating user:', error);
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
      if (!session?.user || session.user.role !== 'ADMIN') {
        toast.error('You are not authorized to delete users');
        return;
      }

      const response = await fetch(`/api/admin/users?id=${userToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete user');
      }

      setUsers(prev => prev.filter(user => user.id !== userToDelete.id));
      setIsDeleteConfirmOpen(false);
      setUserToDelete(null);
      toast.success('User deleted successfully!', {
        duration: 3000,
        position: 'top-right',
        style: {
          background: '#1E2028',
          color: '#fff',
          border: '1px solid #2D3748',
        },
      });
    } catch (error) {
      console.error('Error deleting user:', error);
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
            className="relative"
          >
            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-600 rounded-full animate-pulse"></div>
          </motion.div>
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

  return (
    <DashboardLayout type="admin">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Floating Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-indigo-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 p-6 space-y-8">
          {/* Hero Section */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
          >
            <div className="bg-gradient-to-r from-indigo-600/90 via-purple-600/90 to-pink-600/90 backdrop-blur-xl rounded-3xl p-8 text-white shadow-2xl border border-white/20">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 rounded-3xl" />
              <div className="relative z-10">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h1 className="text-4xl lg:text-5xl font-bold mb-2 bg-gradient-to-r from-white to-indigo-100 bg-clip-text text-transparent">
                      User Management
                    </h1>
                    <p className="text-xl text-indigo-100/90">Manage your team members and their roles</p>
                  </div>
                  
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <motion.div variants={itemVariants} className="group">
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 border border-white/20 dark:border-gray-700/50 hover:scale-105">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl group-hover:from-blue-600 group-hover:to-blue-700 transition-all duration-300">
                    <BsPeople className="text-2xl text-white" />
                  </div>
                  <BsArrowUpRight className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{users.length}</h3>
                <p className="text-gray-600 dark:text-gray-300">Total Users</p>
                <div className="mt-4 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                  />
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="group">
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 border border-white/20 dark:border-gray-700/50 hover:scale-105">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl group-hover:from-green-600 group-hover:to-green-700 transition-all duration-300">
                    <BsCheckCircle className="text-2xl text-white" />
                  </div>
                  <BsArrowUpRight className="text-gray-400 group-hover:text-green-500 transition-colors" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {users.filter(u => u.status === 'ACTIVE').length}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">Active Users</p>
                <div className="mt-4 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(users.filter(u => u.status === 'ACTIVE').length / users.length) * 100}%` }}
                    transition={{ duration: 1, delay: 0.6 }}
                    className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full"
                  />
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="group">
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 border border-white/20 dark:border-gray-700/50 hover:scale-105">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl group-hover:from-purple-600 group-hover:to-purple-700 transition-all duration-300">
                    <BsPersonBadge className="text-2xl text-white" />
                  </div>
                  <BsArrowUpRight className="text-gray-400 group-hover:text-purple-500 transition-colors" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {users.filter(u => u.role === 'MANAGER').length}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">Managers</p>
                <div className="mt-4 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(users.filter(u => u.role === 'MANAGER').length / users.length) * 100}%` }}
                    transition={{ duration: 1, delay: 0.7 }}
                    className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"
                  />
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="group">
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 border border-white/20 dark:border-gray-700/50 hover:scale-105">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl group-hover:from-orange-600 group-hover:to-orange-700 transition-all duration-300">
                    <BsBuilding className="text-2xl text-white" />
                  </div>
                  <BsArrowUpRight className="text-gray-400 group-hover:text-orange-500 transition-colors" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {users.filter(u => u.role === 'EMPLOYEE').length}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">Employees</p>
                <div className="mt-4 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(users.filter(u => u.role === 'EMPLOYEE').length / users.length) * 100}%` }}
                    transition={{ duration: 1, delay: 0.8 }}
                    className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Filters and Table Section */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Filters */}
            <motion.div variants={itemVariants}>
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/50">
                <UserFilters
                  onFilterChange={setFilters}
                  onSearch={setSearchTerm}
                />
              </div>
            </motion.div>

            {/* User Table */}
            <motion.div variants={itemVariants}>
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20 dark:border-gray-700/50">
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

        {/* Modals */}
        <AnimatePresence>
          {isFormOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-2xl border border-white/20 dark:border-gray-700/50"
              >
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    {selectedUser ? 'Edit User' : 'Create User'}
                  </h2>
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
                </div>
              </motion.div>
            </motion.div>
          )}

          {isDetailsOpen && selectedUser && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-2xl border border-white/20 dark:border-gray-700/50"
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
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-md border border-white/20 dark:border-gray-700/50"
              >
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Delete User</h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Are you sure you want to delete <span className="font-semibold">{userToDelete.name}</span>? This action cannot be undone.
                  </p>
                  <div className="flex justify-end gap-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setIsDeleteConfirmOpen(false);
                        setUserToDelete(null);
                      }}
                      className="px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={confirmDelete}
                      className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg"
                    >
                      Delete
                    </motion.button>
                  </div>
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
              padding: '16px',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            },
            success: {
              iconTheme: {
                primary: '#48BB78',
                secondary: '#1E2028',
              },
            },
            error: {
              iconTheme: {
                primary: '#F56565',
                secondary: '#1E2028',
              },
            },
          }}
        />
      </div>
    </DashboardLayout>
  );
}
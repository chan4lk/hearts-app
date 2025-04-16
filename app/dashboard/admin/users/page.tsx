'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { BsPlus, BsPencil, BsTrash, BsEye, BsEyeSlash, BsX, BsSearch, BsFilter, BsPeople, BsCalendar, BsEnvelope, BsBuilding, BsPersonBadge, BsShield, BsCheckCircle, BsXCircle } from 'react-icons/bs';
import { toast } from 'react-hot-toast';
import DashboardLayout from '@/app/components/layout/DashboardLayout';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  manager?: {
    id: string;
    name: string;
    email: string;
  } | null;
  createdAt: string;
  lastLogin?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

const ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  EMPLOYEE: 'EMPLOYEE',
} as const;

type Role = keyof typeof ROLES;

export default function UserManagement() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'EMPLOYEE' as Role,
    managerId: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE'
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filters, setFilters] = useState({
    role: '',
    manager: '',
    status: ''
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user || session.user.role !== 'ADMIN') {
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
      // Transform the data to match our User interface
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
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    
    if (showCreateModal && !formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password && formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    }
    
    if (!formData.role) {
      errors.role = 'Role is required';
    }

    // Add validation for manager assignment
    if (formData.role === 'EMPLOYEE' && !formData.managerId) {
      errors.managerId = 'Manager is required for employees';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePasswordForm = () => {
    const errors: Record<string, string> = {};
    
    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    
    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters long';
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      console.log('Creating user with data:', formData);
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
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(errorData.error || 'Failed to create user');
      }

      const newUser = await response.json();
      console.log('User created successfully:', newUser);
      
      // Transform the new user to match our User interface
      const transformedUser: User = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        manager: newUser.manager,
        createdAt: newUser.createdAt,
        status: newUser.isActive ? 'ACTIVE' : 'INACTIVE' as 'ACTIVE' | 'INACTIVE'
      };
      
      setUsers([transformedUser, ...users]);
      setShowCreateModal(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'EMPLOYEE',
        managerId: '',
        status: 'ACTIVE'
      });
      toast.success('User created successfully');
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create user');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePasswordForm() || !selectedUser) return;

    try {
      const response = await fetch(`/api/admin/users/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to change password');
      }

      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      toast.success('Password changed successfully');
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to change password');
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (!validateForm()) return;

    try {
      console.log('Updating user with data:', {
        id: selectedUser.id,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        managerId: formData.role === 'EMPLOYEE' ? formData.managerId : null,
        isActive: formData.status === 'ACTIVE'
      });
      
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
          isActive: formData.status === 'ACTIVE'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(errorData.error || 'Failed to update user');
      }

      const updatedUser = await response.json();
      console.log('User updated successfully:', updatedUser);
      
      // Transform the updated user to match our User interface
      const transformedUser: User = {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        manager: updatedUser.manager,
        createdAt: updatedUser.createdAt,
        status: updatedUser.isActive ? 'ACTIVE' : 'INACTIVE' as 'ACTIVE' | 'INACTIVE'
      };
      
      setUsers(users.map(user => 
        user.id === transformedUser.id ? transformedUser : user
      ));
      setShowEditModal(false);
      setSelectedUser(null);
      toast.success('User updated successfully');
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete user');
      }

      setUsers(users.filter(user => user.id !== userId));
      setShowDeleteModal(false);
      setUserToDelete(null);
      
      toast.success('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete user');
    }
  };

  const confirmDelete = (userId: string) => {
    setUserToDelete(userId);
    setShowDeleteModal(true);
  };

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role as Role,
      managerId: user.manager?.id || '',
      status: user.status
    });
    setShowEditModal(true);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = !filters.role || user.role === filters.role;
    const matchesManager = !filters.manager || user.manager?.id === filters.manager;
    const matchesStatus = !filters.status || user.status === filters.status;
    
    return matchesSearch && matchesRole && matchesManager && matchesStatus;
  });

  const handleViewDetails = (user: User) => {
    console.log('Viewing user details:', user);
    setSelectedUser(user);
    setShowDetailModal(true);
  };

  // Add a function to reset form data
  const resetFormData = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: '' as Role,
      managerId: '',
      status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE'
    });
    setFormErrors({});
  };

  if (loading) {
    return (
      <DashboardLayout type="admin">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type="admin">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="bg-[#1E2028] p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-500/10 rounded-xl">
                <BsPeople className="w-8 h-8 text-indigo-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">User Management</h1>
                <p className="text-gray-400">Manage system users and their roles</p>
              </div>
            </div>
            <button
              onClick={() => {
                resetFormData();
                setShowCreateModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
            >
              <BsPlus className="w-5 h-5" />
              Add User
            </button>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-[#1E2028] p-4 rounded-xl shadow-lg">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-[#2D3748] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>
                <select
                  value={filters.role}
                  onChange={(e) => handleFilterChange('role', e.target.value)}
              className="px-4 py-2 bg-[#2D3748] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Roles</option>
              {Object.keys(ROLES).map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-4 py-2 bg-[#2D3748] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
                </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-[#1E2028] rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#2D3748]">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Manager</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2D3748]">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-[#2D3748] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-white">{user.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-white">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-400' :
                        user.role === 'MANAGER' ? 'bg-blue-500/20 text-blue-400' :
                        user.role === 'HR' ? 'bg-green-500/20 text-green-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-white">
                      {user.manager?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDetails(user)}
                          className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                        >
                          <BsEye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleEditClick(user)}
                          className="p-2 text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-colors"
                        >
                          <BsPencil className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowPasswordModal(true);
                          }}
                          className="p-2 text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                        >
                          <BsShield className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => confirmDelete(user.id)}
                          className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <BsTrash className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create User Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#1E2028] p-6 rounded-xl w-full max-w-md">
              <h2 className="text-xl font-bold text-white mb-4">Create New User</h2>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-[#2D3748] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter name"
                    autoComplete="off"
                  />
                  {formErrors.name && <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 bg-[#2D3748] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter email"
                    autoComplete="off"
                  />
                  {formErrors.email && <p className="mt-1 text-sm text-red-500">{formErrors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 bg-[#2D3748] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter password"
                    autoComplete="new-password"
                  />
                  {formErrors.password && <p className="mt-1 text-sm text-red-500">{formErrors.password}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => {
                      const newRole = e.target.value as Role;
                      setFormData({ 
                        ...formData, 
                        role: newRole,
                        // Clear managerId if role is not EMPLOYEE
                        managerId: newRole === 'EMPLOYEE' ? formData.managerId : ''
                      });
                    }}
                    className="w-full px-4 py-2 bg-[#2D3748] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {Object.keys(ROLES).map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                  {formErrors.role && <p className="mt-1 text-sm text-red-500">{formErrors.role}</p>}
                </div>
                {formData.role === 'EMPLOYEE' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Manager</label>
                    <select
                      value={formData.managerId}
                      onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                      className="w-full px-4 py-2 bg-[#2D3748] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select a manager</option>
                      {users
                        .filter(user => user.role === 'MANAGER')
                        .map(manager => (
                          <option key={manager.id} value={manager.id}>
                            {manager.name}
                          </option>
                        ))}
                    </select>
                    {formErrors.managerId && <p className="mt-1 text-sm text-red-500">{formErrors.managerId}</p>}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                    className="w-full px-4 py-2 bg-[#2D3748] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                  >
                    Create User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#1E2028] p-6 rounded-xl w-full max-w-md">
              <h2 className="text-xl font-bold text-white mb-4">Edit User</h2>
              <form onSubmit={handleEditUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-[#2D3748] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {formErrors.name && <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 bg-[#2D3748] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {formErrors.email && <p className="mt-1 text-sm text-red-500">{formErrors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Password (leave blank to keep current)</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 bg-[#2D3748] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {formErrors.password && <p className="mt-1 text-sm text-red-500">{formErrors.password}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => {
                      const newRole = e.target.value as Role;
                      setFormData({ 
                        ...formData, 
                        role: newRole,
                        // Clear managerId if role is not EMPLOYEE
                        managerId: newRole === 'EMPLOYEE' ? formData.managerId : ''
                      });
                    }}
                    className="w-full px-4 py-2 bg-[#2D3748] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {Object.keys(ROLES).map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                  {formErrors.role && <p className="mt-1 text-sm text-red-500">{formErrors.role}</p>}
                </div>
                {formData.role === 'EMPLOYEE' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Manager</label>
                    <select
                      value={formData.managerId}
                      onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                      className="w-full px-4 py-2 bg-[#2D3748] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select a manager</option>
                      {users
                        .filter(user => user.role === 'MANAGER' && user.id !== selectedUser?.id)
                        .map(manager => (
                          <option key={manager.id} value={manager.id}>
                            {manager.name}
                          </option>
                        ))}
                    </select>
                    {formErrors.managerId && <p className="mt-1 text-sm text-red-500">{formErrors.managerId}</p>}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                    className="w-full px-4 py-2 bg-[#2D3748] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                  >
                    Update User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Change Password Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#1E2028] p-6 rounded-xl w-full max-w-md">
              <h2 className="text-xl font-bold text-white mb-4">Change Password</h2>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Current Password</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="w-full px-4 py-2 bg-[#2D3748] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {formErrors.currentPassword && <p className="mt-1 text-sm text-red-500">{formErrors.currentPassword}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">New Password</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full px-4 py-2 bg-[#2D3748] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {formErrors.newPassword && <p className="mt-1 text-sm text-red-500">{formErrors.newPassword}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full px-4 py-2 bg-[#2D3748] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {formErrors.confirmPassword && <p className="mt-1 text-sm text-red-500">{formErrors.confirmPassword}</p>}
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                  >
                    Change Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#1E2028] p-6 rounded-xl w-full max-w-md">
              <h2 className="text-xl font-bold text-white mb-4">Confirm Delete</h2>
              <p className="text-gray-400 mb-6">Are you sure you want to delete this user? This action cannot be undone.</p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => userToDelete && handleDeleteUser(userToDelete)}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* User Details Modal */}
        {showDetailModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#1E2028] rounded-xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 rounded-lg">
                    <BsPersonBadge className="w-6 h-6 text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">User Details</h3>
                </div>
                <button
                  onClick={() => {
                    console.log('Closing details modal');
                    setShowDetailModal(false);
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <BsX className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center">
                    <span className="text-2xl text-indigo-400 font-medium">{selectedUser.name?.[0] || '?'}</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">{selectedUser.name || 'No name'}</h4>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-gray-400">
                    <BsEnvelope className="w-5 h-5" />
                    <span>{selectedUser.email || 'No email'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <BsShield className="w-5 h-5" />
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      selectedUser.role === 'ADMIN' ? 'bg-purple-500/10 text-purple-400' :
                      selectedUser.role === 'MANAGER' ? 'bg-blue-500/10 text-blue-400' :
                      'bg-green-500/10 text-green-400'
                    }`}>
                      {selectedUser.role || 'No role'}
                    </span>
                  </div>
                </div>
                {selectedUser.manager && (
                  <div className="pt-4 border-t border-gray-700">
                    <h5 className="text-sm font-medium text-gray-400 mb-2">Manager</h5>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <span className="text-blue-400 text-sm">{selectedUser.manager.name?.[0] || '?'}</span>
                      </div>
                      <div>
                        <div className="text-white text-sm">{selectedUser.manager.name || 'No manager name'}</div>
                        <div className="text-gray-400 text-xs">{selectedUser.manager.email || 'No manager email'}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 
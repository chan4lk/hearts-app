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
}

export default function UserManagement() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'EMPLOYEE',
    managerId: ''
  });
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filters, setFilters] = useState({
    role: '',
    manager: '',
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
      const response = await fetch('/api/users', {
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
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create user');
      }

      const newUser = await response.json();
      setUsers([newUser, ...users]);
      setShowCreateModal(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'EMPLOYEE',
        managerId: ''
      });
      toast.success('User created successfully');
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user');
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update user');
      }

      const updatedUser = await response.json();
      setUsers(users.map(user => 
        user.id === updatedUser.id ? updatedUser : user
      ));
      setShowEditModal(false);
      setSelectedUser(null);
      toast.success('User updated successfully');
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete user');
      }

      setUsers(users.filter(user => user.id !== userId));
      setShowDeleteModal(false);
      setUserToDelete(null);
      
      toast.success('User deleted successfully', {
        position: 'top-center',
        duration: 3000,
        style: {
          background: '#1E2028',
          color: '#fff',
          border: '1px solid #2D3748',
          padding: '16px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        },
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete user', {
        position: 'top-center',
        duration: 3000,
        style: {
          background: '#1E2028',
          color: '#fff',
          border: '1px solid #2D3748',
          padding: '16px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        },
      });
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
      role: user.role,
      managerId: user.manager?.id || ''
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
    
    return matchesSearch && matchesRole && matchesManager;
  });

  const handleViewDetails = (user: User) => {
    console.log('Viewing user details:', user);
    setSelectedUser(user);
    setShowDetailModal(true);
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
              onClick={() => setShowCreateModal(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-indigo-700 transition-colors"
            >
              <BsPlus className="text-xl" />
              Add User
            </button>
          </div>
        </div>

        {/* Enhanced Search and Filter Section */}
        <div className="bg-[#1E2028] p-6 rounded-xl shadow-lg">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <BsSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#252832] border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Role</label>
                <select
                  value={filters.role}
                  onChange={(e) => handleFilterChange('role', e.target.value)}
                  className="w-full px-4 py-2 bg-[#252832] border border-gray-700 rounded-md text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">All Roles</option>
                  <option value="ADMIN">Admin</option>
                  <option value="MANAGER">Manager</option>
                  <option value="EMPLOYEE">Employee</option>
                </select>
              </div>
              
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-[#1E2028] rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-[#252832]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Manager</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-[#1E2028] divide-y divide-gray-700">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-[#252832] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center mr-3">
                          <span className="text-indigo-400 font-medium">{user.name[0]}</span>
                        </div>
                        <div>
                          <div className="text-white font-medium">{user.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-white">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        user.role === 'ADMIN' ? 'bg-purple-500/10 text-purple-400' :
                        user.role === 'MANAGER' ? 'bg-blue-500/10 text-blue-400' :
                        'bg-green-500/10 text-green-400'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-white">
                      {user.manager ? user.manager.name : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDetails(user)}
                          className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-md transition-colors"
                          title="View Details"
                        >
                          <BsEye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditClick(user)}
                          className="p-2 text-gray-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-md transition-colors"
                          title="Edit User"
                        >
                          <BsPencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => confirmDelete(user.id)}
                          className="p-2 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                          title="Delete User"
                        >
                          <BsTrash className="w-4 h-4" />
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#1E2028] rounded-xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 rounded-lg">
                    <BsPlus className="w-6 h-6 text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Create New User</h3>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <BsX className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-[#252832] border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 bg-[#252832] border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 bg-[#252832] border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-2 bg-[#252832] border border-gray-700 rounded-md text-white focus:outline-none focus:border-indigo-500"
                    required
                  >
                    <option value="EMPLOYEE">Employee</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 bg-[#252832] text-gray-400 rounded-md hover:bg-[#2d2f36] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#1E2028] rounded-xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 rounded-lg">
                    <BsPencil className="w-6 h-6 text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Edit User</h3>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <BsX className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleEditUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-[#252832] border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 bg-[#252832] border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Password (leave blank to keep current)</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 bg-[#252832] border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-2 bg-[#252832] border border-gray-700 rounded-md text-white focus:outline-none focus:border-indigo-500"
                    required
                  >
                    <option value="EMPLOYEE">Employee</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 bg-[#252832] text-gray-400 rounded-md hover:bg-[#2d2f36] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    Update User
                  </button>
                </div>
              </form>
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

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#1E2028] rounded-xl p-6 w-full max-w-md mx-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <BsTrash className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Delete User</h3>
              </div>
              <p className="text-gray-400 mb-6">Are you sure you want to delete this user? This action cannot be undone.</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setUserToDelete(null);
                  }}
                  className="px-4 py-2 bg-[#252832] text-gray-400 rounded-md hover:bg-[#2d2f36] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => userToDelete && handleDeleteUser(userToDelete)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 
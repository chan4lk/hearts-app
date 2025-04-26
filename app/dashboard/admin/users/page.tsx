'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { BsPlus, BsPencil, BsTrash, BsEye, BsEyeSlash, BsX, BsSearch, BsFilter, BsPeople, BsCalendar, BsEnvelope, BsBuilding, BsPersonBadge, BsShield, BsCheckCircle, BsXCircle } from 'react-icons/bs';
import { Toaster, toast } from 'react-hot-toast';
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

  return (
    <DashboardLayout type="admin">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1E2028',
            color: '#fff',
            border: '1px solid #2D3748',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
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
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <button
            onClick={() => {
              setSelectedUser(null);
              setIsFormOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <BsPlus className="w-5 h-5" />
            Add User
          </button>
        </div>

        <UserFilters
          onFilterChange={setFilters}
          onSearch={setSearchTerm}
        />

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

        {isFormOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#1E2028] rounded-xl shadow-lg w-full max-w-2xl mx-4 p-6">
              <h2 className="text-xl font-semibold text-white mb-6">
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
          </div>
        )}

        {isDetailsOpen && selectedUser && (
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
        )}

        {isDeleteConfirmOpen && userToDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#1E2028] rounded-xl shadow-lg w-full max-w-md mx-4 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Delete User</h2>
              <p className="text-gray-300 mb-6">
                Are you sure you want to delete {userToDelete.name}? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => {
                    setIsDeleteConfirmOpen(false);
                    setUserToDelete(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-300 bg-[#2D3748] rounded-lg hover:bg-[#4A5568] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
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
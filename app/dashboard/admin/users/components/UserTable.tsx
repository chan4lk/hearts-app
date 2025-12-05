'use client';

import { useState, useMemo } from 'react';
import { BsTrash, BsPencil, BsPerson, BsEye, BsGear, BsArrowUp, BsArrowDown, BsArrowsExpand } from 'react-icons/bs';
import { User } from '@/app/components/shared/types';
import { Role } from '.prisma/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { showToast } from '@/app/utils/toast';

interface UserTableProps {
  users: User[];
  onViewDetailsAction: (user: User) => void;
  onEditAction: (user: User) => void;
  onDeleteAction: (userId: string) => void;
  onRoleUpdate?: (userId: string, newRole: string, updatedUser: User) => void;
  onStatusUpdate?: (userId: string, newStatus: string, updatedUser: User) => void;
}

type SortColumn = 'name' | 'email' | 'role' | 'status' | 'manager';
type SortDirection = 'asc' | 'desc' | null;

export default function UserTable({ 
  users, 
  onViewDetailsAction, 
  onEditAction, 
  onDeleteAction,
  onRoleUpdate,
  onStatusUpdate 
}: UserTableProps) {
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Get role config for dropdown styling
  const getRoleConfig = (role: string | undefined) => {
    const configs: Record<string, { bg: string; text: string }> = {
      ADMIN: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
      MANAGER: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
      EMPLOYEE: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' }
    };
    return configs[role || 'EMPLOYEE'] || configs.EMPLOYEE;
  };

  // Get status config for dropdown styling
  const getStatusConfig = (status: string | undefined) => {
    const configs: Record<string, { bg: string; text: string }> = {
      ACTIVE: { bg: 'bg-green-500/20', text: 'text-green-400' },
      INACTIVE: { bg: 'bg-red-500/20', text: 'text-red-400' }
    };
    return configs[status || 'ACTIVE'] || configs.ACTIVE;
  };

  // Handle quick role update
  const handleQuickRoleUpdate = async (userId: string, newRole: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    const user = users.find(u => u.id === userId);
    if (!user || user.role === newRole) return;

    setUpdatingRole(userId);
    
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userId,
          name: user.name,
          email: user.email,
          role: newRole as Role,
          managerId: user.manager?.id || null,
          isActive: user.status === 'ACTIVE'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update role');
      }

      const updatedUser = await response.json();
      
      // Transform to match User type
      const transformedUser: User = {
        ...updatedUser,
        status: updatedUser.isActive ? 'ACTIVE' : 'INACTIVE',
        manager: updatedUser.manager || null
      };

      // Notify parent component
      if (onRoleUpdate) {
        onRoleUpdate(userId, newRole, transformedUser);
      }
      
      showToast.success('Role Updated!', `User role has been updated to ${newRole}`);
    } catch (error) {
      console.error('Error updating role:', error);
      showToast.error('Error', error instanceof Error ? error.message : 'Failed to update role');
    } finally {
      setUpdatingRole(null);
    }
  };

  // Handle quick status update
  const handleQuickStatusUpdate = async (userId: string, newStatus: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    const user = users.find(u => u.id === userId);
    if (!user || user.status === newStatus) return;

    setUpdatingStatus(userId);
    
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userId,
          name: user.name,
          email: user.email,
          role: user.role as Role,
          managerId: user.manager?.id || null,
          isActive: newStatus === 'ACTIVE'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update status');
      }

      const updatedUser = await response.json();
      
      // Transform to match User type
      const transformedUser: User = {
        ...updatedUser,
        status: updatedUser.isActive ? 'ACTIVE' : 'INACTIVE',
        manager: updatedUser.manager || null
      };

      // Notify parent component
      if (onStatusUpdate) {
        onStatusUpdate(userId, newStatus, transformedUser);
      }
      
      showToast.success('Status Updated!', `User status has been updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      showToast.error('Error', error instanceof Error ? error.message : 'Failed to update status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Handle column sorting
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Sort users based on current sort column and direction
  const sortedUsers = useMemo(() => {
    if (!sortColumn || !sortDirection) {
      return users;
    }

    return [...users].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortColumn) {
        case 'name':
          aValue = a.name?.toLowerCase() || '';
          bValue = b.name?.toLowerCase() || '';
          break;
        case 'email':
          aValue = a.email?.toLowerCase() || '';
          bValue = b.email?.toLowerCase() || '';
          break;
        case 'role':
          aValue = a.role || '';
          bValue = b.role || '';
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        case 'manager':
          aValue = a.manager?.name?.toLowerCase() || 'zzz'; // Unassigned at the end
          bValue = b.manager?.name?.toLowerCase() || 'zzz';
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [users, sortColumn, sortDirection]);

  // Get sort icon for a column
  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <BsArrowsExpand className="w-3 h-3 text-gray-500 opacity-50" />;
    }
    if (sortDirection === 'asc') {
      return <BsArrowUp className="w-3 h-3 text-indigo-400" />;
    }
    if (sortDirection === 'desc') {
      return <BsArrowDown className="w-3 h-3 text-indigo-400" />;
    }
    return <BsArrowsExpand className="w-3 h-3 text-gray-500 opacity-50" />;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/10">
            <th 
              className="text-left py-3 px-4 text-sm font-semibold text-gray-300 cursor-pointer hover:bg-white/5 transition-colors select-none"
              onClick={() => handleSort('name')}
            >
              <div className="flex items-center gap-2">
                <span>Name</span>
                {getSortIcon('name')}
              </div>
            </th>
            <th 
              className="text-left py-3 px-4 text-sm font-semibold text-gray-300 cursor-pointer hover:bg-white/5 transition-colors select-none"
              onClick={() => handleSort('email')}
            >
              <div className="flex items-center gap-2">
                <span>Email</span>
                {getSortIcon('email')}
              </div>
            </th>
            <th 
              className="text-left py-3 px-4 text-sm font-semibold text-gray-300 cursor-pointer hover:bg-white/5 transition-colors select-none"
              onClick={() => handleSort('role')}
            >
              <div className="flex items-center gap-2">
                <span>Role</span>
                {getSortIcon('role')}
              </div>
            </th>
            <th 
              className="text-left py-3 px-4 text-sm font-semibold text-gray-300 cursor-pointer hover:bg-white/5 transition-colors select-none"
              onClick={() => handleSort('status')}
            >
              <div className="flex items-center gap-2">
                <span>Status</span>
                {getSortIcon('status')}
              </div>
            </th>
            <th 
              className="text-left py-3 px-4 text-sm font-semibold text-gray-300 cursor-pointer hover:bg-white/5 transition-colors select-none"
              onClick={() => handleSort('manager')}
            >
              <div className="flex items-center gap-2">
                <span>Manager</span>
                {getSortIcon('manager')}
              </div>
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-12 text-center text-gray-400">
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="relative mb-4">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-xl"></div>
                    <div className="relative w-16 h-16 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full flex items-center justify-center border-2 border-indigo-500/30">
                      <BsPerson className="w-8 h-8 text-indigo-400" />
                    </div>
                  </div>
                  <p className="text-lg font-medium text-gray-300 mb-1">No users found</p>
                  <p className="text-sm text-gray-500">Try adjusting your filters to see more results</p>
                </div>
              </td>
            </tr>
          ) : (
            sortedUsers.map((user) => {
              const roleConfig = getRoleConfig(user.role);
              const statusConfig = getStatusConfig(user.status);
              
              return (
                <tr
                  key={user.id}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() => onViewDetailsAction(user)}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        user.role === Role.ADMIN ? 'bg-purple-500/20 text-purple-400' :
                        user.role === Role.MANAGER ? 'bg-blue-500/20 text-blue-400' :
                        'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        <BsPerson className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{user.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-300">
                    {user.email}
                  </td>
                  <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={user.role || 'EMPLOYEE'}
                      onValueChange={(newRole) => handleQuickRoleUpdate(user.id, newRole)}
                      disabled={updatingRole === user.id}
                    >
                      <SelectTrigger className={`${roleConfig.bg} ${roleConfig.text} border border-white/20 text-xs px-3 py-1.5 h-auto hover:opacity-90 hover:border-white/30 transition-all cursor-pointer min-w-[130px] font-medium`}>
                        <SelectValue>{user.role || 'EMPLOYEE'}</SelectValue>
                        <BsGear className="w-3 h-3 ml-auto opacity-50 rotate-90" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700 z-50" onClick={(e) => e.stopPropagation()}>
                        <SelectItem value="ADMIN" className="hover:bg-gray-700 cursor-pointer">
                          <span className="text-purple-400">Admin</span>
                        </SelectItem>
                        <SelectItem value="MANAGER" className="hover:bg-gray-700 cursor-pointer">
                          <span className="text-blue-400">Manager</span>
                        </SelectItem>
                        <SelectItem value="EMPLOYEE" className="hover:bg-gray-700 cursor-pointer">
                          <span className="text-emerald-400">Employee</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={user.status || 'ACTIVE'}
                      onValueChange={(newStatus) => handleQuickStatusUpdate(user.id, newStatus)}
                      disabled={updatingStatus === user.id}
                    >
                      <SelectTrigger className={`${statusConfig.bg} ${statusConfig.text} border border-white/20 text-xs px-3 py-1.5 h-auto hover:opacity-90 hover:border-white/30 transition-all cursor-pointer min-w-[120px] font-medium`}>
                        <SelectValue>{user.status || 'ACTIVE'}</SelectValue>
                        <BsGear className="w-3 h-3 ml-auto opacity-50 rotate-90" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700 z-50" onClick={(e) => e.stopPropagation()}>
                        <SelectItem value="ACTIVE" className="hover:bg-gray-700 cursor-pointer">
                          <span className="text-green-400">Active</span>
                        </SelectItem>
                        <SelectItem value="INACTIVE" className="hover:bg-gray-700 cursor-pointer">
                          <span className="text-red-400">Inactive</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-300">
                    {user.manager?.name || 'Unassigned'}
                  </td>
                  <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onViewDetailsAction(user)}
                        className="p-1.5 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded transition-colors"
                        title="View Details"
                      >
                        <BsEye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEditAction(user)}
                        className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded transition-colors"
                        title="Edit User"
                      >
                        <BsPencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteAction(user.id)}
                        className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded transition-colors"
                        title="Delete User"
                      >
                        <BsTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

'use client';

import { useState, useMemo } from 'react';
import { BsPerson, BsGear, BsChevronDown } from 'react-icons/bs';
import { TABLE_STYLES, useTableSelection, SortIcon, SelectionBanner, CheckboxHeader, CheckboxCell, TableEmptyState } from '@/app/components/ui/table-primitives';
import { User } from '@/app/components/shared/types';
import { Role } from '.prisma/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import ManagerSelector from './ManagerSelector';

interface UserTableProps {
  users: User[];
  managers: User[];
  onRoleUpdate?: (userId: string, newRole: string, updatedUser: User) => void;
  onStatusUpdate?: (userId: string, newStatus: string, updatedUser: User) => void;
  onManagerUpdate?: (userId: string, newManagerId: string | null, updatedUser: User) => void;
  onDeleteAction?: (userId: string) => void;
  onBulkDelete?: (ids: string[]) => void;
}

type SortColumn = 'name' | 'email' | 'role' | 'status' | 'manager';
type SortDirection = 'asc' | 'desc' | null;

export default function UserTable({ 
  users, 
  managers,
  onRoleUpdate,
  onStatusUpdate,
  onManagerUpdate,
  onDeleteAction,
  onBulkDelete
}: UserTableProps) {
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [updatingManager, setUpdatingManager] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [managerSelectorOpen, setManagerSelectorOpen] = useState<string | null>(null);
  const { selectedIds, toggleSelect, toggleSelectAll, clearSelection, isAllSelected, isPartialSelected } = useTableSelection(users);

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
      
      // Toast removed
    } catch (error) { // handled silently
      // Toast removed
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
      
      // Toast removed
    } catch (error) { // handled silently
      // Error toast removed
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Handle quick manager update
  const handleQuickManagerUpdate = async (userId: string, newManagerId: string | null, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    // Don't update if it's the same manager
    if ((!user.manager && !newManagerId) || (user.manager?.id === newManagerId)) {
      return;
    }

    setUpdatingManager(userId);
    
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userId,
          name: user.name,
          email: user.email,
          role: user.role as Role,
          managerId: newManagerId,
          isActive: user.status === 'ACTIVE'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update manager');
      }

      const updatedUser = await response.json();
      
      // Transform to match User type
      const transformedUser: User = {
        ...updatedUser,
        status: updatedUser.isActive ? 'ACTIVE' : 'INACTIVE',
        manager: updatedUser.manager || null
      };

      // Notify parent component
      if (onManagerUpdate) {
        onManagerUpdate(userId, newManagerId, transformedUser);
      }
      
      // Manager updated successfully - notification removed
    } catch (error) { // handled silently
      // Error toast removed
    } finally {
      setUpdatingManager(null);
      setManagerSelectorOpen(null);
    }
  };

  // Handle opening manager selector
  const handleOpenManagerSelector = (userId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setManagerSelectorOpen(userId);
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

  return (
    <div className="relative flex flex-col flex-1 overflow-hidden min-h-0 gap-2">
      <SelectionBanner
        count={selectedIds.size}
        onBulkDelete={onBulkDelete ? () => onBulkDelete(Array.from(selectedIds)) : undefined}
        onClear={clearSelection}
      />

      {/* Table Container with Fixed Header */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
          <table className="w-full table-fixed min-w-full">
            <thead className={TABLE_STYLES.thead}>
              <tr>
                <CheckboxHeader isAllSelected={isAllSelected} isPartialSelected={isPartialSelected} onToggle={toggleSelectAll} />
                <th
                  className={TABLE_STYLES.thSortable}
                  style={{ width: '18%' }}
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Name</span>
                    <SortIcon column="name" sortKey={sortColumn} sortDir={sortDirection} />
                  </div>
                </th>
                <th
                  className={TABLE_STYLES.thSortable}
                  style={{ width: '25%' }}
                  onClick={() => handleSort('email')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Email</span>
                    <SortIcon column="email" sortKey={sortColumn} sortDir={sortDirection} />
                  </div>
                </th>
                <th
                  className={TABLE_STYLES.thSortable}
                  style={{ width: '12%' }}
                  onClick={() => handleSort('role')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Role</span>
                    <SortIcon column="role" sortKey={sortColumn} sortDir={sortDirection} />
                  </div>
                </th>
                <th
                  className={TABLE_STYLES.thSortable}
                  style={{ width: '12%' }}
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Status</span>
                    <SortIcon column="status" sortKey={sortColumn} sortDir={sortDirection} />
                  </div>
                </th>
                <th
                  className={TABLE_STYLES.thSortable}
                  style={{ width: '18%' }}
                  onClick={() => handleSort('manager')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Manager</span>
                    <SortIcon column="manager" sortKey={sortColumn} sortDir={sortDirection} />
                  </div>
                </th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <TableEmptyState colSpan={6} icon={<BsPerson className="w-5 h-5 text-secondary" />} title="No users found" subtitle="Try adjusting your filters to see more results" />
          ) : (
            sortedUsers.map((user) => {
              const roleConfig = getRoleConfig(user.role);
              const statusConfig = getStatusConfig(user.status);
              
              return (
                <tr
                  key={user.id}
                  className={`border-b border-theme hover:bg-surface-secondary/50 transition-colors ${selectedIds.has(user.id) ? 'bg-indigo-500/5' : ''}`}
                >
                  <CheckboxCell checked={selectedIds.has(user.id)} onToggle={() => toggleSelect(user.id)} />
                  <td className="py-2.5 px-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                        user.role === Role.ADMIN ? 'bg-purple-500/20 text-purple-400' :
                        user.role === Role.MANAGER ? 'bg-blue-500/20 text-blue-400' :
                        'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        <BsPerson className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-xs font-medium text-primary truncate">{user.name}</div>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-xs text-secondary truncate">
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
                      <SelectContent className="bg-surface-elevated border-theme z-50" onClick={(e) => e.stopPropagation()}>
                        <SelectItem value="ADMIN" className="hover:bg-surface-secondary cursor-pointer">
                          <span className="text-purple-400">Admin</span>
                        </SelectItem>
                        <SelectItem value="MANAGER" className="hover:bg-surface-secondary cursor-pointer">
                          <span className="text-blue-400">Manager</span>
                        </SelectItem>
                        <SelectItem value="EMPLOYEE" className="hover:bg-surface-secondary cursor-pointer">
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
                      <SelectContent className="bg-surface-elevated border-theme z-50" onClick={(e) => e.stopPropagation()}>
                        <SelectItem value="ACTIVE" className="hover:bg-surface-secondary cursor-pointer">
                          <span className="text-green-400">Active</span>
                        </SelectItem>
                        <SelectItem value="INACTIVE" className="hover:bg-surface-secondary cursor-pointer">
                          <span className="text-red-400">Inactive</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleOpenManagerSelector(user.id)}
                      disabled={updatingManager === user.id}
                      className="bg-blue-500/10 text-blue-400 border border-white/20 text-xs px-3 py-1.5 h-auto hover:opacity-90 hover:border-white/30 transition-all cursor-pointer min-w-[150px] font-medium rounded-md flex items-center justify-between gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="truncate">
                        {updatingManager === user.id ? 'Updating...' : (user.manager?.name || 'Unassigned')}
                      </span>
                      <BsChevronDown className="w-3 h-3 opacity-50 flex-shrink-0" />
                    </button>
                    
                    {/* Manager Selector Modal */}
                    {managerSelectorOpen === user.id && (
                      <ManagerSelector
                        currentManager={user.manager ?? null}
                        userId={user.id}
                        userName={user.name}
                        onSelect={(managerId) => handleQuickManagerUpdate(user.id, managerId)}
                        onClose={() => setManagerSelectorOpen(null)}
                        isLoading={updatingManager === user.id}
                      />
                    )}
                  </td>
                </tr>
              );
            })
          )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

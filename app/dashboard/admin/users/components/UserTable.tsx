'use client';

import { BsEye, BsPencil, BsTrash } from 'react-icons/bs';
import { User } from '../types';

interface UserTableProps {
  users: User[];
  onViewDetails: (user: User) => void;
  onEdit: (user: User) => void;
  onDelete: (userId: string) => void;
}

export default function UserTable({ users, onViewDetails, onEdit, onDelete }: UserTableProps) {
  return (
    <div className="bg-white/5 rounded-md overflow-hidden border border-white/5 dark:border-gray-800/30">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100/5 backdrop-blur-sm">
              <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-400 uppercase tracking-wider">Name</th>
              <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-400 uppercase tracking-wider">Email</th>
              <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-400 uppercase tracking-wider">Role</th>
              <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-400 uppercase tracking-wider">Manager</th>
              <th className="px-3 py-2 text-left text-[10px] font-medium text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100/10">
            {users.map((user) => (
              <tr 
                key={user.id} 
                className="group hover:bg-gray-100/5 transition-colors duration-150"
              >
                <td className="px-3 py-2 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-7 w-7 rounded bg-gray-100/10 flex items-center justify-center text-gray-400 text-xs font-medium">
                      {user.name.charAt(0)}
                    </div>
                    <div className="ml-2">
                      <div className="text-sm text-gray-300">{user.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-400">{user.email}</td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                    user.role === 'ADMIN' ? 'bg-purple-500/10 text-purple-400' :
                    user.role === 'MANAGER' ? 'bg-blue-500/10 text-blue-400' :
                    'bg-gray-500/10 text-gray-400'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                    user.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                  }`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-400">
                  {user.manager?.name || '-'}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <div className="flex items-center gap-1 transition-colors duration-150">
                    <button
                      onClick={() => onViewDetails(user)}
                      className="p-1 text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                      title="View Details"
                    >
                      <BsEye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onEdit(user)}
                      className="p-1 text-yellow-400 hover:bg-yellow-500/10 rounded transition-colors"
                      title="Edit User"
                    >
                      <BsPencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(user.id)}
                      className="p-1 text-red-400 hover:bg-red-500/10 rounded transition-colors"
                      title="Delete User"
                    >
                      <BsTrash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
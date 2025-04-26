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
    <div className="bg-[#1E2028] rounded-xl shadow-lg overflow-hidden border border-[#2D3748]">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[#2D3748]/50 backdrop-blur-sm">
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Role</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Manager</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2D3748]/50">
            {users.map((user) => (
              <tr 
                key={user.id} 
                className="group hover:bg-[#2D3748]/30 transition-all duration-200"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-[#2D3748] flex items-center justify-center text-white font-medium">
                      {user.name.charAt(0)}
                    </div>
                    <div className="ml-4">
                      <div className="text-white font-medium">{user.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-300">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    user.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-400' :
                    user.role === 'MANAGER' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    user.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                  {user.manager?.name || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => onViewDetails(user)}
                      className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all duration-200 hover:scale-110"
                      title="View Details"
                    >
                      <BsEye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => onEdit(user)}
                      className="p-2 text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-all duration-200 hover:scale-110"
                      title="Edit User"
                    >
                      <BsPencil className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => onDelete(user.id)}
                      className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200 hover:scale-110"
                      title="Delete User"
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
  );
}
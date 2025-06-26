'use client';

import { BsTrash, BsPerson } from 'react-icons/bs';
import { User } from '../types';

interface UserTableProps {
  users: User[];
  onViewDetails: (user: User) => void;
  onEdit: (user: User) => void;
  onDelete: (userId: string) => void;
}

export default function UserTable({ users, onViewDetails, onEdit, onDelete }: UserTableProps) {
  const getRoleStyles = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'from-purple-500/20 to-purple-600/20 hover:from-purple-500/30 hover:to-purple-600/30 border-purple-500/20';
      case 'MANAGER':
        return 'from-blue-500/20 to-blue-600/20 hover:from-blue-500/30 hover:to-blue-600/30 border-blue-500/20';
      default:
        return 'from-emerald-500/20 to-emerald-600/20 hover:from-emerald-500/30 hover:to-emerald-600/30 border-emerald-500/20';
    }
  };

  const getIconStyles = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'text-purple-300 bg-purple-500/10';
      case 'MANAGER':
        return 'text-blue-300 bg-blue-500/10';
      default:
        return 'text-emerald-300 bg-emerald-500/10';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-7xl mx-auto">
      {users.map((user) => (
        <div 
          key={user.id}
          className={`
            relative group h-[120px] p-4 rounded-lg border cursor-pointer
            bg-gradient-to-br backdrop-blur-sm transition-all duration-300
            hover:shadow-lg hover:shadow-black/5
            ${getRoleStyles(user.role)}
          `}
          onClick={() => onViewDetails(user)}
        >
          <div className="flex items-start gap-3 h-full">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ring-1 ring-white/10 flex-shrink-0 ${getIconStyles(user.role)}`}>
              <BsPerson className="w-6 h-6" />
            </div>
            
            <div className="flex flex-col h-full flex-grow min-w-0 justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-100 truncate group-hover:text-white transition-colors">
                  {user.name}
                </h3>
                <p className="text-xs text-gray-400 truncate mt-0.5">{user.email}</p>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    user.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-300' :
                    user.role === 'MANAGER' ? 'bg-blue-500/20 text-blue-300' :
                    'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {user.role}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    user.status === 'ACTIVE' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                  }`}>
                    {user.status}
                  </span>
                </div>

                {user.manager && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-gray-400">Manager:</span>
                    <span className="text-gray-300 truncate">{user.manager.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(user.id);
            }}
            className="absolute top-2 right-2 p-1.5 text-red-300 hover:bg-red-500/20 rounded transition-colors opacity-0 group-hover:opacity-100"
            title="Delete User"
          >
            <BsTrash className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
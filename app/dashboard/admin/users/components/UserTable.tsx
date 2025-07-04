'use client';

import { BsTrash, BsPerson } from 'react-icons/bs';
import { User } from '@/app/components/shared/types';
import { Role } from '.prisma/client';

interface UserTableProps {
  users: User[];
  onViewDetailsAction: (user: User) => void;
  onEditAction: (user: User) => void;
  onDeleteAction: (userId: string) => void;
}

export default function UserTable({ users, onViewDetailsAction, onEditAction, onDeleteAction }: UserTableProps) {
  const getRoleStyles = (role: string | undefined) => {
    switch (role) {
      case Role.ADMIN:
        return 'from-purple-500/20 to-purple-600/20 hover:from-purple-500/30 hover:to-purple-600/30 border-purple-500/20';
      case Role.MANAGER:
        return 'from-blue-500/20 to-blue-600/20 hover:from-blue-500/30 hover:to-blue-600/30 border-blue-500/20';
      default:
        return 'from-emerald-500/20 to-emerald-600/20 hover:from-emerald-500/30 hover:to-emerald-600/30 border-emerald-500/20';
    }
  };

  const getIconStyles = (role: string | undefined) => {
    switch (role) {
      case Role.ADMIN:
        return 'text-purple-300 bg-purple-500/10';
      case Role.MANAGER:
        return 'text-blue-300 bg-blue-500/10';
      default:
        return 'text-emerald-300 bg-emerald-500/10';
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 max-w-7xl mx-auto px-1 sm:px-0">
      {users.map((user) => (
        <div 
          key={user.id}
          className={`
            relative group min-h-[130px] sm:min-h-[120px] p-3 sm:p-4 rounded-lg border cursor-pointer
            bg-gradient-to-br backdrop-blur-sm transition-all duration-300
            hover:shadow-lg hover:shadow-black/5 active:scale-[0.99]
            ${getRoleStyles(user.role)}
          `}
          onClick={() => onViewDetailsAction(user)}
        >
          <div className="flex items-start gap-2 sm:gap-3 h-full">
            <div className={`h-9 w-9 sm:h-10 sm:w-10 rounded-full flex items-center justify-center ring-1 ring-white/10 flex-shrink-0 ${getIconStyles(user.role)}`}>
              <BsPerson className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            
            <div className="flex flex-col h-full flex-grow min-w-0 justify-between py-0.5">
              <div>
                <h3 className="text-[13px] sm:text-sm font-medium text-gray-100 truncate group-hover:text-white transition-colors">
                  {user.name}
                </h3>
                <p className="text-[11px] sm:text-xs text-gray-400 truncate mt-0.5">{user.email}</p>
              </div>

              <div className="flex flex-col gap-1.5 mt-2">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${
                    user.role === Role.ADMIN ? 'bg-purple-500/20 text-purple-300' :
                    user.role === Role.MANAGER ? 'bg-blue-500/20 text-blue-300' :
                    'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {user.role || Role.EMPLOYEE}
                  </span>
                  <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${
                    user.status === 'ACTIVE' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                  }`}>
                    {user.status}
                  </span>
                </div>

                {user.manager && (
                  <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs">
                    <span className="text-gray-400">Assigned Manager:</span>
                    <span className="text-gray-300 truncate">{user.manager.name}</span>
                    <span className={`ml-1 px-1 rounded text-[9px] ${
                      user.manager.role === Role.ADMIN ? 'bg-purple-500/20 text-purple-300' :
                      user.manager.role === Role.MANAGER ? 'bg-blue-500/20 text-blue-300' :
                      'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {user.manager.role || Role.EMPLOYEE}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteAction(user.id);
            }}
            className="absolute top-2 right-2 p-1.5 text-red-300 hover:bg-red-500/20 rounded transition-colors opacity-0 group-hover:opacity-100 sm:top-2.5 sm:right-2.5"
            title="Delete User"
          >
            <BsTrash className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
'use client';

import { User } from '../types';
import { BsX, BsPencil, BsEnvelope, BsPerson, BsShield, BsCheckCircle, BsXCircle, BsCalendar } from 'react-icons/bs';

interface UserDetailsProps {
  user: User;
  onClose: () => void;
  onEdit: () => void;
}

export default function UserDetails({ user, onClose, onEdit }: UserDetailsProps) {
  return (
    <div className="bg-gray-900/95 backdrop-blur-sm rounded-lg w-full max-w-lg mx-2 border border-gray-800/50 shadow-2xl">
      <div className="flex justify-between items-center px-3 py-2 border-b border-gray-800/50">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-indigo-500/10 rounded">
            <BsPerson className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <h2 className="text-sm font-medium text-gray-200">{user.name}</h2>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-300 p-0.5 hover:bg-gray-800/30 rounded"
        >
          <BsX className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-2 bg-gray-800/30 rounded hover:bg-gray-800/40 transition-colors group">
              <BsEnvelope className="w-3.5 h-3.5 text-purple-400 group-hover:text-purple-300 transition-colors" />
              <div>
                <p className="text-[10px] font-medium text-gray-500 group-hover:text-gray-400">Email</p>
                <p className="text-xs text-gray-300">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 bg-gray-800/30 rounded hover:bg-gray-800/40 transition-colors group">
              <BsShield className="w-3.5 h-3.5 text-amber-400 group-hover:text-amber-300 transition-colors" />
              <div>
                <p className="text-[10px] font-medium text-gray-500 group-hover:text-gray-400">Role</p>
                <p className="text-xs text-gray-300">{user.role}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 bg-gray-800/30 rounded hover:bg-gray-800/40 transition-colors group">
              {user.status === 'ACTIVE' ? (
                <BsCheckCircle className="w-3.5 h-3.5 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
              ) : (
                <BsXCircle className="w-3.5 h-3.5 text-red-400 group-hover:text-red-300 transition-colors" />
              )}
              <div>
                <p className="text-[10px] font-medium text-gray-500 group-hover:text-gray-400">Status</p>
                <p className={`text-xs ${
                  user.status === 'ACTIVE' ? 'text-emerald-400' : 'text-red-400'
                } group-hover:${user.status === 'ACTIVE' ? 'text-emerald-300' : 'text-red-300'}`}>
                  {user.status}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {user.manager && (
              <div className="flex items-center gap-2 p-2 bg-gray-800/30 rounded hover:bg-gray-800/40 transition-colors group">
                <BsPerson className="w-3.5 h-3.5 text-blue-400 group-hover:text-blue-300 transition-colors" />
                <div>
                  <p className="text-[10px] font-medium text-gray-500 group-hover:text-gray-400">Manager</p>
                  <p className="text-xs text-gray-300">{user.manager.name}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 p-2 bg-gray-800/30 rounded hover:bg-gray-800/40 transition-colors group">
              <BsCalendar className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-300 transition-colors" />
              <div>
                <p className="text-[10px] font-medium text-gray-500 group-hover:text-gray-400">Created</p>
                <p className="text-xs text-gray-300">
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-800/50 mt-3">
          <button
            onClick={onClose}
            className="px-2.5 py-1 text-[11px] font-medium text-gray-400 bg-gray-800/50 rounded hover:bg-gray-800/70 transition-colors"
          >
            Close
          </button>
          <button
            onClick={onEdit}
            className="px-2.5 py-1 text-[11px] font-medium text-white bg-indigo-500/80 rounded hover:bg-indigo-500 transition-colors flex items-center gap-1"
          >
            <BsPencil className="w-2.5 h-2.5" />
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}
'use client';

import { User } from '../types';
import { BsX, BsPencil, BsEnvelope, BsPerson, BsShield, BsCheckCircle, BsXCircle } from 'react-icons/bs';

interface UserDetailsProps {
  user: User;
  onClose: () => void;
  onEdit: () => void;
}

export default function UserDetails({ user, onClose, onEdit }: UserDetailsProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1E2028] rounded-xl shadow-lg w-full max-w-2xl mx-4">
        <div className="flex justify-between items-center p-6 border-b border-[#2D3748]">
          <h2 className="text-xl font-semibold text-white">User Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <BsX className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <BsPerson className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Name</p>
                  <p className="text-white font-medium">{user.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <BsEnvelope className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Email</p>
                  <p className="text-white font-medium">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <BsShield className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Role</p>
                  <p className="text-white font-medium">{user.role}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  {user.status === 'ACTIVE' ? (
                    <BsCheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <BsXCircle className="w-5 h-5 text-red-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-400">Status</p>
                  <p className={`font-medium ${
                    user.status === 'ACTIVE' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {user.status}
                  </p>
                </div>
              </div>

              {user.manager && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <BsPerson className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Manager</p>
                    <p className="text-white font-medium">{user.manager.name}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-500/20 rounded-lg">
                  <BsPerson className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Created At</p>
                  <p className="text-white font-medium">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-[#2D3748]">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-300 bg-[#2D3748] rounded-lg hover:bg-[#4A5568] transition-colors"
            >
              Close
            </button>
            <button
              onClick={onEdit}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <BsPencil className="w-4 h-4" />
              Edit User
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
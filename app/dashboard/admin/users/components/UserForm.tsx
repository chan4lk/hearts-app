'use client';

import { useState, useEffect, useRef } from 'react';
import { User, FormData } from '../types';
import { Role } from '@prisma/client';
import { BsArrowCounterclockwise, BsEye, BsShield, BsPerson, BsEnvelope, BsLock, BsPersonBadge, BsPersonCheck, BsToggleOn, BsToggleOff } from 'react-icons/bs';
import { motion } from 'framer-motion';

interface UserFormProps {
  initialData?: User;
  managers: User[];
  onSubmit: (data: FormData) => Promise<void>;
  onCancel: () => void;
  isEditing: boolean;
}

export default function UserForm({ initialData, managers, onSubmit, onCancel, isEditing }: UserFormProps) {
  const formRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState<FormData>({
    name: initialData?.name || '',
    email: initialData?.email || '',
    role: (initialData?.role as Role) || Role.EMPLOYEE,
    managerId: initialData?.manager?.id || '',
    status: initialData?.status || 'ACTIVE'
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    // Required fields
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    // Email and password validation only for new users
    if (!initialData) {
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Invalid email format';
      }

      if (!formData.password) {
        newErrors.password = 'Password is required for new users';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters long';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Always show manager field as managers can manage any user type
  const shouldShowManagerField = true;

  // Filter out the current user from available managers to prevent self-assignment
  const availableManagers = managers.filter(manager => 
    // Exclude the current user from the manager list
    (!initialData || manager.id !== initialData.id) &&
    // Only show managers and admins as potential managers
    (manager.role === Role.MANAGER || manager.role === Role.ADMIN)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      if (!initialData) {
        // For new users, include all fields
        await onSubmit(formData);
      } else {
        // For existing users, only submit name, role, managerId, and status
        await onSubmit({
          name: formData.name,
          role: formData.role,
          managerId: formData.managerId,
          status: formData.status,
          // Keep the existing email
          email: initialData.email,
        });
      }
    }
  };

  const handleRoleChange = (value: string) => {
    const newRole = value as Role;
    if (newRole === Role.ADMIN || newRole === Role.MANAGER || newRole === Role.EMPLOYEE) {
      setFormData({ ...formData, role: newRole });
    }
  };

  const getRoleIcon = (role: Role) => {
    switch (role) {
      case Role.ADMIN:
        return <BsShield className="w-4 h-4" />;
      case Role.MANAGER:
        return <BsPersonBadge className="w-4 h-4" />;
      default:
        return <BsPerson className="w-4 h-4" />;
    }
  };

  // Add click outside handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        onCancel();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onCancel]);

  return (
    <motion.div 
      ref={formRef}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      className="w-[240px] sm:w-[280px] mx-auto"
    >
      <div>
        <div className="flex items-center gap-1 mb-1.5 sm:mb-2">
          <div className="p-0.5 bg-blue-600 rounded-sm sm:rounded">
            <BsPerson className="w-3 h-3 sm:w-4 sm:h-4" />
          </div>
          <h2 className="text-xs sm:text-sm font-medium text-white">
            {initialData ? 'Edit User' : 'Create User'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-1.5 sm:space-y-2 mx-auto">
          {/* Name Field */}
          <div>
            <label className="flex items-center gap-1 mb-0.5 text-[10px] sm:text-[11px] font-medium text-gray-300">
              <BsPerson className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
              Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-2 py-1 sm:px-3 sm:py-1.5 bg-black/20 rounded-sm sm:rounded text-[11px] text-white placeholder-gray-400 ${
                errors.name ? 'border-red-500' : 'border-gray-600'
              }`}
              placeholder="Name"
            />
            {errors.name && (
              <p className="text-[10px] text-red-500 mt-0.5">{errors.name}</p>
            )}
          </div>

          {/* Email Field - Only for new users */}
          {!initialData && (
            <div>
              <label className="flex items-center gap-1 mb-0.5 text-[10px] sm:text-[11px] font-medium text-gray-300">
                <BsEnvelope className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                Email
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full px-2 py-1 sm:px-3 sm:py-1.5 bg-black/20 rounded-sm sm:rounded text-[11px] text-white placeholder-gray-400 ${
                  errors.email ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="Email"
              />
              {errors.email && (
                <p className="text-[10px] text-red-500 mt-0.5">{errors.email}</p>
              )}
            </div>
          )}

          {/* Password Field - Only for new users */}
          {!initialData && (
            <div>
              <label className="flex items-center gap-1 mb-0.5 text-[10px] sm:text-[11px] font-medium text-gray-300">
                <BsLock className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                Password
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`w-full px-2 py-1 sm:px-3 sm:py-1.5 bg-black/20 rounded-sm sm:rounded text-[11px] text-white placeholder-gray-400 ${
                  errors.password ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="Min 8 chars"
              />
              {errors.password && (
                <p className="text-[10px] text-red-500 mt-0.5">{errors.password}</p>
              )}
            </div>
          )}

          {/* Role Field */}
          <div>
            <label className="flex items-center gap-1 mb-0.5 text-[10px] sm:text-[11px] font-medium text-gray-300">
              <BsPersonBadge className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="w-full px-2 py-1 sm:px-3 sm:py-1.5 bg-black/20 rounded-sm sm:rounded text-[11px] text-white"
            >
              <option value="EMPLOYEE">👤 Employee</option>
              <option value="MANAGER">👔 Manager</option>
              <option value="ADMIN">🛡️ Admin</option>
            </select>
          </div>

          {/* Manager Field */}
          {shouldShowManagerField && (
            <div>
              <label className="flex items-center gap-1 mb-0.5 text-[10px] sm:text-[11px] font-medium text-gray-300">
                <BsPersonCheck className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                Manager
              </label>
              <select
                value={formData.managerId}
                onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                className="w-full px-2 py-1 sm:px-3 sm:py-1.5 bg-black/20 rounded-sm sm:rounded text-[11px] text-white"
              >
                <option value="">Select</option>
                {availableManagers.map((manager) => (
                  <option key={manager.id} value={manager.id}>
                    {manager.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Status Field */}
          <div>
            <label className="flex items-center gap-1 mb-0.5 text-[10px] sm:text-[11px] font-medium text-gray-300">
              <span className="text-green-500">✓</span>
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
              className="w-full px-2 py-1 sm:px-3 sm:py-1.5 bg-black/20 rounded-sm sm:rounded text-[11px] text-white"
            >
              <option value="ACTIVE">✅ Active</option>
              <option value="INACTIVE">❌ Inactive</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-1.5 sm:gap-2 mt-2 sm:mt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-3 py-1 sm:px-4 sm:py-1.5 text-[11px] font-medium text-gray-300 bg-black/20 rounded-sm sm:rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-3 py-1 sm:px-4 sm:py-1.5 text-[11px] font-medium text-white bg-blue-600 rounded-sm sm:rounded"
            >
              {initialData ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
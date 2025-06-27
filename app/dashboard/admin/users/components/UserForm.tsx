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
    password: '',
    newPassword: '',
    confirmPassword: '',
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

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Password validation for new users
    if (!initialData) {
      if (!formData.password) {
        newErrors.password = 'Password is required for new users';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters long';
      }
    }

    // Password validation for existing users
    if (initialData && formData.newPassword) {
      if (formData.newPassword.length < 8) {
        newErrors.newPassword = 'New password must be at least 8 characters long';
      }
      if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
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
      await onSubmit(formData);
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
      className="w-full max-w-[240px] min-w-[280px] sm:min-w-[240px]"
    >
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <div className="p-0.5 bg-blue-600 rounded">
            <BsPerson className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-medium text-white">
            {initialData ? 'Edit User' : 'Create User'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-2">
          {/* Name Field */}
          <div>
            <label className="flex items-center gap-2 mb-1.5 sm:mb-1 text-sm text-gray-400">
              <BsPerson className="w-4 h-4" />
              Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-3 py-2 sm:py-1.5 bg-black/20 rounded text-sm sm:text-[11px] text-white placeholder-gray-400 ${
                errors.name ? 'border-red-500' : 'border-gray-600'
              }`}
              placeholder="Name"
            />
          </div>

          {/* Email Field */}
          <div>
            <label className="flex items-center gap-2 mb-1.5 sm:mb-1 text-sm text-gray-400">
              <BsEnvelope className="w-4 h-4" />
              Email
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`w-full px-3 py-2 sm:py-1.5 bg-black/20 rounded text-sm sm:text-[11px] text-white placeholder-gray-400 ${
                errors.email ? 'border-red-500' : 'border-gray-600'
              }`}
              placeholder="Email"
            />
          </div>

          {/* Password Field */}
          {!initialData && (
            <div>
              <label className="flex items-center gap-2 mb-1.5 sm:mb-1 text-sm text-gray-400">
                <BsLock className="w-4 h-4" />
                Password
              </label>
              <input
                type="password"
                required={!initialData}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`w-full px-3 py-2 sm:py-1.5 bg-black/20 rounded text-sm sm:text-[11px] text-white placeholder-gray-400 ${
                  errors.password ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="Min 8 chars"
              />
            </div>
          )}

          {/* Role Field */}
          <div>
            <label className="flex items-center gap-2 mb-1.5 sm:mb-1 text-sm text-gray-400">
              <BsPersonBadge className="w-4 h-4" />
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="w-full px-3 py-2 sm:py-1.5 bg-black/20 rounded text-sm sm:text-[11px] text-white"
            >
              <option value="EMPLOYEE">👤 Employee</option>
              <option value="MANAGER">👔 Manager</option>
              <option value="ADMIN">🛡️ Admin</option>
            </select>
          </div>

          {/* Manager Field */}
          {shouldShowManagerField && (
            <div>
              <label className="flex items-center gap-2 mb-1.5 sm:mb-1 text-sm text-gray-400">
                <BsPersonCheck className="w-4 h-4" />
                Manager
              </label>
              <select
                value={formData.managerId}
                onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                className="w-full px-3 py-2 sm:py-1.5 bg-black/20 rounded text-sm sm:text-[11px] text-white"
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
            <label className="flex items-center gap-2 mb-1.5 sm:mb-1 text-sm text-gray-400">
              <span className="text-green-500">✓</span>
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
              className="w-full px-3 py-2 sm:py-1.5 bg-black/20 rounded text-sm sm:text-[11px] text-white"
            >
              <option value="ACTIVE">✅ Active</option>
              <option value="INACTIVE">❌ Inactive</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 sm:py-1.5 text-sm sm:text-[11px] font-medium text-gray-300 bg-black/20 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 sm:py-1.5 text-sm sm:text-[11px] font-medium text-white bg-blue-600 rounded"
            >
              {initialData ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
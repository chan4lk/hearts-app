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
      className="bg-gray-800 "
    >
      <div className="p-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1 bg-blue-600 rounded">
            <BsPerson className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-sm font-medium text-white">
            {initialData ? 'Edit User' : 'Create User'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-2">
          {/* Name Field */}
          <div className="space-y-1">
            <label className="flex items-center gap-1 text-xs font-medium text-gray-300">
              <BsPerson className="w-3 h-3" />
              Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-2 py-1.5 bg-gray-700 border rounded text-xs text-white placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-transparent ${
                errors.name ? 'border-red-500' : 'border-gray-600'
              }`}
              placeholder="Enter name"
            />
            {errors.name && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                <span className="w-1 h-1 bg-red-400 rounded-full"></span>
                {errors.name}
              </p>
            )}
          </div>

          {/* Email Field */}
          <div className="space-y-1">
            <label className="flex items-center gap-1 text-xs font-medium text-gray-300">
              <BsEnvelope className="w-3 h-3" />
              Email
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`w-full px-2 py-1.5 bg-gray-700 border rounded text-xs text-white placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-transparent ${
                errors.email ? 'border-red-500' : 'border-gray-600'
              }`}
              placeholder="Email"
            />
            {errors.email && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                <span className="w-1 h-1 bg-red-400 rounded-full"></span>
                {errors.email}
              </p>
            )}
          </div>

          {/* Password Field */}
          {!initialData && (
            <div className="space-y-1">
              <label className="flex items-center gap-1 text-xs font-medium text-gray-300">
                <BsLock className="w-3 h-3" />
                Password
              </label>
              <input
                type="password"
                required={!initialData}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`w-full px-2 py-1.5 bg-gray-700 border rounded text-xs text-white placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-transparent ${
                  errors.password ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="Min 8 chars"
              />
              {errors.password && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <span className="w-1 h-1 bg-red-400 rounded-full"></span>
                  {errors.password}
                </p>
              )}
            </div>
          )}

          {/* Role Field */}
          <div className="space-y-1">
            <label className="flex items-center gap-1 text-xs font-medium text-gray-300">
              {getRoleIcon(formData.role)}
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-xs text-white focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="EMPLOYEE">👤 Employee</option>
              <option value="MANAGER">👔 Manager</option>
              <option value="ADMIN">🛡️ Admin</option>
            </select>
          </div>

          {/* Manager Field */}
          {shouldShowManagerField && (
            <div className="space-y-1">
              <label className="flex items-center gap-1 text-xs font-medium text-gray-300">
                <BsPersonCheck className="w-3 h-3" />
                Manager
              </label>
              <select
                value={formData.managerId}
                onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-xs text-white focus:ring-1 focus:ring-blue-500 focus:border-transparent"
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
          <div className="space-y-1">
            <label className="flex items-center gap-1 text-xs font-medium text-gray-300">
              {formData.status === 'ACTIVE' ? 
                <BsToggleOn className="w-3 h-3 text-green-400" /> : 
                <BsToggleOff className="w-3 h-3 text-red-400" />
              }
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
              className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-xs text-white focus:ring-1 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ACTIVE">✅ Active</option>
              <option value="INACTIVE">❌ Inactive</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-2 py-1.5 text-xs font-medium text-gray-300 bg-gray-700 border border-gray-600 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-2 py-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
            >
              {initialData ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
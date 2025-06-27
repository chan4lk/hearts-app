'use client';

import { useState } from 'react';
import { User, FormData } from '../types';
import { Role } from '@prisma/client';
import { BsArrowCounterclockwise, BsEye, BsShield, BsPerson } from 'react-icons/bs';
import { motion } from 'framer-motion';

interface UserFormProps {
  initialData?: User;
  managers: User[];
  onSubmit: (data: FormData) => Promise<void>;
  onCancel: () => void;
  isEditing: boolean;
}

export default function UserForm({ initialData, managers, onSubmit, onCancel, isEditing }: UserFormProps) {
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.name ? 'border-red-500' : ''}`}
        />
        {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.email ? 'border-red-500' : ''}`}
        />
        {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
      </div>

      {!initialData && (
        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            required={!initialData}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.password ? 'border-red-500' : ''}`}
          />
          {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
        </div>
      )}

      {initialData && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700">New Password (leave blank to keep current)</label>
            <input
              type="password"
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.newPassword ? 'border-red-500' : ''}`}
            />
            {errors.newPassword && <p className="mt-1 text-sm text-red-500">{errors.newPassword}</p>}
          </div>
          {formData.newPassword && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.confirmPassword ? 'border-red-500' : ''}`}
              />
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>}
            </div>
          )}
        </>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">Role</label>
        <select
          value={formData.role}
          onChange={(e) => handleRoleChange(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="EMPLOYEE">Employee</option>
          <option value="MANAGER">Manager</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      {shouldShowManagerField && (
        <div>
          <label className="block text-sm font-medium text-gray-700">Manager</label>
          <select
            value={formData.managerId}
            onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">No Manager</option>
            {availableManagers.map((manager) => (
              <option key={manager.id} value={manager.id}>
                {manager.name} ({manager.role})
              </option>
            ))}
          </select>
          <p className="mt-1 text-sm text-gray-500">
            Any user can be assigned to a manager or admin
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">Status</label>
        <select
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
        >
          {initialData ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { FormData, User, ROLES } from '../types';
import { BsArrowCounterclockwise, BsEye } from 'react-icons/bs';

interface UserFormProps {
  initialData?: User;
  managers: User[];
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

export default function UserForm({ initialData, managers, onSubmit, onCancel, isEditing = false }: UserFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: initialData?.name || '',
    email: initialData?.email || '',
    password: '',
    newPassword: '',
    confirmPassword: '',
    role: initialData?.role as keyof typeof ROLES || 'EMPLOYEE',
    managerId: initialData?.manager?.id || '',
    status: initialData?.status || 'ACTIVE'
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [hasViewedPassword, setHasViewedPassword] = useState(false);

  const validateForm = () => {
    const newErrors: Partial<FormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!isEditing && !formData.password) {
      newErrors.password = 'Password is required';
    }

    if (hasViewedPassword) {
      if (!isEditing && formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
      if (isEditing && formData.newPassword && formData.confirmPassword && formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is modified
    if (errors[name as keyof FormData]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Validate password match if user has viewed the password
    if (hasViewedPassword) {
      if (!isEditing && formData.password && formData.confirmPassword) {
        if (formData.password !== formData.confirmPassword) {
          setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
        } else {
          setErrors(prev => ({ ...prev, confirmPassword: '' }));
        }
      }
      if (isEditing && formData.newPassword && formData.confirmPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
        } else {
          setErrors(prev => ({ ...prev, confirmPassword: '' }));
        }
      }
    }
  };

  const handlePasswordVisibility = (type: 'password' | 'newPassword' | 'confirmPassword') => {
    switch (type) {
      case 'password':
        setShowPassword(!showPassword);
        break;
      case 'newPassword':
        setShowNewPassword(!showNewPassword);
        break;
      case 'confirmPassword':
        setShowConfirmPassword(!showConfirmPassword);
        break;
    }
    setHasViewedPassword(true);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">
            Name
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`w-full px-3 py-1.5 rounded bg-gray-800/50 text-sm text-gray-200 border ${
              errors.name ? 'border-red-500/50' : 'border-gray-700/50'
            } focus:outline-none focus:ring-1 focus:ring-indigo-500/50`}
          />
          {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full px-3 py-1.5 rounded bg-gray-800/50 text-sm text-gray-200 border ${
              errors.email ? 'border-red-500/50' : 'border-gray-700/50'
            } focus:outline-none focus:ring-1 focus:ring-indigo-500/50`}
          />
          {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
        </div>

        {!isEditing && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-3 py-1.5 rounded bg-gray-800/50 text-sm text-gray-200 border ${
                    errors.password ? 'border-red-500/50' : 'border-gray-700/50'
                  } focus:outline-none focus:ring-1 focus:ring-indigo-500/50`}
                />
                <button
                  type="button"
                  onClick={() => handlePasswordVisibility('password')}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-500 hover:text-gray-300"
                >
                  <BsEye className="w-3.5 h-3.5" />
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full px-3 py-1.5 rounded bg-gray-800/50 text-sm text-gray-200 border ${
                    errors.confirmPassword ? 'border-red-500/50' : 'border-gray-700/50'
                  } focus:outline-none focus:ring-1 focus:ring-indigo-500/50`}
                />
                <button
                  type="button"
                  onClick={() => handlePasswordVisibility('confirmPassword')}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-500 hover:text-gray-300"
                >
                  <BsEye className="w-3.5 h-3.5" />
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-xs text-red-400">{errors.confirmPassword}</p>}
            </div>
          </>
        )}

        {isEditing && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="Leave blank to keep current"
                  className="w-full px-3 py-1.5 rounded bg-gray-800/50 text-sm text-gray-200 border border-gray-700/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 placeholder-gray-500"
                />
                <button
                  type="button"
                  onClick={() => handlePasswordVisibility('newPassword')}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-500 hover:text-gray-300"
                >
                  <BsEye className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="mt-1 text-[10px] text-gray-500">Only enter if you want to change the password</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Leave blank to keep current"
                  className={`w-full px-3 py-1.5 rounded bg-gray-800/50 text-sm text-gray-200 border ${
                    errors.confirmPassword ? 'border-red-500/50' : 'border-gray-700/50'
                  } focus:outline-none focus:ring-1 focus:ring-indigo-500/50 placeholder-gray-500`}
                />
                <button
                  type="button"
                  onClick={() => handlePasswordVisibility('confirmPassword')}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-500 hover:text-gray-300"
                >
                  <BsEye className="w-3.5 h-3.5" />
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-xs text-red-400">{errors.confirmPassword}</p>}
            </div>
          </>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">
            Role
          </label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full px-3 py-1.5 rounded bg-gray-800/50 text-sm text-gray-200 border border-gray-700/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
          >
            {Object.entries(ROLES).map(([key, value]) => (
              <option key={key} value={key}>
                {value}
              </option>
            ))}
          </select>
        </div>

        {formData.role !== 'ADMIN' && (
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Manager
            </label>
            <select
              name="managerId"
              value={formData.managerId}
              onChange={handleChange}
              className="w-full px-3 py-1.5 rounded bg-gray-800/50 text-sm text-gray-200 border border-gray-700/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
            >
              <option value="">Select Manager</option>
              {managers.map(manager => (
                <option key={manager.id} value={manager.id}>
                  {manager.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">
            Status
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-3 py-1.5 rounded bg-gray-800/50 text-sm text-gray-200 border border-gray-700/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-3 border-t border-gray-800/50">
        <button
          type="button"
          onClick={() => {
            setFormData({
              name: initialData?.name || '',
              email: initialData?.email || '',
              password: '',
              newPassword: '',
              confirmPassword: '',
              role: initialData?.role as keyof typeof ROLES || 'EMPLOYEE',
              managerId: initialData?.manager?.id || '',
              status: initialData?.status || 'ACTIVE'
            });
            setErrors({});
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-400 bg-gray-800/50 rounded hover:bg-gray-800/70 transition-colors"
        >
          <BsArrowCounterclockwise className="w-3 h-3" />
          Reset
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-xs font-medium text-gray-400 bg-gray-800/50 rounded hover:bg-gray-800/70 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-500/80 rounded hover:bg-indigo-500 transition-colors"
        >
          {isEditing ? 'Update User' : 'Create User'}
        </button>
      </div>
    </form>
  );
}
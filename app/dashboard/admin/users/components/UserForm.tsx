'use client';

import { useState, useEffect } from 'react';
import { FormData, User, ROLES } from '../types';
import { BsArrowCounterclockwise, BsEye, BsShield, BsPerson } from 'react-icons/bs';
import { motion } from 'framer-motion';

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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.2 }}
      className="relative bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl rounded-lg border border-gray-700/30 shadow-2xl overflow-hidden"
    >
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-700/30 bg-gray-800/30">
          <div className="p-1.5 bg-indigo-500/20 rounded-lg">
            <BsPerson className="w-4 h-4 text-indigo-400" />
          </div>
          <h2 className="text-base font-medium text-gray-100">
            {isEditing ? 'Edit User' : 'Create New User'}
          </h2>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-3 py-2 rounded-lg bg-gray-800/40 text-sm text-gray-200 border ${
                  errors.name ? 'border-rose-500/50' : 'border-gray-700/30'
                } focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-colors`}
              />
              {errors.name && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-1.5 text-xs text-rose-400"
                >
                  {errors.name}
                </motion.p>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
            >
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-3 py-2 rounded-lg bg-gray-800/40 text-sm text-gray-200 border ${
                  errors.email ? 'border-rose-500/50' : 'border-gray-700/30'
                } focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-colors`}
              />
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-1.5 text-xs text-rose-400"
                >
                  {errors.email}
                </motion.p>
              )}
            </motion.div>

            {!isEditing ? (
              <>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 rounded-lg bg-gray-800/40 text-sm text-gray-200 border ${
                        errors.password ? 'border-rose-500/50' : 'border-gray-700/30'
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-colors pr-10`}
                    />
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => handlePasswordVisibility('password')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200 transition-colors"
                    >
                      <BsEye className="w-4 h-4" />
                    </motion.button>
                  </div>
                  {errors.password && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-1.5 text-xs text-rose-400"
                    >
                      {errors.password}
                    </motion.p>
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 rounded-lg bg-gray-800/40 text-sm text-gray-200 border ${
                        errors.confirmPassword ? 'border-rose-500/50' : 'border-gray-700/30'
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-colors pr-10`}
                    />
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => handlePasswordVisibility('confirmPassword')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200 transition-colors"
                    >
                      <BsEye className="w-4 h-4" />
                    </motion.button>
                  </div>
                  {errors.confirmPassword && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-1.5 text-xs text-rose-400"
                    >
                      {errors.confirmPassword}
                    </motion.p>
                  )}
                </motion.div>
              </>
            ) : (
              <>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      placeholder="Leave blank to keep current"
                      className="w-full px-3 py-2 rounded-lg bg-gray-800/40 text-sm text-gray-200 border border-gray-700/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-colors pr-10 placeholder-gray-500"
                    />
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => handlePasswordVisibility('newPassword')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200 transition-colors"
                    >
                      <BsEye className="w-4 h-4" />
                    </motion.button>
                  </div>
                  <p className="mt-1.5 text-xs text-gray-500">Only enter if you want to change the password</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Leave blank to keep current"
                      className={`w-full px-3 py-2 rounded-lg bg-gray-800/40 text-sm text-gray-200 border ${
                        errors.confirmPassword ? 'border-rose-500/50' : 'border-gray-700/30'
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-colors pr-10 placeholder-gray-500`}
                    />
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => handlePasswordVisibility('confirmPassword')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200 transition-colors"
                    >
                      <BsEye className="w-4 h-4" />
                    </motion.button>
                  </div>
                  {errors.confirmPassword && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-1.5 text-xs text-rose-400"
                    >
                      {errors.confirmPassword}
                    </motion.p>
                  )}
                </motion.div>
              </>
            )}

            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Role
              </label>
              <div className="relative">
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg bg-gray-800/40 text-sm text-gray-200 border border-gray-700/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-colors appearance-none pr-10"
                >
                  {Object.entries(ROLES).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <BsShield className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </motion.div>

            {formData.role !== 'ADMIN' && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 }}
              >
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Manager
                </label>
                <select
                  name="managerId"
                  value={formData.managerId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg bg-gray-800/40 text-sm text-gray-200 border border-gray-700/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-colors"
                >
                  <option value="">Select Manager</option>
                  {managers.map(manager => (
                    <option key={manager.id} value={manager.id}>
                      {manager.name}
                    </option>
                  ))}
                </select>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg bg-gray-800/40 text-sm text-gray-200 border border-gray-700/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-colors"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </motion.div>
          </div>

          <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-gray-700/30">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
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
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-300 bg-gray-800/70 rounded-lg hover:bg-gray-800/90 transition-colors"
            >
              <BsArrowCounterclockwise className="w-3.5 h-3.5" />
              Reset
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={onCancel}
              className="px-3 py-2 text-sm font-medium text-gray-300 bg-gray-800/70 rounded-lg hover:bg-gray-800/90 transition-colors"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-500/80 rounded-lg hover:bg-indigo-500 transition-colors"
            >
              {isEditing ? 'Update User' : 'Create User'}
            </motion.button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
import { useState } from 'react';
import { User } from '../types';
import { CATEGORIES } from '../constants';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { BsListTask, BsTag, BsCalendar, BsPeople, BsStars, BsRocket, BsLightbulb, BsAward, BsGraphUp, BsBriefcase, BsCheckCircle, BsArrowCounterclockwise } from 'react-icons/bs';

interface GoalFormProps {
  initialData?: {
    title: string;
    description: string;
    dueDate: string;
    employeeId: string;
    category: string;
  };
  users: User[];
  onSubmit: (data: {
    title: string;
    description: string;
    dueDate: string;
    employeeId: string;
    category: string;
  }) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  title: string;
}

export function GoalForm({
  initialData = {
    title: '',
    description: '',
    dueDate: new Date().toISOString().split('T')[0],
    employeeId: '',
    category: 'PROFESSIONAL'
  },
  users,
  onSubmit,
  onCancel,
  loading,
  title
}: GoalFormProps) {
  const [formData, setFormData] = useState(initialData);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
          Goal Title
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <BsListTask className="text-gray-400" />
          </div>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full pl-10 pr-4 py-2 bg-[#2d2f36] text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Enter goal title"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
          Description
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-4 py-2 bg-[#2d2f36] text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="Describe your goal in detail"
          rows={4}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">
            Category
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <BsTag className="text-gray-400" />
            </div>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full pl-10 pr-4 py-2 bg-[#2d2f36] text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            >
              {CATEGORIES.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-gray-300 mb-2">
            Due Date
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <BsCalendar className="text-gray-400" />
            </div>
            <input
              type="date"
              id="dueDate"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full pl-10 pr-4 py-2 bg-[#2d2f36] text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Assign to User
        </label>
        <Select
          value={formData.employeeId}
          onValueChange={(value) => setFormData({ ...formData, employeeId: value })}
        >
          <SelectTrigger className="w-full bg-[#2d2f36] text-white border-gray-700">
            <SelectValue placeholder="Select a user" />
          </SelectTrigger>
          <SelectContent className="bg-[#1E2028] border-gray-700">
            {users
              .filter(user => user.role !== 'ADMIN')
              .map((user) => (
                <SelectItem 
                  key={user.id} 
                  value={user.id} 
                  className="text-gray-300 hover:bg-gray-800"
                >
                  <div className="flex items-center gap-2">
                    {user.role === 'EMPLOYEE' && <BsPeople className="h-4 w-4 text-blue-400" />}
                    {user.role === 'MANAGER' && <BsStars className="h-4 w-4 text-purple-400" />}
                    <div>
                      <span className="font-medium">{user.name}</span>
                      <span className="text-xs text-gray-400 ml-2">({user.email})</span>
                      <span className="text-xs text-gray-500 ml-2 capitalize">{user.role.toLowerCase()}</span>
                    </div>
                  </div>
                </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end space-x-4 pt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => setFormData({
            title: '',
            description: '',
            dueDate: new Date().toISOString().split('T')[0],
            employeeId: '',
            category: 'PROFESSIONAL'
          })}
          className="px-4 py-2 text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-2 border border-amber-500/20 hover:border-amber-500/40 rounded-lg"
          disabled={loading}
        >
          <BsArrowCounterclockwise className="w-4 h-4" />
          Reset
        </button>
        <button
          type="submit"
          disabled={loading}
          className={`px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2 ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <BsCheckCircle className="h-4 w-4" />
              <span>{title}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
} 
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { BsCalendar, BsListTask, BsTag, BsArrowLeft } from 'react-icons/bs';

export default function CreateGoal() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [goal, setGoal] = useState({
    title: '',
    description: '',
    category: '',
    dueDate: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(goal)
      });

      if (!response.ok) {
        throw new Error('Failed to create goal');
      }

      router.push('/dashboard/employee');
    } catch (error) {
      console.error('Error creating goal:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout type="employee">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-4"
            >
              <BsArrowLeft />
              <span>Back</span>
            </button>
            <h1 className="text-2xl font-bold text-white">Create New Goal</h1>
            <p className="text-gray-400">Set a new performance goal</p>
          </div>
        </div>

        <div className="bg-[#1a1c23] rounded-lg p-6">
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
                  value={goal.title}
                  onChange={(e) => setGoal({ ...goal, title: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 bg-[#2d2f36] text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                value={goal.description}
                onChange={(e) => setGoal({ ...goal, description: e.target.value })}
                className="w-full px-4 py-2 bg-[#2d2f36] text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    value={goal.category}
                    onChange={(e) => setGoal({ ...goal, category: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 bg-[#2d2f36] text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select a category</option>
                    <option value="professional">Professional Development</option>
                    <option value="technical">Technical Skills</option>
                    <option value="leadership">Leadership</option>
                    <option value="communication">Communication</option>
                    <option value="project">Project Management</option>
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
                    value={goal.dueDate}
                    onChange={(e) => setGoal({ ...goal, dueDate: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 bg-[#2d2f36] text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <span>Create Goal</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
} 
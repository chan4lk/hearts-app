import React, { useState } from 'react';
import { CATEGORIES } from '@/app/dashboard/manager/goals/create/constants';
import { AIGoalSuggestions } from '@/app/components/shared/AIGoalSuggestions';

export interface SelfCreateGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (goal: { title: string; description: string; dueDate: string; category: string }) => void;
  loading: boolean;
  goal: { title: string; description: string; dueDate: string; category: string };
  setGoal: (goal: { title: string; description: string; dueDate: string; category: string }) => void;
}

export function SelfCreateGoalModal({ isOpen, onClose, onSubmit, loading, goal, setGoal }: SelfCreateGoalModalProps) {
  const [context, setContext] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(goal);
  };

  const handleSuggestionSelect = (suggestion: { title: string; description: string }) => {
    setGoal({
      ...goal,
      title: suggestion.title,
      description: suggestion.description,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-[#1a1c23] rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Create New Goal</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
              Goal Title
            </label>
            <input
              type="text"
              id="title"
              value={goal.title}
              onChange={(e) => setGoal({ ...goal, title: e.target.value })}
              className="w-full px-4 py-2 bg-[#2d2f36] text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter goal title"
              required
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={goal.description}
              onChange={(e) => setGoal({ ...goal, description: e.target.value })}
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
              <select
                id="category"
                value={goal.category}
                onChange={(e) => setGoal({ ...goal, category: e.target.value })}
                className="w-full px-4 py-2 bg-[#2d2f36] text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              >
                {CATEGORIES.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-300 mb-2">
                Due Date
              </label>
              <input
                type="date"
                id="dueDate"
                value={goal.dueDate}
                onChange={(e) => setGoal({ ...goal, dueDate: e.target.value })}
                className="w-full px-4 py-2 bg-[#2d2f36] text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>
          </div>
          <div>
            <label htmlFor="context" className="block text-sm font-medium text-blue-300 mb-2">
              Additional Context (Optional)
            </label>
            <textarea
              id="context"
              value={context}
              onChange={e => setContext(e.target.value)}
              className="w-full px-4 py-2 bg-[#23263a] text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add any additional context for AI suggestions..."
              rows={2}
            />
            <div className="mt-4">
              <AIGoalSuggestions
                category={goal.category}
                context={context}
                onSuggestionSelect={handleSuggestionSelect}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
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
  );
} 
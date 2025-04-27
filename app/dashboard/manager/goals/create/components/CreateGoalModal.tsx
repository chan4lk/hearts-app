import { BsListTask, BsTag, BsCalendar } from 'react-icons/bs';
import { CATEGORIES } from '../constants';
import { Goal } from '../types';

interface CreateGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (goal: Partial<Goal>) => void;
  loading: boolean;
  goal: Partial<Goal>;
  setGoal: (goal: Partial<Goal>) => void;
}

export function CreateGoalModal({
  isOpen,
  onClose,
  onSubmit,
  loading,
  goal,
  setGoal
}: CreateGoalModalProps) {
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(goal);
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
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <BsListTask className="text-gray-400" />
              </div>
              <input
                type="text"
                id="title"
                value={goal.title}
                onChange={(e) => setGoal({ ...goal, title: e.target.value })}
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
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <BsTag className="text-gray-400" />
                </div>
                <select
                  id="category"
                  value={goal.category}
                  onChange={(e) => setGoal({ ...goal, category: e.target.value })}
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
                  value={goal.dueDate}
                  onChange={(e) => setGoal({ ...goal, dueDate: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 bg-[#2d2f36] text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>
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
import { useState } from 'react';
import { BsRobot } from 'react-icons/bs';
import { CATEGORIES } from '../constants';
import { Goal } from '../types';

interface AIGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (category: string, context: string) => void;
  loading: boolean;
  goal: Partial<Goal>;
  setGoal: (goal: Partial<Goal>) => void;
}

export function AIGenerateModal({
  isOpen,
  onClose,
  onGenerate,
  loading,
  goal,
  setGoal
}: AIGenerateModalProps) {
  const [context, setContext] = useState('');

  if (!isOpen) return null;

  const handleGenerate = () => {
    if (!goal.category) return;
    onGenerate(goal.category, context);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-[#1a1c23] rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BsRobot className="w-5 h-5 text-blue-400" />
            AI Goal Generator
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Category
            </label>
            <select
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
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Additional Context (Optional)
            </label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="w-full px-4 py-2 bg-[#2d2f36] text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Add any specific details or context for the AI to consider..."
              rows={4}
            />
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
              onClick={handleGenerate}
              disabled={loading || !goal.category}
              className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <BsRobot className="w-4 h-4" />
                  <span>Generate Goal</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 
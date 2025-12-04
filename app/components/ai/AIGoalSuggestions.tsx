'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BsStars, BsLightbulb, BsCheckCircle, BsXCircle } from 'react-icons/bs';

interface GoalSuggestion {
  title: string;
  description: string;
  category?: string;
  priority?: string;
  estimatedDuration?: string;
}

interface AIGoalSuggestionsProps {
  onSelectGoal?: (goal: GoalSuggestion) => void;
  className?: string;
  onUseGoal?: (goal: GoalSuggestion) => void;
  autoGenerate?: boolean;
  showTriggerButton?: boolean;
}

export default function AIGoalSuggestions({ onSelectGoal, className = '', onUseGoal, autoGenerate = false, showTriggerButton = true }: AIGoalSuggestionsProps) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<GoalSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(autoGenerate);

  const generateSuggestions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/ai/personalized-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 5 })
      });

      if (!response.ok) {
        throw new Error('Failed to generate suggestions');
      }

      const data = await response.json();
      setSuggestions(data.suggestions || []);
      setShowSuggestions(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectGoal = async (goal: GoalSuggestion) => {
    // Call the onUseGoal callback to open create modal with prefilled data
    if (onUseGoal) {
      onUseGoal(goal);
    }

    if (onSelectGoal) {
      onSelectGoal(goal);
    }
    // Don't close suggestions modal - allow user to select multiple goals
    // setShowSuggestions(false);
  };

  // Auto-generate suggestions when component mounts if autoGenerate is true
  useEffect(() => {
    if (autoGenerate) {
      generateSuggestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoGenerate]);

  return (
    <div className={className}>
      {/* Trigger Button - Only show if showTriggerButton is true */}
      {showTriggerButton && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={generateSuggestions}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <BsStars className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Generating...' : 'AI Goal Suggestions'}</span>
        </motion.button>
      )}

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3"
        >
          <BsXCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-500 font-medium">Error</p>
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        </motion.div>
      )}

      {/* Suggestions Modal */}
      <AnimatePresence>
        {(showSuggestions || autoGenerate) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowSuggestions(false);
                if (!showTriggerButton && onSelectGoal) {
                  onSelectGoal({} as GoalSuggestion);
                }
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden border border-purple-500/20"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BsLightbulb className="w-6 h-6 text-white" />
                    <h2 className="text-2xl font-bold text-white">AI-Powered Goal Suggestions</h2>
                  </div>
                  <button
                    onClick={() => {
                      setShowSuggestions(false);
                      if (!showTriggerButton && onSelectGoal) {
                        onSelectGoal({} as GoalSuggestion);
                      }
                    }}
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    <BsXCircle className="w-6 h-6" />
                  </button>
                </div>
                <p className="text-purple-100 mt-2">
                  Personalized goals based on your role, performance, and career development
                </p>
              </div>

              {/* Suggestions List */}
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-180px)] bg-gray-800/30">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <BsStars className="w-12 h-12 text-purple-400 animate-spin mb-4" />
                    <p className="text-purple-200 text-lg font-medium">Generating AI suggestions...</p>
                    <p className="text-purple-300 text-sm mt-2">This may take a few moments</p>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <BsXCircle className="w-12 h-12 text-red-400 mb-4" />
                    <p className="text-red-200 text-lg font-medium">Error generating suggestions</p>
                    <p className="text-red-300 text-sm mt-2">{error}</p>
                  </div>
                ) : suggestions.length > 0 ? (
                  <div className="space-y-4">
                    {suggestions.map((suggestion, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border-2 border-gray-700 hover:border-purple-500 transition-all shadow-lg"
                    >
                      {/* Title Row */}
                      <div className="mb-4">
                        <h3 className="text-xl font-bold text-white mb-3">
                          {suggestion.title}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {suggestion.category && (
                            <span className="px-3 py-1.5 bg-purple-500/20 text-purple-300 text-sm rounded-lg border border-purple-500/30 font-medium">
                              📁 {suggestion.category}
                            </span>
                          )}
                          {suggestion.priority && (
                            <span className={`px-3 py-1.5 text-sm rounded-lg border font-medium ${
                              suggestion.priority === 'High'
                                ? 'bg-red-500/20 text-red-300 border-red-500/30'
                                : suggestion.priority === 'Medium'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                : 'bg-green-500/20 text-green-300 border-green-500/30'
                            }`}>
                              🎯 {suggestion.priority} Priority
                            </span>
                          )}
                          {suggestion.estimatedDuration && (
                            <span className="px-3 py-1.5 bg-blue-500/20 text-blue-300 text-sm rounded-lg border border-blue-500/30 font-medium">
                              ⏱️ {suggestion.estimatedDuration}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      <div className="mb-6">
                        <p className="text-gray-300 text-base leading-relaxed">
                          {suggestion.description}
                        </p>
                      </div>

                      {/* Action Button */}
                      <div className="flex justify-end">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleSelectGoal(suggestion)}
                          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg transition-all shadow-lg shadow-purple-500/30 font-semibold"
                        >
                          <BsCheckCircle className="w-5 h-5" />
                          <span>Use This Goal</span>
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <BsStars className="w-12 h-12 text-purple-400 mb-4" />
                    <p className="text-purple-200 text-lg font-medium">No suggestions available</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 p-5 border-t border-purple-500/30">
                <div className="flex items-center justify-center gap-3">
                  <BsLightbulb className="w-5 h-5 text-purple-400" />
                  <p className="text-purple-200 text-sm font-medium">
                    Click "Use This Goal" to automatically open the goal creation form with pre-filled details!
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BsStarFill, BsStar, BsX } from 'react-icons/bs';

interface RatingJustificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (comments: string) => void;
  score: number;
  goalTitle: string;
  isSubmitting?: boolean;
  existingComments?: string;
}

export function RatingJustificationModal({
  isOpen,
  onClose,
  onSubmit,
  score,
  goalTitle,
  isSubmitting = false,
  existingComments = '',
}: RatingJustificationModalProps) {
  const [comments, setComments] = useState(existingComments);

  const isValid = comments.trim().length >= 10;

  const ratingLabels: Record<number, string> = {
    1: 'Needs Improvement',
    2: 'Below Average',
    3: 'Average',
    4: 'Above Average',
    5: 'Excellent',
  };

  const ratingColors: Record<number, { bg: string; border: string; text: string }> = {
    1: { bg: 'from-red-500/20 to-red-600/20', border: 'border-red-500/30', text: 'text-red-400' },
    2: { bg: 'from-orange-500/20 to-orange-600/20', border: 'border-orange-500/30', text: 'text-orange-400' },
    3: { bg: 'from-yellow-500/20 to-yellow-600/20', border: 'border-yellow-500/30', text: 'text-yellow-400' },
    4: { bg: 'from-blue-500/20 to-blue-600/20', border: 'border-blue-500/30', text: 'text-blue-400' },
    5: { bg: 'from-green-500/20 to-green-600/20', border: 'border-green-500/30', text: 'text-green-400' },
  };

  const colorSet = ratingColors[score] || ratingColors[3];

  const handleSubmit = () => {
    if (isValid && !isSubmitting) {
      onSubmit(comments.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className={`relative z-10 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border ${colorSet.border} rounded-2xl w-full max-w-lg mx-4 shadow-2xl`}
          >
            {/* Header */}
            <div className={`flex items-center justify-between px-6 py-4 border-b border-gray-700/50`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl bg-gradient-to-br ${colorSet.bg} border ${colorSet.border}`}>
                  <BsStarFill className={`w-5 h-5 ${colorSet.text}`} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Rating Justification</h3>
                  <p className="text-xs text-gray-400">Required before submitting your rating</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Close"
              >
                <BsX className="w-5 h-5 text-gray-400 hover:text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-5 space-y-4">
              {/* Goal Title */}
              <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
                <p className="text-xs text-gray-500 mb-1">Goal</p>
                <p className="text-sm text-gray-300 line-clamp-2">{goalTitle}</p>
              </div>

              {/* Star Display */}
              <div className="flex items-center justify-center gap-4 py-2">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star}>
                      {star <= score ? (
                        <BsStarFill className={`w-6 h-6 ${colorSet.text}`} />
                      ) : (
                        <BsStar className="w-6 h-6 text-gray-600" />
                      )}
                    </span>
                  ))}
                </div>
                <span className={`text-sm font-semibold ${colorSet.text}`}>
                  {ratingLabels[score] || `${score}/5`}
                </span>
              </div>

              {/* Comments Textarea */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Justification <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Explain the reason for this rating (minimum 10 characters)..."
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-800/60 border border-gray-700/50 rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 resize-none transition-all"
                  autoFocus
                />
                <div className="flex items-center justify-between mt-1.5">
                  <p className={`text-xs ${comments.trim().length < 10 ? 'text-gray-500' : 'text-green-400'}`}>
                    {comments.trim().length}/10 characters minimum
                  </p>
                  {comments.trim().length > 0 && comments.trim().length < 10 && (
                    <p className="text-xs text-amber-400">
                      {10 - comments.trim().length} more characters needed
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-700/50">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white bg-transparent border border-gray-700 hover:bg-gray-700/50 rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!isValid || isSubmitting}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-all ${
                  isValid && !isSubmitting
                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 shadow-lg shadow-purple-500/20'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  'Submit Rating'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

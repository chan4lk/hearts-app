'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BsX } from 'react-icons/bs';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { hoursContributed: number; feedback: string }) => Promise<void>;
  initialData?: { hoursContributed?: number; feedback?: string };
  isLoading?: boolean;
}

export const FeedbackModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
}: FeedbackModalProps) => {
  const [formData, setFormData] = useState({
    hoursContributed: initialData?.hoursContributed || 1,
    feedback: initialData?.feedback || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSubmit(formData);
      setFormData({ hoursContributed: 1, feedback: '' });
      onClose();
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative w-full max-w-md rounded-xl border border-theme bg-surface-elevated p-6 shadow-2xl backdrop-blur-xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-primary">Event Feedback</h2>
              <button
                onClick={onClose}
                className="rounded-lg p-2 hover:bg-surface-secondary transition"
              >
                <BsX className="text-2xl text-primary" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Hours Contributed
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0.5"
                    max="8"
                    step="0.5"
                    value={formData.hoursContributed}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        hoursContributed: parseFloat(e.target.value),
                      })
                    }
                    className="flex-1"
                  />
                  <span className="text-lg font-bold text-teal-400 min-w-16">
                    {formData.hoursContributed}h
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Feedback & Comments
                </label>
                <textarea
                  value={formData.feedback}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      feedback: e.target.value,
                    })
                  }
                  rows={4}
                  placeholder="Share your experience, key learnings, and suggestions for improvement..."
                  className="w-full rounded-lg border border-theme bg-surface-secondary px-4 py-2 text-primary placeholder-tertiary focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-medium h-9 px-4 rounded-lg disabled:opacity-50 transition-colors"
                >
                  {isLoading ? 'Saving...' : 'Save Feedback'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-surface-secondary hover:bg-surface-tertiary border border-theme text-primary text-[13px] font-medium h-9 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

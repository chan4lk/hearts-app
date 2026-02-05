'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BsX, BsCalendarEvent } from 'react-icons/bs';
import { toast } from 'react-toastify';

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: any;
  isLoading?: boolean;
}

export const EventFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
}: EventFormModalProps) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    eventType: initialData?.eventType || 'TOASTMASTERS',
    location: initialData?.location || '',
    startDate: initialData?.startDate || '',
    endDate: initialData?.endDate || '',
    capacity: initialData?.capacity || '',
    registrationDeadline: initialData?.registrationDeadline || '',
    status: initialData?.status || 'SCHEDULED',
  });

  const eventTypes = [
    'TOASTMASTERS',
    'CODECRUNCH',
    'HEART_TALKS',
    'BISTEC_CLUB',
    'WORKSHOP',
    'TRAINING',
    'SEMINAR',
    'NETWORKING',
    'TEAM_BUILDING',
    'OTHER',
  ];

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSubmit(formData);
      setFormData({
        title: '',
        description: '',
        eventType: 'TOASTMASTERS',
        location: '',
        startDate: '',
        endDate: '',
        capacity: '',
        registrationDeadline: '',
        status: 'SCHEDULED',
      });
      onClose();
    } catch (error) {
      toast.error('Failed to save event');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative w-full max-w-2xl rounded-xl border border-indigo-500/30 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 shadow-2xl shadow-indigo-500/10 backdrop-blur-xl overflow-hidden"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with gradient background */}
            <div className="border-b border-indigo-500/20 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg">
                    <BsCalendarEvent className="text-xl text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    {initialData ? 'Edit Event' : 'Create New Event'}
                  </h2>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                >
                  <BsX className="text-xl" />
                </motion.button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-white/50 hover:border-white/20 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none transition-colors"
                    placeholder="e.g., Toastmasters Conference"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Event Type *
                  </label>
                  <select
                    name="eventType"
                    value={formData.eventType}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white hover:border-white/20 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none transition-colors"
                  >
                    {eventTypes.map((type) => (
                      <option key={type} value={type}>
                        {type.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-white/50 hover:border-white/20 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none transition-colors resize-none"
                  placeholder="Event details and agenda..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-white/50 hover:border-white/20 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none transition-colors"
                    placeholder="e.g., Conference Room A"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Capacity
                  </label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-white/50 hover:border-white/20 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none transition-colors"
                    placeholder="Number of participants"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white hover:border-white/20 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    End Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white hover:border-white/20 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Registration Deadline *
                </label>
                <input
                  type="datetime-local"
                  name="registrationDeadline"
                  value={formData.registrationDeadline}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white hover:border-white/20 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none transition-colors"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/10">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 py-2.5 font-semibold text-white hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 shadow-lg shadow-purple-500/20 transition-all"
                >
                  {isLoading ? 'Saving...' : 'Save Event'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-lg border border-white/20 py-2.5 font-semibold text-white hover:bg-white/10 transition-all"
                >
                  Cancel
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

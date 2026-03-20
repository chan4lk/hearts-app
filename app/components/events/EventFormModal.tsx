'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BsX, BsCalendarEvent } from 'react-icons/bs';
import { toast } from 'react-toastify';
import {
  EVENT_CATEGORIES_FORM,
  EVENT_STATUS_OPTIONS,
} from '@/app/components/shared/constants';

function toDateInput(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toTimeInput(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${min}`;
}

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
    title: '',
    eventType: 'TOASTMASTERS',
    date: '',
    time: '09:00',
    status: 'SCHEDULED',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      const eventType =
        initialData.eventType && initialData.eventType !== 'OTHER'
          ? initialData.eventType
          : 'TOASTMASTERS';
      const date = initialData.startDate ? toDateInput(initialData.startDate) : '';
      const time = initialData.startDate ? toTimeInput(initialData.startDate) : '09:00';
      setFormData({
        title: initialData.title || '',
        eventType,
        date,
        time,
        status: initialData.status || 'SCHEDULED',
      });
    }
  }, [initialData]);

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
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const [hours = 9, minutes = 0] = (formData.time || '09:00').split(':').map(Number);
      const start = formData.date
        ? new Date(formData.date)
        : new Date();
      start.setHours(hours, minutes, 0, 0);
      const dateMs = start.getTime();
      const startDate = new Date(dateMs).toISOString();
      const endDate = new Date(dateMs + 60 * 60 * 1000).toISOString();
      const registrationDeadline = new Date(dateMs).toISOString();

      await onSubmit({
        title: formData.title,
        description: initialData?.description || '—',
        eventType: formData.eventType,
        location: undefined,
        capacity: undefined,
        startDate,
        endDate,
        registrationDeadline,
        status: formData.status,
      });
      setFormData({
        title: '',
        eventType: 'TOASTMASTERS',
        date: '',
        time: '09:00',
        status: 'SCHEDULED',
      });
      onClose();
    } catch (error) {
      toast.error('Failed to save event');
    } finally {
      setIsSubmitting(false);
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
            className="relative w-full max-w-2xl rounded-xl border border-teal-500/30 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 shadow-2xl shadow-teal-500/10 backdrop-blur-xl overflow-hidden"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-teal-500/20 bg-gradient-to-r from-teal-500/10 via-cyan-500/10 to-teal-500/10 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-lg shadow-lg">
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
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Event Name *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-600 bg-gray-900/50 px-4 py-2 text-white placeholder-gray-400 hover:border-gray-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 focus:outline-none transition-colors"
                  placeholder="e.g., Toastmasters Conference"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Category *
                </label>
                <select
                  name="eventType"
                  value={formData.eventType}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-600 bg-gray-900/50 px-4 py-2 text-white hover:border-gray-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 focus:outline-none transition-colors"
                >
                  {EVENT_CATEGORIES_FORM.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-gray-600 bg-gray-900/50 px-4 py-2 text-white hover:border-gray-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Time *
                  </label>
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-gray-600 bg-gray-900/50 px-4 py-2 text-white hover:border-gray-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Status *
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-600 bg-gray-900/50 px-4 py-2 text-white hover:border-gray-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 focus:outline-none transition-colors"
                >
                  {EVENT_STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/10">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading || isSubmitting}
                  className="flex-1 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-600 py-2.5 font-semibold text-white hover:from-teal-600 hover:to-cyan-700 disabled:opacity-50 shadow-lg shadow-cyan-500/20 transition-all"
                >
                  {isLoading || isSubmitting ? 'Saving...' : 'Save Event'}
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

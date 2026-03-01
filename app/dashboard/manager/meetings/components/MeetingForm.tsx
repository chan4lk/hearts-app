'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BsX, BsCalendar, BsPerson, BsTag, BsJournalText, BsListCheck, BsArrowRight, BsChatDots } from 'react-icons/bs';

interface Employee {
  id: string;
  name: string;
  email: string;
}

interface FeedbackRound {
  id: string;
  type: string;
  status: string;
  employee: { id: string; name: string; email: string };
  createdAt: string;
}

interface MeetingFormData {
  employeeId: string;
  type: string;
  date: string;
  notes: string;
  actionItems: string;
  nextSteps: string;
  feedbackRoundId?: string;
}

interface MeetingFormProps {
  onSubmit: (data: MeetingFormData) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<MeetingFormData>;
  employees: Employee[];
}

const MEETING_TYPES = [
  { value: 'THREE_MONTH_REVIEW', label: '3-Month Review' },
  { value: 'SIX_MONTH_REVIEW', label: '6-Month Review' },
  { value: 'ANNUAL_REVIEW', label: 'Annual Review' },
  { value: 'FEEDBACK_DISCUSSION', label: 'Feedback Discussion' },
  { value: 'GENERAL', label: 'General Meeting' },
];

export default function MeetingForm({ onSubmit, onCancel, initialData, employees }: MeetingFormProps) {
  const [formData, setFormData] = useState<MeetingFormData>({
    employeeId: initialData?.employeeId || '',
    type: initialData?.type || 'GENERAL',
    date: initialData?.date || new Date().toISOString().split('T')[0],
    notes: initialData?.notes || '',
    actionItems: initialData?.actionItems || '',
    nextSteps: initialData?.nextSteps || '',
    feedbackRoundId: initialData?.feedbackRoundId || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [feedbackRounds, setFeedbackRounds] = useState<FeedbackRound[]>([]);
  const [loadingRounds, setLoadingRounds] = useState(false);

  // Fetch feedback rounds when type is FEEDBACK_DISCUSSION and employee is selected
  useEffect(() => {
    if (formData.type === 'FEEDBACK_DISCUSSION' && formData.employeeId) {
      fetchFeedbackRounds();
    } else {
      setFeedbackRounds([]);
      setFormData(prev => ({ ...prev, feedbackRoundId: '' }));
    }
  }, [formData.type, formData.employeeId]);

  const fetchFeedbackRounds = async () => {
    setLoadingRounds(true);
    try {
      const response = await fetch('/api/feedback-rounds');
      if (response.ok) {
        const data = await response.json();
        const rounds = (data.rounds || []).filter(
          (round: FeedbackRound) => round.employee.id === formData.employeeId
        );
        setFeedbackRounds(rounds);
      }
    } catch (error) {
      console.error('Error fetching feedback rounds:', error);
    } finally {
      setLoadingRounds(false);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.employeeId) {
      newErrors.employeeId = 'Please select an employee';
    }
    if (!formData.type) {
      newErrors.type = 'Please select a meeting type';
    }
    if (!formData.date) {
      newErrors.date = 'Please select a date';
    }
    if (!formData.notes || formData.notes.trim().length < 10) {
      newErrors.notes = 'Notes must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field: keyof MeetingFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const inputClasses = 'w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all';
  const labelClasses = 'block text-sm font-medium text-gray-300 mb-1.5';
  const errorClasses = 'text-xs text-red-400 mt-1';

  return (
    <motion.form
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-xl rounded-xl p-6 border border-gray-700/50 shadow-xl space-y-5"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <BsJournalText className="w-5 h-5 text-purple-400" />
          {initialData ? 'Edit Meeting Minutes' : 'New Meeting Minutes'}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
        >
          <BsX className="w-5 h-5 text-gray-400 hover:text-white" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Employee Selector */}
        <div>
          <label className={labelClasses}>
            <BsPerson className="inline w-3.5 h-3.5 mr-1 text-purple-400" />
            Employee
          </label>
          <select
            value={formData.employeeId}
            onChange={(e) => handleChange('employeeId', e.target.value)}
            className={inputClasses}
          >
            <option value="">Select an employee...</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} ({emp.email})
              </option>
            ))}
          </select>
          {errors.employeeId && <p className={errorClasses}>{errors.employeeId}</p>}
        </div>

        {/* Meeting Type Selector */}
        <div>
          <label className={labelClasses}>
            <BsTag className="inline w-3.5 h-3.5 mr-1 text-purple-400" />
            Meeting Type
          </label>
          <select
            value={formData.type}
            onChange={(e) => handleChange('type', e.target.value)}
            className={inputClasses}
          >
            {MEETING_TYPES.map((mt) => (
              <option key={mt.value} value={mt.value}>
                {mt.label}
              </option>
            ))}
          </select>
          {errors.type && <p className={errorClasses}>{errors.type}</p>}
        </div>

        {/* Date Picker */}
        <div>
          <label className={labelClasses}>
            <BsCalendar className="inline w-3.5 h-3.5 mr-1 text-purple-400" />
            Date
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => handleChange('date', e.target.value)}
            className={inputClasses}
          />
          {errors.date && <p className={errorClasses}>{errors.date}</p>}
        </div>

        {/* Feedback Round Selector (conditional) */}
        {formData.type === 'FEEDBACK_DISCUSSION' && formData.employeeId && (
          <div>
            <label className={labelClasses}>
              <BsChatDots className="inline w-3.5 h-3.5 mr-1 text-purple-400" />
              Feedback Round (Optional)
            </label>
            <select
              value={formData.feedbackRoundId}
              onChange={(e) => handleChange('feedbackRoundId', e.target.value)}
              className={inputClasses}
              disabled={loadingRounds}
            >
              <option value="">
                {loadingRounds ? 'Loading rounds...' : 'Select a feedback round...'}
              </option>
              {feedbackRounds.map((round) => (
                <option key={round.id} value={round.id}>
                  {round.type === 'THREE_MONTH' ? '3-Month' : 'Annual'} - {round.status} ({new Date(round.createdAt).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className={labelClasses}>
          <BsJournalText className="inline w-3.5 h-3.5 mr-1 text-purple-400" />
          Meeting Notes <span className="text-red-400">*</span>
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="Enter detailed meeting notes (minimum 10 characters)..."
          rows={4}
          className={inputClasses}
        />
        {errors.notes && <p className={errorClasses}>{errors.notes}</p>}
        <p className="text-xs text-gray-500 mt-1">{formData.notes.length} characters</p>
      </div>

      {/* Action Items */}
      <div>
        <label className={labelClasses}>
          <BsListCheck className="inline w-3.5 h-3.5 mr-1 text-purple-400" />
          Action Items
        </label>
        <textarea
          value={formData.actionItems}
          onChange={(e) => handleChange('actionItems', e.target.value)}
          placeholder="List action items (one per line)..."
          rows={3}
          className={inputClasses}
        />
      </div>

      {/* Next Steps */}
      <div>
        <label className={labelClasses}>
          <BsArrowRight className="inline w-3.5 h-3.5 mr-1 text-purple-400" />
          Next Steps
        </label>
        <textarea
          value={formData.nextSteps}
          onChange={(e) => handleChange('nextSteps', e.target.value)}
          placeholder="Outline next steps..."
          rows={3}
          className={inputClasses}
        />
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-700/50 rounded-lg border border-gray-700/50 transition-all"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 rounded-lg shadow-lg shadow-purple-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              {initialData ? 'Update Meeting' : 'Save Meeting Minutes'}
            </>
          )}
        </button>
      </div>
    </motion.form>
  );
}

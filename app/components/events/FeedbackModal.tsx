'use client';

import { useState } from 'react';
import { BsChatDots } from 'react-icons/bs';
import { ModalShell, FORM_STYLES, FormField, FormActions } from '@/app/components/ui/form-primitives';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { hoursContributed: number; feedback: string }) => Promise<void>;
  initialData?: { hoursContributed?: number; feedback?: string };
  isLoading?: boolean;
}

export const FeedbackModal = ({ isOpen, onClose, onSubmit, initialData, isLoading = false }: FeedbackModalProps) => {
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
    }
  };

  return (
    <ModalShell
      open={isOpen}
      onClose={onClose}
      title="Event Feedback"
      icon={<BsChatDots className="w-4 h-4" />}
      maxWidth="max-w-md"
      footer={<FormActions onCancel={onClose} submitLabel="Save Feedback" loading={isLoading} formId="feedback-form" />}
    >
      <form id="feedback-form" onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Hours Contributed">
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0.5"
              max="8"
              step="0.5"
              value={formData.hoursContributed}
              onChange={(e) => setFormData({ ...formData, hoursContributed: parseFloat(e.target.value) })}
              className="flex-1"
            />
            <span className="text-lg font-bold text-indigo-500 min-w-16">{formData.hoursContributed}h</span>
          </div>
        </FormField>

        <FormField label="Feedback & Comments">
          <textarea
            value={formData.feedback}
            onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
            rows={4}
            placeholder="Share your experience, key learnings, and suggestions..."
            className={FORM_STYLES.textarea}
          />
        </FormField>
      </form>
    </ModalShell>
  );
};

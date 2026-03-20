'use client';

import { useState, useEffect } from 'react';
import { BsCalendarEvent } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { EVENT_CATEGORIES_FORM, EVENT_STATUS_OPTIONS } from '@/app/components/shared/constants';
import { ModalShell, FORM_STYLES, FormField, FormActions } from '@/app/components/ui/form-primitives';

function toDateInput(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function toTimeInput(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: any;
  isLoading?: boolean;
}

export const EventFormModal = ({ isOpen, onClose, onSubmit, initialData, isLoading = false }: EventFormModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    eventType: 'TOASTMASTERS',
    date: '',
    time: '09:00',
    status: 'SCHEDULED',
  });

  useEffect(() => {
    if (initialData) {
      const date = initialData.startDate ? toDateInput(initialData.startDate) : '';
      const time = initialData.startDate ? toTimeInput(initialData.startDate) : '09:00';
      const eventType = initialData.eventType || 'TOASTMASTERS';
      setFormData({ title: initialData.title || '', eventType, date, time, status: initialData.status || 'SCHEDULED' });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const [hours = 9, minutes = 0] = (formData.time || '09:00').split(':').map(Number);
      const start = formData.date ? new Date(formData.date) : new Date();
      start.setHours(hours, minutes, 0, 0);
      const dateMs = start.getTime();

      await onSubmit({
        title: formData.title,
        description: initialData?.description || '—',
        eventType: formData.eventType,
        location: undefined,
        capacity: undefined,
        startDate: new Date(dateMs).toISOString(),
        endDate: new Date(dateMs + 60 * 60 * 1000).toISOString(),
        registrationDeadline: new Date(dateMs).toISOString(),
        status: formData.status,
      });
      setFormData({ title: '', eventType: 'TOASTMASTERS', date: '', time: '09:00', status: 'SCHEDULED' });
      onClose();
    } catch (error) {
      toast.error('Failed to save event');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalShell
      open={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Event' : 'Create New Event'}
      icon={<BsCalendarEvent className="w-4 h-4" />}
      maxWidth="max-w-2xl"
      footer={<FormActions onCancel={onClose} submitLabel={isLoading || isSubmitting ? 'Saving...' : 'Save Event'} loading={isLoading || isSubmitting} formId="event-form" />}
    >
      <form id="event-form" onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Event Name" required>
          <input type="text" name="title" value={formData.title} onChange={handleChange} required placeholder="e.g., Toastmasters Conference" className={FORM_STYLES.input} />
        </FormField>

        <FormField label="Category" required>
          <select name="eventType" value={formData.eventType} onChange={handleChange} required className={FORM_STYLES.select}>
            {EVENT_CATEGORIES_FORM.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Date" required>
            <input type="date" name="date" value={formData.date} onChange={handleChange} required className={FORM_STYLES.input} />
          </FormField>
          <FormField label="Time" required>
            <input type="time" name="time" value={formData.time} onChange={handleChange} required className={FORM_STYLES.input} />
          </FormField>
        </div>

        <FormField label="Status" required>
          <select name="status" value={formData.status} onChange={handleChange} required className={FORM_STYLES.select}>
            {EVENT_STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </FormField>
      </form>
    </ModalShell>
  );
};

import { useState, useCallback } from 'react';

interface GoalFormData {
  title: string;
  description: string;
  category: string;
  priority: string;
  dueDate: string;
  department: string;
  employeeId: string;
}

interface GoalFormErrors {
  title?: string;
  description?: string;
  category?: string;
  dueDate?: string;
}

const INITIAL_FORM_DATA: GoalFormData = {
  title: '',
  description: '',
  category: 'PROFESSIONAL',
  priority: 'MEDIUM',
  dueDate: '',
  department: 'ENGINEERING',
  employeeId: '',
};

interface UseGoalFormOptions {
  initialData?: Partial<GoalFormData>;
  onSubmit?: (data: GoalFormData) => Promise<void>;
}

/**
 * Reusable goal form state hook.
 * Manages form data, validation, submission state, and reset.
 */
export function useGoalForm({ initialData, onSubmit }: UseGoalFormOptions = {}) {
  const [formData, setFormData] = useState<GoalFormData>({
    ...INITIAL_FORM_DATA,
    ...initialData,
  });
  const [errors, setErrors] = useState<GoalFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setField = useCallback(<K extends keyof GoalFormData>(
    field: K,
    value: GoalFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for the field being edited
    setErrors(prev => {
      if (prev[field as keyof GoalFormErrors]) {
        const next = { ...prev };
        delete next[field as keyof GoalFormErrors];
        return next;
      }
      return prev;
    });
  }, []);

  const validate = useCallback((): boolean => {
    const newErrors: GoalFormErrors = {};

    if (!formData.title.trim() || formData.title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }
    if (formData.title.trim().length > 255) {
      newErrors.title = 'Title must be less than 255 characters';
    }
    if (!formData.description.trim() || formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required';
    } else {
      const dueDate = new Date(formData.dueDate);
      if (isNaN(dueDate.getTime())) {
        newErrors.dueDate = 'Invalid date format';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const submit = useCallback(async () => {
    if (!validate() || !onSubmit) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validate, onSubmit]);

  const reset = useCallback((data?: Partial<GoalFormData>) => {
    setFormData({ ...INITIAL_FORM_DATA, ...data });
    setErrors({});
    setIsSubmitting(false);
  }, []);

  const prefill = useCallback((data: Partial<GoalFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  }, []);

  return {
    formData,
    errors,
    isSubmitting,
    setField,
    validate,
    submit,
    reset,
    prefill,
    setFormData,
  };
}

'use client';

import { useState, useEffect } from 'react';
import { User, GoalFormData } from '@/app/components/shared/types';
import { AIGoalSuggestions } from '@/app/components/shared/AIGoalSuggestions';
import { showToast } from '@/app/utils/toast';
import { GoalFormModal } from '@/app/components/shared/GoalFormModal';
import React from 'react';

interface CreateGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: GoalFormData) => Promise<void>;
  assignedEmployees: User[];
  loading: boolean;
  formData: GoalFormData;
  setFormData: React.Dispatch<React.SetStateAction<GoalFormData>>;
  mode: 'create' | 'edit';
  initialData?: GoalFormData;
}

export function CreateGoalModal({
  isOpen,
  onClose,
  onSubmit,
  assignedEmployees,
  loading,
  formData,
  setFormData,
  mode = 'create',
  initialData
}: CreateGoalModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [context, setContext] = useState('');
  const [initialEditData, setInitialEditData] = useState<GoalFormData | null>(null);
  const [errors, setErrors] = useState<{ title?: string; category?: string; employeeId?: string }>({});
  const [justSubmitted, setJustSubmitted] = useState<'create' | 'update' | null>(null);

  useEffect(() => {
    if (mode === 'edit') {
      setInitialEditData({ ...formData });
    } else {
      setInitialEditData(null);
    }
    setErrors({});
    if (!isOpen && justSubmitted) {
      if (justSubmitted === 'create') {
        showToast.goal.created();
      } else {
        showToast.goal.updated();
      }
      setJustSubmitted(null);
      setFormData({
        title: '',
        description: '',
        dueDate: new Date().toISOString().split('T')[0],
        employeeId: '',
        category: 'PROFESSIONAL',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validation for required fields
    const newErrors: { title?: string; category?: string; employeeId?: string } = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Goal title is required';
    }
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    if (!formData.employeeId) {
      newErrors.employeeId = 'Employee is required';
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    await onSubmit(formData);
    setJustSubmitted(mode === 'edit' ? 'update' : 'create');
  };

  const handleGenerate = async () => {
    if (!formData.employeeId) {
      showToast.goal.error('Please select an employee first');
      return;
    }

    const selectedEmployee = assignedEmployees.find(e => e.id === formData.employeeId);
    if (!selectedEmployee) {
      showToast.goal.error('Selected employee not found');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-goal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: `Create a professional goal for ${selectedEmployee.name} who is a ${selectedEmployee.position} in the ${selectedEmployee.department} department`,
          category: formData.category 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate goal');
      }

      const data = await response.json();
      if (!data.title || !data.description) {
        throw new Error('Invalid response from AI');
      }

      setFormData(prev => ({
        ...prev,
        title: data.title,
        description: data.description,
      }));
      showToast.goal.updated();
    } catch (error) {
      console.error('Error generating goal:', error);
      showToast.goal.error('Failed to generate goal. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFormDataChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    if (mode === 'edit' && initialEditData) {
      setFormData({ ...initialEditData });
      setContext('');
    } else {
      setFormData({
        title: '',
        description: '',
        dueDate: new Date().toISOString().split('T')[0],
        employeeId: '',
        category: 'PROFESSIONAL'
      });
      setContext('');
    }
  };

  return (
    <>
      <GoalFormModal
        isOpen={isOpen}
        onClose={onClose}
        onSubmit={handleSubmit}
        assignedEmployees={assignedEmployees}
        loading={loading}
        formData={formData}
        onFormDataChange={handleFormDataChange}
        errors={errors}
        isEditMode={mode === 'edit'}
        context={context}
        onContextChange={setContext}
        onReset={handleReset}
      />
      {/* AI Suggestions */}
      {isOpen && (
        <div className="bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-lg p-2 border border-blue-500/20">
          <AIGoalSuggestions
            category={formData.category}
            context={context}
            onSuggestionSelect={(suggestion: { title: string; description: string }) => setFormData(prev => ({ ...prev, title: suggestion.title, description: suggestion.description }))}
          />
        </div>
      )}
    </>
  );
}
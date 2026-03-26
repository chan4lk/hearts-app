'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ModalShell, FORM_STYLES, FormActions } from '@/app/components/ui/form-primitives';
import { User, GoalFormData } from './types';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { CATEGORIES, DEPARTMENTS, PRIORITIES, GOAL_TEMPLATES } from './constants';

const selectContentClass = 'bg-surface-elevated border border-theme text-primary z-[100] max-h-[min(14rem,45vh)]';
const selectTriggerClass = 'bg-surface-tertiary border border-theme text-primary text-xs h-9 rounded-lg focus:border-[rgb(var(--color-warning))]/50 focus-ring/20';
const nativeSelectClass = selectTriggerClass;

interface BulkGoalFormData extends Omit<GoalFormData, 'employeeId'> {
  id: string;
  employeeId: string;
  employeeName?: string;
}

interface BulkGoalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (goals: Omit<BulkGoalFormData, 'id'>[]) => Promise<void>;
  assignedEmployees: User[];
  loading: boolean;
}

const defaultGoalForm: Omit<BulkGoalFormData, 'id'> = {
  title: '',
  description: '',
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
  employeeId: '',
  category: 'PROFESSIONAL',
  department: 'ENGINEERING',
  priority: 'MEDIUM'
};

export function BulkGoalFormModal({
  isOpen,
  onClose,
  onSubmit,
  assignedEmployees,
  loading
}: BulkGoalFormModalProps) {
  const [goals, setGoals] = useState<BulkGoalFormData[]>([]);
  const [errors, setErrors] = useState<Record<string, { title?: string; employeeId?: string }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'manual' | 'templates'>('manual');
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const hasInitialized = useRef(false);
  const openSelectCountRef = useRef(0);
  const [anySelectOpen, setAnySelectOpen] = useState(false);

  const handleSelectOpenChange = useCallback((open: boolean) => {
    openSelectCountRef.current += open ? 1 : -1;
    openSelectCountRef.current = Math.max(0, openSelectCountRef.current);
    setAnySelectOpen(openSelectCountRef.current > 0);
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  // Initialize with one empty goal form when modal opens (once per open)
  useEffect(() => {
    if (isOpen) {
      if (!hasInitialized.current && goals.length === 0) {
        setGoals([{
          ...defaultGoalForm,
          id: `goal-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
        }]);
        hasInitialized.current = true;
      }
    } else {
      hasInitialized.current = false;
    }
  }, [isOpen]);

  const addNewGoal = () => {
    const newGoal: BulkGoalFormData = {
      ...defaultGoalForm,
      id: `goal-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
    };
    setGoals(prev => [...prev, newGoal]);
  };

  const removeGoal = (id: string) => {
    if (goals.length > 1) {
      setGoals(prev => prev.filter(goal => goal.id !== id));
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
    }
  };

  const updateGoal = (id: string, field: keyof BulkGoalFormData, value: string) => {
    setGoals(prev => prev.map(goal => 
      goal.id === id ? { ...goal, [field]: value } : goal
    ));
    
    // Clear errors for this field
    if (errors[id]?.[field as keyof typeof errors[string]]) {
      setErrors(prev => ({
        ...prev,
        [id]: {
          ...prev[id],
          [field]: undefined
        }
      }));
    }
  };

  const duplicateGoal = (id: string) => {
    const goalToDuplicate = goals.find(goal => goal.id === id);
    if (goalToDuplicate) {
      const duplicatedGoal: BulkGoalFormData = {
        ...goalToDuplicate,
        id: `goal-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        title: `${goalToDuplicate.title} (Copy)`
      };
      setGoals(prev => [...prev, duplicatedGoal]);
    }
  };

  const validateGoals = (): boolean => {
    const newErrors: Record<string, { title?: string; employeeId?: string }> = {};
    let hasErrors = false;
    const assignedEmployeeIds = new Set(assignedEmployees.map(emp => emp.id));

    goals.forEach(goal => {
      const goalErrors: { title?: string; employeeId?: string } = {};

      if (!goal.title.trim()) {
        goalErrors.title = 'Goal title is required';
        hasErrors = true;
      }

      if (!goal.employeeId) {
        goalErrors.employeeId = 'Employee is required';
        hasErrors = true;
      } else if (!assignedEmployeeIds.has(goal.employeeId)) {
        goalErrors.employeeId = 'Selected employee is not valid';
        hasErrors = true;
      }

      if (Object.keys(goalErrors).length > 0) {
        newErrors[goal.id] = goalErrors;
      }
    });

    setErrors(newErrors);
    return !hasErrors;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault?.();

    if (!validateGoals()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Remove the internal 'id' field and only send the actual goal data
      const goalsToSubmit = goals.map(goal => ({
        title: goal.title,
        description: goal.description,
        dueDate: goal.dueDate,
        employeeId: goal.employeeId,
        category: goal.category,
        department: goal.department,
        priority: goal.priority
      }));

      await onSubmit(goalsToSubmit);
      // Reset form
      setGoals([]);
      setErrors({});
      onClose();
    } catch (error) {
      // Error toast removed
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmployeeToggle = (employeeId: string) => {
    setSelectedEmployees(prev =>
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleTemplateApply = (template: any) => {
    if (selectedEmployees.length === 0) {
      // Error toast removed
      return;
    }

    // Validate that selected employees are in the assigned employees list
    const validEmployeeIds = selectedEmployees.filter(empId =>
      assignedEmployees.some(assignedEmp => assignedEmp.id === empId)
    );

    if (validEmployeeIds.length === 0) {
      // Error toast removed
      return;
    }

    const newGoals = validEmployeeIds.map(employeeId => {
      const employee = assignedEmployees.find(emp => emp.id === employeeId);
      return {
        id: `goal-${Date.now()}-${Math.random().toString(36).substring(2, 11)}-${employeeId}`,
        title: template.title,
        description: template.description,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        employeeId,
        category: template.category,
        department: employee?.department || 'ENGINEERING',
        priority: 'MEDIUM'
      };
    });



    setGoals(prev => [...prev, ...newGoals]);
    setActiveTab('manual');
    setSelectedEmployees([]); // Clear selection
    // Toast removed
  };

  const handleClose = () => {
    setGoals([]);
    setErrors({});
    setActiveTab('manual');
    setSelectedEmployees([]);
    onClose();
  };

  const footerContent = activeTab === 'manual' ? (
    <div className="flex items-center justify-between w-full">
      <span className="text-xs text-secondary">{goals.length} goal(s) ready to create</span>
      <FormActions
        onCancel={handleClose}
        submitLabel={isSubmitting ? 'Creating...' : `Create ${goals.length} Goal(s)`}
        loading={isSubmitting || loading || goals.length === 0}
        formId="bulk-goal-form"
      />
    </div>
  ) : (
    <div className="flex items-center justify-between w-full">
      <span className="text-xs text-secondary">Use templates to quickly create goals</span>
      <button onClick={handleClose} className={FORM_STYLES.btnSecondary}>Close</button>
    </div>
  );

  return (
    <ModalShell
      open={isOpen}
      onClose={handleClose}
      title="Create Multiple Goals"
      maxWidth="max-w-4xl"
      footer={footerContent}
    >
      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('manual')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors focus-ring ${
            activeTab === 'manual'
              ? 'bg-accent text-[rgb(var(--color-text-inverse))]'
              : 'bg-surface-secondary text-secondary hover:bg-surface-tertiary hover:text-primary'
          }`}
        >
          Manual Entry ({goals.length})
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors focus-ring ${
            activeTab === 'templates'
              ? 'bg-accent text-[rgb(var(--color-text-inverse))]'
              : 'bg-surface-secondary text-secondary hover:bg-surface-tertiary hover:text-primary'
          }`}
        >
          Templates
        </button>
      </div>

      {/* Content */}
      <div className={anySelectOpen ? 'overflow-hidden' : ''}>
          {activeTab === 'templates' ? (
            <div className="space-y-4">
              {/* Employee Selection for Templates */}
              <div className="bg-black/10 rounded-lg p-3 border border-theme">
                <h3 className="text-sm font-medium text-primary mb-2">
                  Select Employees ({selectedEmployees.length} selected)
                </h3>
                {assignedEmployees.length === 0 ? (
                  <p className="text-xs text-tertiary">No employees available</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {assignedEmployees.map(employee => (
                      <label key={employee.id} className="flex items-center gap-2 text-xs text-secondary hover:text-primary cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedEmployees.includes(employee.id)}
                          onChange={() => handleEmployeeToggle(employee.id)}
                          className="rounded border-theme text-warning focus-ring/20"
                        />
                        {employee.name}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Goal Templates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {GOAL_TEMPLATES.slice(0, 6).map(template => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleTemplateApply(template)}
                    disabled={selectedEmployees.length === 0}
                    className="p-3 bg-surface-tertiary border border-theme rounded-lg text-left hover:bg-black/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="text-sm font-medium text-primary">{template.title}</div>
                    <div className="text-xs text-tertiary">{template.category} • {template.subtitle}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <form id="bulk-goal-form" onSubmit={handleSubmit} className="space-y-3">
            {/* Goals List */}
            <AnimatePresence>
              {goals.map((goal, index) => (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-surface-tertiary rounded-lg p-3 border border-theme"
                >
                  {/* Goal Header */}
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-primary">
                      Goal #{index + 1}
                    </h3>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => duplicateGoal(goal.id)}
                        className="p-1 text-warning hover:text-warning hover:bg-warning-muted rounded transition-colors"
                        title="Duplicate Goal"
                        aria-label="Duplicate goal"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                      {goals.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeGoal(goal.id)}
                          className="p-1 text-error/70 hover:text-error hover:bg-error-muted rounded transition-colors"
                          title="Remove Goal"
                          aria-label="Remove goal"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Compact Goal Form Fields */}
                  <div className="space-y-2">
                    {/* Title & Employee Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-2xs font-medium text-secondary mb-1">Goal Title *</label>
                        <Input
                          value={goal.title}
                          onChange={(e) => updateGoal(goal.id, 'title', e.target.value)}
                          placeholder="Enter goal title"
                          className="bg-surface-tertiary border-theme text-primary text-xs h-7 rounded-lg focus:border-[rgb(var(--color-warning))]/50 focus-ring/20"
                        />
                        {errors[goal.id]?.title && (
                          <div className="text-error text-2xs mt-1 font-semibold animate-pulse">{errors[goal.id].title}</div>
                        )}
                      </div>
                      <div>
                        <label className="block text-2xs font-medium text-secondary mb-1">Employee *</label>
                        <Select
                          value={goal.employeeId}
                          onValueChange={(v) => updateGoal(goal.id, 'employeeId', v)}
                          onOpenChange={handleSelectOpenChange}
                        >
                          <SelectTrigger className={selectTriggerClass}>
                            <SelectValue placeholder="Select employee" />
                          </SelectTrigger>
                          <SelectContent className={selectContentClass}>
                            {assignedEmployees.map((emp) => (
                              <SelectItem key={emp.id} value={emp.id} className="text-primary focus:bg-white/10 focus:text-primary">
                                {emp.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors[goal.id]?.employeeId && (
                          <div className="text-error text-2xs mt-1 font-semibold animate-pulse">{errors[goal.id].employeeId}</div>
                        )}
                      </div>
                    </div>

                    {/* Category, Department, Priority - dark dropdown for clear view */}
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-2xs font-medium text-secondary mb-1">Category</label>
                        <Select
                          value={goal.category}
                          onValueChange={(v) => updateGoal(goal.id, 'category', v)}
                          onOpenChange={handleSelectOpenChange}
                        >
                          <SelectTrigger className={selectTriggerClass}>
                            <SelectValue placeholder="Category" />
                          </SelectTrigger>
                          <SelectContent className={selectContentClass}>
                            {CATEGORIES.map((c) => (
                              <SelectItem key={c.value} value={c.value} className="text-primary focus:bg-white/10 focus:text-primary">
                                {c.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-2xs font-medium text-secondary mb-1">Department</label>
                        <Select
                          value={goal.department}
                          onValueChange={(v) => updateGoal(goal.id, 'department', v)}
                          onOpenChange={handleSelectOpenChange}
                        >
                          <SelectTrigger className={selectTriggerClass}>
                            <SelectValue placeholder="Department" />
                          </SelectTrigger>
                          <SelectContent className={selectContentClass}>
                            {DEPARTMENTS.map((d) => (
                              <SelectItem key={d.value} value={d.value} className="text-primary focus:bg-white/10 focus:text-primary">
                                {d.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-2xs font-medium text-secondary mb-1">Priority</label>
                        <Select
                          value={goal.priority}
                          onValueChange={(v) => updateGoal(goal.id, 'priority', v)}
                          onOpenChange={handleSelectOpenChange}
                        >
                          <SelectTrigger className={selectTriggerClass}>
                            <SelectValue placeholder="Priority" />
                          </SelectTrigger>
                          <SelectContent className={selectContentClass}>
                            {PRIORITIES.map((p) => (
                              <SelectItem key={p.value} value={p.value} className="text-primary focus:bg-white/10 focus:text-primary">
                                {p.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Due Date & Description Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-2xs font-medium text-secondary mb-1">Due Date</label>
                        <Input
                          type="date"
                          value={goal.dueDate}
                          onChange={(e) => updateGoal(goal.id, 'dueDate', e.target.value)}
                          className="bg-surface-tertiary border-theme text-primary text-xs h-7 rounded-lg focus:border-[rgb(var(--color-warning))]/50 focus-ring/20"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-2xs font-medium text-secondary mb-1">Description</label>
                        <Textarea
                          value={goal.description}
                          onChange={(e) => updateGoal(goal.id, 'description', e.target.value)}
                          placeholder="Describe the goal..."
                          className="bg-surface-tertiary border-theme text-primary text-xs min-h-[28px] rounded-lg focus:border-[rgb(var(--color-warning))]/50 focus-ring/20 resize-none"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Add New Goal Button */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={addNewGoal}
                className="flex items-center gap-1.5 px-4 py-2 bg-warning-muted text-warning border border-[rgba(var(--color-warning),0.3)] rounded-lg hover:bg-[rgb(var(--color-warning))]/30 transition-colors text-xs font-medium"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Another Goal
              </button>
            </div>
          </form>
          )}
      </div>
    </ModalShell>
  );
}

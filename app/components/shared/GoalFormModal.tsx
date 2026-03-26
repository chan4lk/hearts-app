'use client';

import React from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { BsListTask, BsPeople, BsCalendar, BsArrowCounterclockwise } from 'react-icons/bs';
import { ModalShell, FORM_STYLES, FormField, FormActions } from '@/app/components/ui/form-primitives';
import { User } from '@/app/components/shared/types';
import { CATEGORIES, DEPARTMENTS, PRIORITIES } from './constants';
import { AIGoalSuggestions } from './AIGoalSuggestions';

interface GoalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  assignedEmployees: User[];
  loading: boolean;
  formData: {
    title: string;
    description: string;
    dueDate: string;
    employeeId: string;
    category: string;
    department: string;
    priority: string;
  };
  onFormDataChange: (field: string, value: string) => void;
  errors: { title?: string; category?: string; employeeId?: string; department?: string; priority?: string };
  isEditMode: boolean;
  context: string;
  onContextChange: (value: string) => void;
  onReset: () => void;
  onTemplateClick?: () => void;
}

const selectContentClass = 'bg-surface-elevated border-theme z-[100] max-h-[min(14rem,45vh)]';

const FORM_ID = 'goal-form';

export function GoalFormModal({
  isOpen,
  onClose,
  onSubmit,
  assignedEmployees,
  loading,
  formData,
  onFormDataChange,
  errors,
  isEditMode,
  context,
  onContextChange,
  onReset,
  onTemplateClick
}: GoalFormModalProps) {
  // Lock body scroll when modal is open
  React.useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  return (
    <ModalShell
      open={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Update Goal' : 'Create Goal'}
      icon={<BsListTask className="w-4 h-4" />}
      maxWidth="max-w-lg"
      footer={
        <div className="flex items-center gap-2 w-full">
          <Button
            type="button"
            variant="outline"
            onClick={onReset}
            className={FORM_STYLES.btnSecondary}
          >
            <BsArrowCounterclockwise className="h-3.5 w-3.5" />
            Reset
          </Button>
          {!isEditMode && onTemplateClick && (
            <Button
              type="button"
              variant="outline"
              onClick={onTemplateClick}
              className={FORM_STYLES.btnSecondary}
            >
              <BsListTask className="h-3.5 w-3.5" />
              Templates
            </Button>
          )}
          <div className="flex-1" />
          <FormActions
            onCancel={onClose}
            submitLabel={isEditMode ? 'Update Goal' : 'Create Goal'}
            loading={loading}
            formId={FORM_ID}
          />
        </div>
      }
    >
      <form id={FORM_ID} onSubmit={onSubmit} className="space-y-5">
        {/* Section 1: Goal Details */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider">Goal Details</h3>

          <FormField label="Goal Title" required error={errors.title}>
            <Input
              value={formData.title}
              onChange={(e) => onFormDataChange('title', e.target.value)}
              placeholder="Enter goal title"
              className={FORM_STYLES.input}
            />
          </FormField>

          <FormField label="Description">
            <Textarea
              value={formData.description}
              onChange={(e) => onFormDataChange('description', e.target.value)}
              placeholder="Describe the goal details..."
              className={`${FORM_STYLES.textarea} min-h-[80px]`}
            />
            <AIGoalSuggestions
              category={formData.category}
              context={context}
              onSuggestionSelect={(s) => {
                onFormDataChange('title', s.title);
                onFormDataChange('description', s.description);
              }}
            />
          </FormField>
        </div>

        {/* Divider */}
        <div className="border-t border-theme my-4" />

        {/* Section 2: Classification */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider">Classification</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Category" required error={errors.category}>
              <Select
                value={formData.category}
                onValueChange={(v) => onFormDataChange('category', v)}
              >
                <SelectTrigger className={FORM_STYLES.select}>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className={selectContentClass}>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value} className="text-primary text-xs">
                      <span className="flex items-center gap-2">
                        {React.createElement(c.icon, { className: c.iconColor })}
                        {c.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Priority" required error={errors.priority}>
              <Select
                value={formData.priority}
                onValueChange={(v) => onFormDataChange('priority', v)}
              >
                <SelectTrigger className={FORM_STYLES.select}>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent className={selectContentClass}>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value} className="text-primary text-xs">
                      <span className="flex items-center gap-2">
                        {React.createElement(p.icon, { className: p.iconColor })}
                        {p.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <FormField label="Department" required error={errors.department}>
            <Select
              value={formData.department}
              onValueChange={(v) => onFormDataChange('department', v)}
            >
              <SelectTrigger className={FORM_STYLES.select}>
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent className={selectContentClass}>
                {DEPARTMENTS.map((d) => (
                  <SelectItem key={d.value} value={d.value} className="text-primary text-xs">
                    <span className="flex items-center gap-2">
                      {React.createElement(d.icon, { className: d.iconColor })}
                      {d.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>

        {/* Divider */}
        <div className="border-t border-theme my-4" />

        {/* Section 3: Assignment */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider">Assignment</h3>

          {assignedEmployees.length > 0 && (
            <FormField label="Employee" required error={errors.employeeId}>
              <Select
                value={formData.employeeId}
                onValueChange={(v) => onFormDataChange('employeeId', v)}
              >
                <SelectTrigger className={FORM_STYLES.select}>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent className={selectContentClass}>
                  {assignedEmployees.map((e) => (
                    <SelectItem key={e.id} value={e.id} className="text-primary text-xs">
                      <span className="flex items-center gap-2">
                        <BsPeople className="h-3 w-3 text-warning" />
                        {e.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          )}

          <FormField label="Due Date">
            <div className="relative">
              <BsCalendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-tertiary pointer-events-none" />
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => onFormDataChange('dueDate', e.target.value)}
                className={`${FORM_STYLES.input} pl-9`}
              />
            </div>
          </FormField>
        </div>
      </form>
    </ModalShell>
  );
}

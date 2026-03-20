'use client';

import React from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { BsListTask, BsPeople, BsCalendar, BsX, BsArrowCounterclockwise } from 'react-icons/bs';
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 modal-overlay z-[60] flex items-center justify-center p-3 overflow-hidden">
      <div className="modal-content rounded-xl w-full max-w-md shadow-2xl border border-theme flex flex-col max-h-[90vh] min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-theme bg-black/20 shrink-0">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 p-1.5 rounded-lg">
              <BsListTask className="w-4 h-4 text-amber-400" />
            </div>
            <h2 className="text-sm font-semibold text-primary">{isEditMode ? 'Update Goal' : 'Create Goal'}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-tertiary hover:text-primary hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <BsX className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col min-h-0 flex-1 flex-nowrap">
          {/* FIXED SECTION: All dropdowns live here – no scroll, so dropdowns never get clipped */}
          <div className="shrink-0 px-4 py-3 border-b border-theme bg-black/10 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-secondary mb-1">Category</label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => onFormDataChange('category', v)}
                >
                  <SelectTrigger className="bg-black/20 border-theme text-primary text-xs h-9 rounded-lg">
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
                {errors.category && <p className="text-red-400 text-[10px] mt-0.5">{errors.category}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-secondary mb-1">Department</label>
                <Select
                  value={formData.department}
                  onValueChange={(v) => onFormDataChange('department', v)}
                >
                  <SelectTrigger className="bg-black/20 border-theme text-primary text-xs h-9 rounded-lg">
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
                {errors.department && <p className="text-red-400 text-[10px] mt-0.5">{errors.department}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-secondary mb-1">Priority</label>
                <Select
                  value={formData.priority}
                  onValueChange={(v) => onFormDataChange('priority', v)}
                >
                  <SelectTrigger className="bg-black/20 border-theme text-primary text-xs h-9 rounded-lg">
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
                {errors.priority && <p className="text-red-400 text-[10px] mt-0.5">{errors.priority}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-secondary mb-1">Employee</label>
                <Select
                  value={formData.employeeId}
                  onValueChange={(v) => onFormDataChange('employeeId', v)}
                >
                  <SelectTrigger className="bg-black/20 border-theme text-primary text-xs h-9 rounded-lg">
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent className={selectContentClass}>
                    {assignedEmployees.map((e) => (
                      <SelectItem key={e.id} value={e.id} className="text-primary text-xs">
                        <span className="flex items-center gap-2">
                          <BsPeople className="h-3 w-3 text-amber-400/70" />
                          {e.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.employeeId && <p className="text-red-400 text-[10px] mt-0.5">{errors.employeeId}</p>}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary mb-1">Due Date</label>
              <div className="relative">
                <BsCalendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-amber-400/70 pointer-events-none" />
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => onFormDataChange('dueDate', e.target.value)}
                  className="bg-black/20 border-theme text-primary text-xs h-9 rounded-lg pl-9"
                />
              </div>
            </div>
          </div>

          {/* SCROLLABLE SECTION: Only title + description (no dropdowns here) */}
          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3">
            <div>
              <label className="block text-xs font-medium text-secondary mb-1">Goal Title</label>
              <Input
                value={formData.title}
                onChange={(e) => onFormDataChange('title', e.target.value)}
                placeholder="Enter goal title"
                className="bg-black/20 border-theme text-primary text-xs h-9 rounded-lg"
              />
              {errors.title && <p className="text-red-400 text-[10px] mt-0.5">{errors.title}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary mb-1">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => onFormDataChange('description', e.target.value)}
                placeholder="Describe the goal details..."
                className="bg-black/20 border-theme text-white text-xs min-h-[80px] rounded-lg resize-none"
              />
              <AIGoalSuggestions
                category={formData.category}
                context={context}
                onSuggestionSelect={(s) => {
                  onFormDataChange('title', s.title);
                  onFormDataChange('description', s.description);
                }}
              />
            </div>
          </div>

          {/* Fixed footer */}
          <div className="shrink-0 px-4 py-3 border-t border-theme bg-black/10 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onReset}
              className="bg-black/20 hover:bg-black/30 border-theme text-secondary text-xs h-9 rounded-lg"
            >
              <BsArrowCounterclockwise className="h-3.5 w-3.5 mr-1.5" />
              Reset
            </Button>
            {!isEditMode && onTemplateClick && (
              <Button
                type="button"
                variant="outline"
                onClick={onTemplateClick}
                className="bg-black/20 hover:bg-black/30 border-theme text-secondary text-xs h-9 rounded-lg"
              >
                <BsListTask className="h-3.5 w-3.5 mr-1.5" />
                Templates
              </Button>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 min-w-[120px] bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs h-9 rounded-lg font-medium"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {isEditMode ? 'Updating...' : 'Creating...'}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <BsListTask className="h-3.5 w-3.5" />
                  {isEditMode ? 'Update Goal' : 'Create Goal'}
                </span>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="bg-black/20 hover:bg-black/30 border-theme text-secondary text-xs h-9 rounded-lg"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, GoalFormData } from './types';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { CATEGORIES, DEPARTMENTS, PRIORITIES, GOAL_TEMPLATES } from './constants';

const selectContentClass = 'bg-[#1a1b1e] border border-gray-700 text-white z-[100] max-h-[min(14rem,45vh)]';
const selectTriggerClass = 'bg-black/20 border border-gray-800/50 text-white text-xs h-9 rounded-lg focus:border-amber-500/50 focus:ring-amber-500/20';
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
      console.error('Error creating bulk goals:', error);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-1 sm:p-3 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-gradient-to-br from-[#1a1b1e] to-[#2a2b2e] rounded-lg sm:rounded-xl w-full max-w-4xl shadow-2xl border border-gray-800/50 max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800/50 bg-black/20">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 p-1.5 rounded-lg">
              <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h2 className="text-sm font-medium text-white">Create Multiple Goals</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/70 hover:text-white"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-3 py-2 bg-black/10 border-b border-gray-800/30">
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'manual'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            Manual Entry ({goals.length})
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'templates'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            Templates
          </button>
        </div>

        {/* Content - lock scroll when a dropdown is open so dark dropdown stays visible */}
        <div className={`p-3 max-h-[calc(90vh-140px)] ${anySelectOpen ? 'overflow-hidden' : 'overflow-y-auto'}`}>
          {activeTab === 'templates' ? (
            <div className="space-y-4">
              {/* Employee Selection for Templates */}
              <div className="bg-black/10 rounded-lg p-3 border border-gray-800/30">
                <h3 className="text-sm font-medium text-white mb-2">
                  Select Employees ({selectedEmployees.length} selected)
                </h3>
                {assignedEmployees.length === 0 ? (
                  <p className="text-xs text-white/50">No employees available</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {assignedEmployees.map(employee => (
                      <label key={employee.id} className="flex items-center gap-2 text-xs text-white/70 hover:text-white cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedEmployees.includes(employee.id)}
                          onChange={() => handleEmployeeToggle(employee.id)}
                          className="rounded border-gray-600 text-amber-500 focus:ring-amber-500/20"
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
                    className="p-3 bg-black/20 border border-gray-800/50 rounded-lg text-left hover:bg-black/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="text-sm font-medium text-white">{template.title}</div>
                    <div className="text-xs text-white/60">{template.category} • {template.subtitle}</div>
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
                  className="bg-black/20 rounded-lg p-3 border border-gray-800/50"
                >
                  {/* Goal Header */}
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-white">
                      Goal #{index + 1}
                    </h3>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => duplicateGoal(goal.id)}
                        className="p-1 text-amber-400/70 hover:text-amber-400 hover:bg-amber-500/10 rounded transition-colors"
                        title="Duplicate Goal"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                      {goals.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeGoal(goal.id)}
                          className="p-1 text-red-400/70 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                          title="Remove Goal"
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
                        <label className="block text-[11px] font-medium text-white/70 mb-1">Goal Title *</label>
                        <Input
                          value={goal.title}
                          onChange={(e) => updateGoal(goal.id, 'title', e.target.value)}
                          placeholder="Enter goal title"
                          className="bg-black/20 border-gray-800/50 text-white text-xs h-7 rounded-lg focus:border-amber-500/50 focus:ring-amber-500/20"
                        />
                        {errors[goal.id]?.title && (
                          <div className="text-red-400 text-[10px] mt-1 font-semibold animate-pulse">{errors[goal.id].title}</div>
                        )}
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-white/70 mb-1">Employee *</label>
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
                              <SelectItem key={emp.id} value={emp.id} className="text-white focus:bg-white/10 focus:text-white">
                                {emp.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors[goal.id]?.employeeId && (
                          <div className="text-red-400 text-[10px] mt-1 font-semibold animate-pulse">{errors[goal.id].employeeId}</div>
                        )}
                      </div>
                    </div>

                    {/* Category, Department, Priority - dark dropdown for clear view */}
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[11px] font-medium text-white/70 mb-1">Category</label>
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
                              <SelectItem key={c.value} value={c.value} className="text-white focus:bg-white/10 focus:text-white">
                                {c.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-white/70 mb-1">Department</label>
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
                              <SelectItem key={d.value} value={d.value} className="text-white focus:bg-white/10 focus:text-white">
                                {d.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-white/70 mb-1">Priority</label>
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
                              <SelectItem key={p.value} value={p.value} className="text-white focus:bg-white/10 focus:text-white">
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
                        <label className="block text-[11px] font-medium text-white/70 mb-1">Due Date</label>
                        <Input
                          type="date"
                          value={goal.dueDate}
                          onChange={(e) => updateGoal(goal.id, 'dueDate', e.target.value)}
                          className="bg-black/20 border-gray-800/50 text-white text-xs h-7 rounded-lg focus:border-amber-500/50 focus:ring-amber-500/20"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-medium text-white/70 mb-1">Description</label>
                        <Textarea
                          value={goal.description}
                          onChange={(e) => updateGoal(goal.id, 'description', e.target.value)}
                          placeholder="Describe the goal..."
                          className="bg-black/20 border-gray-800/50 text-white text-xs min-h-[28px] rounded-lg focus:border-amber-500/50 focus:ring-amber-500/20 resize-none"
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
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg hover:bg-amber-500/30 transition-colors text-xs font-medium"
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

        {/* Footer */}
        {activeTab === 'manual' && (
          <div className="bg-black/10 px-3 py-2 flex items-center justify-between border-t border-gray-800/30">
            <div className="text-xs text-white/60">
              {goals.length} goal(s) ready to create
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-3 py-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="bulk-goal-form"
                disabled={isSubmitting || loading || goals.length === 0}
                className="px-4 py-1.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg hover:bg-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 text-xs font-medium"
              >
                {isSubmitting ? (
                  <>
                    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating...
                  </>
                ) : (
                  `Create ${goals.length} Goal(s)`
                )}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="bg-black/10 px-3 py-2 flex items-center justify-between border-t border-gray-800/30">
            <div className="text-xs text-white/60">
              Use templates to quickly create goals for multiple employees
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="px-3 py-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-xs"
            >
              Close
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

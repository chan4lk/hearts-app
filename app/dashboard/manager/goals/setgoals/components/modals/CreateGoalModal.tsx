'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BsListTask, BsPeople, BsCalendar, BsX, BsArrowCounterclockwise, BsPlus, BsRobot, BsLightning, BsPencil } from 'react-icons/bs';
import { toast } from 'sonner';
import { User, GoalFormData } from '../types';
import { CATEGORIES } from '../constants';
import { AIGoalSuggestions } from '@/app/components/shared/AIGoalSuggestions';

interface GoalModalProps {
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

export function GoalModal({
  isOpen,
  onClose,
  onSubmit,
  assignedEmployees,
  loading,
  formData,
  setFormData,
  mode = 'create',
  initialData
}: GoalModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [context, setContext] = useState('');
  const [initialEditData, setInitialEditData] = useState<GoalFormData | null>(null);

  useEffect(() => {
    if (mode === 'edit') {
      setInitialEditData({ ...formData });
    } else {
      setInitialEditData(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const handleGenerate = async () => {
    if (!formData.employeeId) {
      toast.error('Please select an employee first');
      return;
    }

    const selectedEmployee = assignedEmployees.find(e => e.id === formData.employeeId);
    if (!selectedEmployee) {
      toast.error('Selected employee not found');
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
      toast.success('Goal generated successfully!');
    } catch (error) {
      console.error('Error generating goal:', error);
      toast.error('Failed to generate goal. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  const isEditMode = mode === 'edit';

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3">
      <div className="bg-gradient-to-br from-[#1a1b1e] to-[#2a2b2e] rounded-xl w-full max-w-sm shadow-2xl border border-gray-800/50">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800/50 bg-black/20">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 p-1.5 rounded-lg">
              <BsListTask className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <h2 className="text-sm font-medium text-white">{isEditMode ? 'Update Goal' : 'Create Goal'}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white/70 transition-colors"
          >
            <BsX className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-3 space-y-3 max-h-[80vh] overflow-y-auto">
          {/* Title & Category Row */}
          <div className="space-y-2">
            <div>
              <label className="block text-[10px] font-medium text-white/70 mb-1">Goal Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter goal title"
                className="bg-black/20 border-gray-800/50 text-white text-xs h-7 rounded-lg focus:border-amber-500/50 focus:ring-amber-500/20"
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-white/70 mb-1">Category</label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger className="bg-black/20 border-gray-800/50 text-white text-xs h-7 rounded-lg focus:border-amber-500/50 focus:ring-amber-500/20">
                  <SelectValue>{CATEGORIES.find(c => c.value === formData.category)?.label || 'Select category'}</SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-[#1a1b1e] border-gray-800/50">
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value} className="text-white text-xs">
                      <div className="flex items-center gap-1.5">{category.icon}<span>{category.label}</span></div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date & Employee Row */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-medium text-white/70 mb-1">Due Date</label>
              <div className="relative">
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="bg-black/20 border-gray-800/50 text-white text-xs h-7 rounded-lg pl-7 focus:border-amber-500/50 focus:ring-amber-500/20"
                />
                <BsCalendar className="absolute left-2 top-1/2 transform -translate-y-1/2 text-amber-400/70 h-3 w-3" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-medium text-white/70 mb-1">Employee</label>
              <Select
                value={formData.employeeId}
                onValueChange={(value) => setFormData({ ...formData, employeeId: value })}
              >
                <SelectTrigger className="bg-black/20 border-gray-800/50 text-white text-xs h-7 rounded-lg focus:border-amber-500/50 focus:ring-amber-500/20">
                  <SelectValue>{assignedEmployees.find(e => e.id === formData.employeeId)?.name || 'Select'}</SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-[#1a1b1e] border-gray-800/50 max-h-40">
                  {assignedEmployees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id} className="text-white text-xs">
                      <div className="flex items-center gap-1.5">
                        <BsPeople className="h-2.5 w-2.5 text-amber-400/70" />
                        <span className="truncate">{employee.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-medium text-white/70 mb-1 flex items-center gap-1">
              <BsListTask className="h-2.5 w-2.5" /> Description
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the goal details..."
              className="bg-black/20 border-gray-800/50 text-white text-xs min-h-[50px] rounded-lg focus:border-amber-500/50 focus:ring-amber-500/20 resize-none"
            />
          </div>

          {/* AI Context - Always show in both modes */}
          <div>
            <label className="block text-[10px] font-medium text-blue-400/90 mb-1 flex items-center gap-1">
              <BsRobot className="h-2.5 w-2.5" /> AI Context (Optional)
            </label>
            <Textarea
              value={context}
              onChange={e => setContext(e.target.value)}
              placeholder="Additional context for AI suggestions..."
              className="bg-black/20 border-gray-800/50 text-white text-xs min-h-[35px] rounded-lg focus:border-amber-500/50 focus:ring-amber-500/20 resize-none"
            />
          </div>

          {/* AI Suggestions - Always show in both modes */}
          <div className="bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-lg p-2 border border-blue-500/20">
            <AIGoalSuggestions
              category={formData.category}
              context={context}
              onSuggestionSelect={(suggestion: { title: string; description: string }) => setFormData(prev => ({ ...prev, title: suggestion.title, description: suggestion.description }))}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-1.5 pt-2 border-t border-gray-800/50">
            <div className="flex gap-1.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (isEditMode && initialEditData) {
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
                }}
                className="flex-1 bg-black/20 hover:bg-black/30 border-gray-800/50 text-white/70 text-xs h-7 rounded-lg transition-colors"
              >
                <BsArrowCounterclockwise className="h-2.5 w-2.5 mr-1" />
                Reset
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-[#4c49ed]/90 to-[#6366f1]/90 hover:from-[#4644e5] hover:to-[#5b5be6] text-white text-xs h-7 rounded-lg font-medium transition-all duration-200"
              >
                {loading ? (
                  <div className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {isEditMode ? 'Updating...' : 'Creating...'}
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <BsListTask className="h-2.5 w-2.5" />
                    {isEditMode ? 'Update Goal' : 'Create Goal'}
                  </div>
                )}
              </Button>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-full bg-black/20 hover:bg-black/30 border-gray-800/50 text-white/70 text-xs h-7 rounded-lg transition-colors"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 
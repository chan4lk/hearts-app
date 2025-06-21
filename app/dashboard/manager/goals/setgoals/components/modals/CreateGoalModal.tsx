'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BsListTask, BsPeople, BsCalendar, BsX, BsArrowCounterclockwise, BsPlus, BsRobot, BsLightning } from 'react-icons/bs';
import { toast } from 'sonner';
import { User, GoalFormData } from '../types';
import { CATEGORIES } from '../constants';
import { AIGoalSuggestions } from '@/app/components/shared/AIGoalSuggestions';

interface CreateGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: GoalFormData) => Promise<void>;
  assignedEmployees: User[];
  loading: boolean;
  formData: GoalFormData;
  setFormData: React.Dispatch<React.SetStateAction<GoalFormData>>;
}

export function CreateGoalModal({
  isOpen,
  onClose,
  onSubmit,
  assignedEmployees,
  loading,
  formData,
  setFormData
}: CreateGoalModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [context, setContext] = useState('');

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

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-[#1a1b1e] to-[#2a2b2e] rounded-2xl w-full max-w-md shadow-2xl border border-gray-800/50">
        {/* Header */}
        <div className="relative p-4 border-b border-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-2 rounded-xl">
              <BsListTask className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-white">Create Goal</h2>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-800/50"
          >
            <BsX className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Title & Category Row */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">Goal Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter goal title"
                className="bg-[#23242a] border-gray-700 text-white text-sm h-9 rounded-lg focus:border-amber-500/50 focus:ring-amber-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">Category</label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger className="bg-[#23242a] border-gray-700 text-white text-sm h-9 rounded-lg focus:border-amber-500/50 focus:ring-amber-500/20">
                  <SelectValue>{CATEGORIES.find(c => c.value === formData.category)?.label || 'Select category'}</SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-[#23242a] border-gray-700">
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value} className="text-white text-sm">
                      <div className="flex items-center gap-2">{category.icon}<span>{category.label}</span></div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date & Employee Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">Due Date</label>
              <div className="relative">
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="bg-[#23242a] border-gray-700 text-white text-sm h-9 rounded-lg pl-8 focus:border-amber-500/50 focus:ring-amber-500/20"
                />
                <BsCalendar className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">Employee</label>
              <Select
                value={formData.employeeId}
                onValueChange={(value) => setFormData({ ...formData, employeeId: value })}
              >
                <SelectTrigger className="bg-[#23242a] border-gray-700 text-white text-sm h-9 rounded-lg focus:border-amber-500/50 focus:ring-amber-500/20">
                  <SelectValue>{assignedEmployees.find(e => e.id === formData.employeeId)?.name || 'Select'}</SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-[#23242a] border-gray-700 max-h-48">
                  {assignedEmployees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id} className="text-white text-sm">
                      <div className="flex items-center gap-2">
                        <BsPeople className="h-3 w-3 text-gray-400" />
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
            <label className="block text-xs font-medium text-gray-300 mb-1.5 flex items-center gap-1.5">
              <BsListTask className="h-3 w-3" /> Description
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the goal details..."
              className="bg-[#23242a] border-gray-700 text-white text-sm min-h-[60px] rounded-lg focus:border-amber-500/50 focus:ring-amber-500/20 resize-none"
            />
          </div>

          {/* AI Context */}
          <div>
            <label className="block text-xs font-medium text-blue-300 mb-1.5 flex items-center gap-1.5">
              <BsRobot className="h-3 w-3" /> AI Context (Optional)
            </label>
            <Textarea
              value={context}
              onChange={e => setContext(e.target.value)}
              placeholder="Additional context for AI suggestions..."
              className="bg-[#23242a] border-gray-700 text-white text-sm min-h-[40px] rounded-lg focus:border-amber-500/50 focus:ring-amber-500/20 resize-none"
            />
          </div>

          {/* AI Suggestions */}
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-3 border border-blue-500/20">
            <AIGoalSuggestions
              category={formData.category}
              context={context}
              onSuggestionSelect={(suggestion: { title: string; description: string }) => setFormData(prev => ({ ...prev, title: suggestion.title, description: suggestion.description }))}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-2">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFormData({
                    title: '',
                    description: '',
                    dueDate: new Date().toISOString().split('T')[0],
                    employeeId: '',
                    category: 'PROFESSIONAL'
                  });
                  setContext('');
                }}
                className="flex-1 bg-transparent hover:bg-gray-800/50 border-gray-700 text-gray-300 text-sm h-9 rounded-lg transition-colors"
              >
                <BsArrowCounterclockwise className="h-3 w-3 mr-1.5" />
                Reset
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-[#4c49ed] to-[#6366f1] hover:from-[#4644e5] hover:to-[#5b5be6] text-white text-sm h-9 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <BsLightning className="h-3 w-3" />
                    Create Goal
                  </div>
                )}
              </Button>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-full bg-transparent hover:bg-gray-800/50 border-gray-700 text-gray-300 text-sm h-9 rounded-lg transition-colors"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 
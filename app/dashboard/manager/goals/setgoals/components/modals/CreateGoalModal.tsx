'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BsListTask, BsPeople, BsCalendar, BsX, BsArrowCounterclockwise, BsPlus, BsRobot } from 'react-icons/bs';
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center pt-16">
      <div className="bg-[#1a1b1e] rounded-lg w-full max-w-xl mx-4">
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-amber-500/10 p-2 rounded-lg">
                <BsListTask className="w-5 h-5 text-amber-400" />
              </div>
              <h2 className="text-2xl font-semibold text-white">Create New Goal</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <BsX className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Goal title"
                  className="bg-[#23242a] border-0 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger className="bg-[#23242a] border-0 text-white">
                    <SelectValue>{CATEGORIES.find(c => c.value === formData.category)?.label || 'Select category'}</SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-[#23242a] border border-gray-700">
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value} className="text-white">
                        <div className="flex items-center gap-2">{category.icon}<span>{category.label}</span></div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Due Date</label>
                <div className="relative">
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="bg-[#23242a] border-0 text-white pl-10"
                  />
                  <BsCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Employee</label>
                <Select
                  value={formData.employeeId}
                  onValueChange={(value) => setFormData({ ...formData, employeeId: value })}
                >
                  <SelectTrigger className="bg-[#23242a] border-0 text-white">
                    <SelectValue>{assignedEmployees.find(e => e.id === formData.employeeId)?.name || 'Select employee'}</SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-[#23242a] border border-gray-700">
                    {assignedEmployees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id} className="text-white">
                        <div className="flex items-center gap-2">
                          <BsPeople className="h-4 w-4 text-gray-400" />
                          <span>{employee.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2"><BsListTask className="inline-block" /> Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the goal"
                className="bg-[#23242a] border-0 text-white min-h-[80px]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-blue-300 mb-2 flex items-center gap-2">
                <BsRobot className="inline-block" /> Additional Context (Optional)
              </label>
              <Textarea
                value={context}
                onChange={e => setContext(e.target.value)}
                placeholder="Add any additional context for AI suggestions..."
                className="bg-[#23242a] border-0 text-white min-h-[50px]"
              />
            </div>
            <AIGoalSuggestions
              category={formData.category}
              context={context}
              onSuggestionSelect={(suggestion: { title: string; description: string }) => setFormData(prev => ({ ...prev, title: suggestion.title, description: suggestion.description }))}
            />
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="bg-transparent hover:bg-gray-800 border-gray-700 text-gray-300"
              >
                Cancel
              </Button>
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
                className="bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-400 flex items-center gap-2 transition-colors"
              >
                <BsArrowCounterclockwise className="h-4 w-4" />
                Reset
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-[#4c49ed] hover:bg-[#4644e5] text-white"
              >
                Save Goal
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 
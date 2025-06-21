import { useState } from 'react';
import { User } from '../types';
import { CATEGORIES } from '../constants';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AIGoalSuggestions } from '@/app/components/shared/AIGoalSuggestions';
import { z } from 'zod';
import { 
  BsListTask, 
  BsTag, 
  BsCalendar, 
  BsPeople, 
  BsStars, 
  BsRocket, 
  BsLightbulb, 
  BsAward, 
  BsGraphUp, 
  BsBriefcase, 
  BsCheckCircle, 
  BsArrowCounterclockwise,
  BsInfoCircle,
  BsXCircle,
  BsLightning
} from 'react-icons/bs';

const goalSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  employeeId: z.string().min(1, 'Employee is required'),
  context: z.string().optional(),
});

interface GoalFormProps {
  initialData?: {
    title: string;
    description: string;
    dueDate: string;
    employeeId: string;
    category: string;
  };
  users: User[];
  onSubmit: (data: {
    title: string;
    description: string;
    dueDate: string;
    employeeId: string;
    category: string;
  }) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  title: string;
}

export function GoalForm({
  initialData = {
    title: '',
    description: '',
    dueDate: new Date().toISOString().split('T')[0],
    employeeId: '',
    category: 'PROFESSIONAL'
  },
  users,
  onSubmit,
  onCancel,
  loading,
  title
}: GoalFormProps) {
  const [formData, setFormData] = useState({
    title: initialData.title,
    description: initialData.description,
    category: initialData.category,
    dueDate: initialData.dueDate,
    employeeId: initialData.employeeId,
    context: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const validationResult = goalSchema.safeParse(formData);
      if (!validationResult.success) {
        const newErrors: Record<string, string> = {};
        validationResult.error.errors.forEach((err) => {
          newErrors[err.path[0]] = err.message;
        });
        setErrors(newErrors);
        return;
      }

      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to submit form' });
    }
  };

  const handleReset = () => {
    setFormData({
      title: '',
      description: '',
      category: 'PROFESSIONAL',
      dueDate: new Date().toISOString().split('T')[0],
      employeeId: '',
      context: ''
    });
    setErrors({});
  };

  const handleSuggestionSelect = (suggestion: { title: string; description: string }) => {
    setFormData(prev => ({
      ...prev,
      title: suggestion.title,
      description: suggestion.description
    }));
    setErrors(prev => ({
      ...prev,
      title: '',
      description: ''
    }));
  };

  return (
    <div className="bg-gradient-to-br from-[#1a1b1e] to-[#2a2b2e] rounded-2xl shadow-2xl border border-gray-800/50">
      {/* Header */}
      <div className="relative p-4 border-b border-gray-800/50">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-2 rounded-xl">
            <BsListTask className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-300 mb-1.5 flex items-center gap-1.5">
              <BsListTask className="h-3 w-3" /> Title
            </label>
            <div className="relative">
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter goal title"
                className={`bg-[#23242a] border-gray-700 text-white text-sm h-9 rounded-lg focus:border-amber-500/50 focus:ring-amber-500/20 ${
                  errors.title ? 'border-red-500' : ''
                }`}
              />
              {errors.title && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <BsXCircle className="h-4 w-4 text-red-400" />
                </div>
              )}
            </div>
            {errors.title && (
              <p className="text-xs text-red-400 flex items-center gap-1 bg-red-900/20 px-2 py-1 rounded">
                <BsInfoCircle className="h-3 w-3" />
                {errors.title}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-300 mb-1.5 flex items-center gap-1.5">
              <BsTag className="h-3 w-3" /> Category
            </label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger className={`bg-[#23242a] border-gray-700 text-white text-sm h-9 rounded-lg focus:border-amber-500/50 focus:ring-amber-500/20 ${
                errors.category ? 'border-red-500' : ''
              }`}>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="bg-[#23242a] border-gray-700">
                {CATEGORIES.map((category) => (
                  <SelectItem 
                    key={category.value} 
                    value={category.value}
                    className="text-white text-sm hover:bg-gray-700"
                  >
                    <div className="flex items-center gap-2">
                      {category.value === 'PROFESSIONAL' && <BsBriefcase className="h-4 w-4 text-blue-400" />}
                      {category.value === 'TECHNICAL' && <BsLightbulb className="h-4 w-4 text-amber-400" />}
                      {category.value === 'LEADERSHIP' && <BsAward className="h-4 w-4 text-purple-400" />}
                      {category.value === 'PERSONAL' && <BsGraphUp className="h-4 w-4 text-green-400" />}
                      {category.value === 'TRAINING' && <BsRocket className="h-4 w-4 text-rose-400" />}
                      {category.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-xs text-red-400 flex items-center gap-1 bg-red-900/20 px-2 py-1 rounded">
                <BsInfoCircle className="h-3 w-3" />
                {errors.category}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-300 mb-1.5 flex items-center gap-1.5">
              <BsCalendar className="h-3 w-3" /> Due Date
            </label>
            <div className="relative">
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                className={`bg-[#23242a] border-gray-700 text-white text-sm h-9 rounded-lg pl-8 focus:border-amber-500/50 focus:ring-amber-500/20 ${
                  errors.dueDate ? 'border-red-500' : ''
                }`}
              />
              <BsCalendar className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              {errors.dueDate && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <BsXCircle className="h-4 w-4 text-red-400" />
                </div>
              )}
            </div>
            {errors.dueDate && (
              <p className="text-xs text-red-400 flex items-center gap-1 bg-red-900/20 px-2 py-1 rounded">
                <BsInfoCircle className="h-3 w-3" />
                {errors.dueDate}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-300 mb-1.5 flex items-center gap-1.5">
              <BsPeople className="h-3 w-3" /> Employee
            </label>
            <Select
              value={formData.employeeId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, employeeId: value }))}
            >
              <SelectTrigger className={`bg-[#23242a] border-gray-700 text-white text-sm h-9 rounded-lg focus:border-amber-500/50 focus:ring-amber-500/20 ${
                errors.employeeId ? 'border-red-500' : ''
              }`}>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent className="bg-[#23242a] border-gray-700 max-h-48">
                {users
                  .filter(user => user.role !== 'ADMIN')
                  .map((user) => (
                    <SelectItem 
                      key={user.id} 
                      value={user.id}
                      className="text-white text-sm hover:bg-gray-700"
                    >
                      <div className="flex items-center gap-2">
                        {user.role === 'EMPLOYEE' && <BsPeople className="h-4 w-4 text-blue-400" />}
                        {user.role === 'MANAGER' && <BsStars className="h-4 w-4 text-purple-400" />}
                        <div>
                          <span className="font-medium">{user.name}</span>
                          <span className="text-xs text-gray-400 ml-2">({user.email})</span>
                        </div>
                      </div>
                    </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.employeeId && (
              <p className="text-xs text-red-400 flex items-center gap-1 bg-red-900/20 px-2 py-1 rounded">
                <BsInfoCircle className="h-3 w-3" />
                {errors.employeeId}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-300 mb-1.5 flex items-center gap-1.5">
            <BsListTask className="h-3 w-3" /> Description
          </label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe the goal details..."
            className={`bg-[#23242a] border-gray-700 text-white text-sm min-h-[60px] rounded-lg focus:border-amber-500/50 focus:ring-amber-500/20 resize-none ${
              errors.description ? 'border-red-500' : ''
            }`}
          />
          {errors.description && (
            <p className="text-xs text-red-400 flex items-center gap-1 bg-red-900/20 px-2 py-1 rounded">
              <BsInfoCircle className="h-3 w-3" />
              {errors.description}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-medium text-blue-300 mb-1.5 flex items-center gap-1.5">
            <BsStars className="h-3 w-3" /> Additional Context (Optional)
          </label>
          <Textarea
            value={formData.context}
            onChange={(e) => setFormData(prev => ({ ...prev, context: e.target.value }))}
            placeholder="Add any additional context for AI suggestions..."
            className="bg-[#23242a] border-gray-700 text-white text-sm min-h-[40px] rounded-lg focus:border-amber-500/50 focus:ring-amber-500/20 resize-none"
          />
        </div>

        {/* AI Suggestions */}
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-3 border border-blue-500/20">
          <AIGoalSuggestions
            category={formData.category}
            context={formData.context}
            onSuggestionSelect={handleSuggestionSelect}
          />
        </div>

        {errors.submit && (
          <Alert variant="destructive" className="bg-red-900/50 border-red-800">
            <AlertDescription className="text-red-200">{errors.submit}</AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-2">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={loading}
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
                  Save Goal
                </div>
              )}
            </Button>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="w-full bg-transparent hover:bg-gray-800/50 border-gray-700 text-gray-300 text-sm h-9 rounded-lg transition-colors"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
} 
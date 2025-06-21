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
    <div className="">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#4a5681]/90 rounded-t-lg">
        <div className="p-1.5 rounded-md bg-[#c3935a]">
          <BsListTask className="w-3.5 h-3.5 text-white" />
        </div>
        <h2 className="text-sm font-medium text-white tracking-wide">{title}</h2>
      </div>

      {/* Form */}
      <div className="bg-[#4a5681]/80 rounded-b-lg">
        <form onSubmit={handleSubmit} className="flex flex-col">
          {/* Main Form Fields - Always Visible */}
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {/* Title Field - Full Width */}
              <div className="lg:col-span-2 space-y-1">
                <label className="text-[10px] font-medium text-gray-300 flex items-center gap-1">
                  <BsListTask className="h-2.5 w-2.5" /> Title
                </label>
                <div className="relative">
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter goal title"
                    className={`bg-[#1e1f23] border-gray-700/50 text-white text-xs h-8 rounded-md focus:border-amber-500/50 focus:ring-amber-500/20 ${
                      errors.title ? 'border-red-500/50' : ''
                    }`}
                  />
                  {errors.title && <BsXCircle className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-red-400" />}
                </div>
                {errors.title && (
                  <p className="text-[10px] text-red-400 flex items-center gap-1 bg-red-900/10 px-1.5 py-0.5 rounded">
                    <BsInfoCircle className="h-2.5 w-2.5" /> {errors.title}
                  </p>
                )}
              </div>

              {/* Category Field */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-gray-300 flex items-center gap-1">
                  <BsTag className="h-2.5 w-2.5" /> Category
                </label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className={`bg-[#1e1f23] border-gray-700/50 text-white text-xs h-8 rounded-md focus:border-amber-500/50 focus:ring-amber-500/20 ${
                    errors.category ? 'border-red-500/50' : ''
                  }`}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e1f23] border-gray-700/50">
                    {CATEGORIES.map((category) => (
                      <SelectItem 
                        key={category.value} 
                        value={category.value}
                        className="text-white text-xs hover:bg-gray-700/50"
                      >
                        <div className="flex items-center gap-1.5">
                          {category.value === 'PROFESSIONAL' && <BsBriefcase className="h-3 w-3 text-blue-400" />}
                          {category.value === 'TECHNICAL' && <BsLightbulb className="h-3 w-3 text-amber-400" />}
                          {category.value === 'LEADERSHIP' && <BsAward className="h-3 w-3 text-purple-400" />}
                          {category.value === 'PERSONAL' && <BsGraphUp className="h-3 w-3 text-green-400" />}
                          {category.value === 'TRAINING' && <BsRocket className="h-3 w-3 text-rose-400" />}
                          {category.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Employee Field */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-gray-300 flex items-center gap-1">
                  <BsPeople className="h-2.5 w-2.5" /> Employee
                </label>
                <Select
                  value={formData.employeeId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, employeeId: value }))}
                >
                  <SelectTrigger className={`bg-[#1e1f23] border-gray-700/50 text-white text-xs h-8 rounded-md focus:border-amber-500/50 focus:ring-amber-500/20 ${
                    errors.employeeId ? 'border-red-500/50' : ''
                  }`}>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e1f23] border-gray-700/50 max-h-40">
                    {users
                      .filter(user => user.role !== 'ADMIN')
                      .map((user) => (
                        <SelectItem 
                          key={user.id} 
                          value={user.id}
                          className="text-white text-xs hover:bg-gray-700/50"
                        >
                          <div className="flex items-center gap-1.5">
                            {user.role === 'EMPLOYEE' && <BsPeople className="h-3 w-3 text-blue-400" />}
                            {user.role === 'MANAGER' && <BsStars className="h-3 w-3 text-purple-400" />}
                            <span className="font-medium truncate">{user.name}</span>
                            <span className="text-[10px] text-gray-400 truncate">({user.email})</span>
                          </div>
                        </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {/* Description Field - Wider */}
              <div className="lg:col-span-3 space-y-1">
                <label className="text-[10px] font-medium text-gray-300 flex items-center gap-1">
                  <BsListTask className="h-2.5 w-2.5" /> Description
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the goal details..."
                  className={`bg-[#1e1f23] border-gray-700/50 text-white text-xs h-20 rounded-md focus:border-amber-500/50 focus:ring-amber-500/20 resize-none ${
                    errors.description ? 'border-red-500/50' : ''
                  }`}
                />
              </div>

              {/* Due Date Field */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-gray-300 flex items-center gap-1">
                  <BsCalendar className="h-2.5 w-2.5" /> Due Date
                </label>
                <div className="relative">
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                    className={`bg-[#1e1f23] border-gray-700/50 text-white text-xs h-8 rounded-md pl-7 focus:border-amber-500/50 focus:ring-amber-500/20 ${
                      errors.dueDate ? 'border-red-500/50' : ''
                    }`}
                  />
                  <BsCalendar className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3" />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={loading}
                className="bg-[#1e1f23] hover:bg-gray-800/30 border-gray-700/50 text-gray-300 text-xs h-8 rounded-md px-4"
              >
                <BsArrowCounterclockwise className="h-2.5 w-2.5 mr-1.5" /> Reset
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-[#6366f1] hover:bg-[#5b5be6] text-white text-xs h-8 rounded-md font-medium px-4"
              >
                {loading ? (
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <BsLightning className="h-2.5 w-2.5" />
                    <span>Save Goal</span>
                  </div>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
                className="bg-[#1e1f23] hover:bg-gray-800/30 border-gray-700/50 text-gray-300 text-xs h-8 rounded-md px-4"
              >
                Cancel
              </Button>
            </div>
          </div>

          {/* AI Section - Scrollable */}
          <div className="max-h-[300px] overflow-y-auto bg-[#3d4663]">
            {/* Context Field */}
            <div className="p-4 space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-blue-200/90 flex items-center gap-1">
                  <BsStars className="h-2.5 w-2.5" /> Additional Context (Optional)
                </label>
                <Textarea
                  value={formData.context}
                  onChange={(e) => setFormData(prev => ({ ...prev, context: e.target.value }))}
                  placeholder="Add context for AI suggestions..."
                  className="bg-[#1e1f23] border-gray-700/50 text-white text-xs h-16 rounded-md focus:border-blue-500/50 focus:ring-blue-500/20 resize-none"
                />
              </div>

              {/* AI Suggestions */}
              <div className="bg-[#1e1f23] rounded-md p-3 border border-blue-500/10">
                <AIGoalSuggestions
                  category={formData.category}
                  context={formData.context}
                  onSuggestionSelect={handleSuggestionSelect}
                />
              </div>
            </div>
          </div>

          {errors.submit && (
            <Alert variant="destructive" className="m-4 bg-red-900/30 border-red-800/30 py-1.5">
              <AlertDescription className="text-xs text-red-200">{errors.submit}</AlertDescription>
            </Alert>
          )}
        </form>
      </div>
    </div>
  );
} 
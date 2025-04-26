import { useState } from 'react';
import { User } from '../types';
import { CATEGORIES } from '../constants';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AIGoalSuggestions } from './AIGoalSuggestions';
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
  BsXCircle
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
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white dark:bg-gray-900 rounded-lg shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <BsListTask className="h-4 w-4 text-blue-500 dark:text-blue-400" />
            Title
          </label>
          <div className="relative">
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter goal title"
              className={`pl-10 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 ${
                errors.title ? 'border-red-500 dark:border-red-400' : ''
              }`}
            />
            {errors.title && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <BsXCircle className="h-4 w-4 text-red-500 dark:text-red-400" />
              </div>
            )}
          </div>
          {errors.title && (
            <p className="text-sm text-red-500 dark:text-red-400 flex items-center gap-1 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
              <BsInfoCircle className="h-4 w-4" />
              {errors.title}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <BsTag className="h-4 w-4 text-purple-500 dark:text-purple-400" />
            Category
          </label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
          >
            <SelectTrigger className={`bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 ${
              errors.category ? 'border-red-500 dark:border-red-400' : ''
            }`}>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800 dark:border-gray-600">
              {CATEGORIES.map((category) => (
                <SelectItem 
                  key={category.value} 
                  value={category.value}
                  className="dark:text-gray-100 dark:hover:bg-gray-700 dark:focus:bg-gray-700"
                >
                  <div className="flex items-center gap-2">
                    {category.value === 'PROFESSIONAL' && <BsBriefcase className="h-4 w-4 text-blue-500 dark:text-blue-400" />}
                    {category.value === 'TECHNICAL' && <BsLightbulb className="h-4 w-4 text-amber-500 dark:text-amber-400" />}
                    {category.value === 'LEADERSHIP' && <BsAward className="h-4 w-4 text-purple-500 dark:text-purple-400" />}
                    {category.value === 'PERSONAL' && <BsGraphUp className="h-4 w-4 text-green-500 dark:text-green-400" />}
                    {category.value === 'TRAINING' && <BsRocket className="h-4 w-4 text-rose-500 dark:text-rose-400" />}
                    {category.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && (
            <p className="text-sm text-red-500 dark:text-red-400 flex items-center gap-1 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
              <BsInfoCircle className="h-4 w-4" />
              {errors.category}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <BsCalendar className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
            Due Date
          </label>
          <div className="relative">
            <Input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
              className={`pl-10 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 ${
                errors.dueDate ? 'border-red-500 dark:border-red-400' : ''
              }`}
            />
            {errors.dueDate && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <BsXCircle className="h-4 w-4 text-red-500 dark:text-red-400" />
              </div>
            )}
          </div>
          {errors.dueDate && (
            <p className="text-sm text-red-500 dark:text-red-400 flex items-center gap-1 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
              <BsInfoCircle className="h-4 w-4" />
              {errors.dueDate}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <BsPeople className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
            Employee
          </label>
          <Select
            value={formData.employeeId}
            onValueChange={(value) => setFormData(prev => ({ ...prev, employeeId: value }))}
          >
            <SelectTrigger className={`bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 ${
              errors.employeeId ? 'border-red-500 dark:border-red-400' : ''
            }`}>
              <SelectValue placeholder="Select employee" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800 dark:border-gray-600">
              {users
                .filter(user => user.role !== 'ADMIN')
                .map((user) => (
                  <SelectItem 
                    key={user.id} 
                    value={user.id}
                    className="dark:text-gray-100 dark:hover:bg-gray-700 dark:focus:bg-gray-700"
                  >
                    <div className="flex items-center gap-2">
                      {user.role === 'EMPLOYEE' && <BsPeople className="h-4 w-4 text-blue-400 dark:text-blue-300" />}
                      {user.role === 'MANAGER' && <BsStars className="h-4 w-4 text-purple-400 dark:text-purple-300" />}
                      <div>
                        <span className="font-medium">{user.name}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">({user.email})</span>
                      </div>
                    </div>
                  </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.employeeId && (
            <p className="text-sm text-red-500 dark:text-red-400 flex items-center gap-1 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
              <BsInfoCircle className="h-4 w-4" />
              {errors.employeeId}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <BsInfoCircle className="h-4 w-4 text-amber-500 dark:text-amber-400" />
          Description
        </label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Enter goal description"
          className={`bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 ${
            errors.description ? 'border-red-500 dark:border-red-400' : ''
          }`}
          rows={3}
        />
        {errors.description && (
          <p className="text-sm text-red-500 dark:text-red-400 flex items-center gap-1 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
            <BsInfoCircle className="h-4 w-4" />
            {errors.description}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <BsStars className="h-4 w-4 text-blue-500 dark:text-blue-400" />
          Additional Context (Optional)
        </label>
        <Textarea
          value={formData.context}
          onChange={(e) => setFormData(prev => ({ ...prev, context: e.target.value }))}
          placeholder="Add any additional context for AI suggestions..."
          className="bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
          rows={2}
        />
      </div>

      <AIGoalSuggestions
        category={formData.category}
        onSuggestionSelect={handleSuggestionSelect}
        context={formData.context}
      />

      {errors.submit && (
        <Alert variant="destructive" className="bg-red-50 dark:bg-red-900/50 dark:border-red-800">
          <AlertDescription className="text-red-500 dark:text-red-200">{errors.submit}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end space-x-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          disabled={loading}
          className="flex items-center gap-2 border-yellow-500 text-yellow-700 dark:border-yellow-400 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-800 font-semibold shadow-sm"
        >
          <BsArrowCounterclockwise className="h-4 w-4" />
          Reset
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
          className="dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-800"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
        >
          {loading ? (
            <>
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <BsCheckCircle className="h-4 w-4" />
              Save Goal
            </>
          )}
        </Button>
      </div>
    </form>
  );
} 
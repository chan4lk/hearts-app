import { useState, useRef, useEffect } from 'react';
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
  const aiSectionRef = useRef<HTMLDivElement>(null);
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
      title: initialData.title,
      description: initialData.description,
      category: initialData.category,
      dueDate: initialData.dueDate,
      employeeId: initialData.employeeId,
      context: ''
    });
    setErrors({});
  };

  const scrollToAISection = () => {
    setTimeout(() => {
      if (aiSectionRef.current) {
        aiSectionRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'center'
        });
      }
    }, 100); // Small delay to ensure content is rendered
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
    <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-xl shadow-lg border border-slate-700/50 overflow-hidden ">
      {/* Header */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-indigo-600/90 to-purple-600/90 border-b border-slate-700/30">
        <div className="p-1 rounded-lg bg-white/20 backdrop-blur-sm">
          <BsListTask className="w-3 h-3 text-white" />
        </div>
        <h2 className="text-xs font-semibold text-white tracking-wide">{title}</h2>
      </div>

      {/* Form */}
      <div className="p-3">
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Main Form Fields - Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Left Column */}
            <div className="space-y-3">
              {/* Title Field */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-slate-200 flex items-center gap-1">
                  <BsListTask className="h-3 w-3 text-indigo-400" /> Goal Title
                </label>
                <div className="relative">
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter goal title"
                    className={`bg-slate-800/50 border-slate-600/50 text-white text-[10px] h-7 rounded-lg focus:border-indigo-400/50 focus:ring-indigo-400/20 transition-all duration-200 ${
                      errors.title ? 'border-red-400/50 ring-red-400/20' : ''
                    }`}
                  />
                  {errors.title && <BsXCircle className="absolute right-1.5 top-1/2 -translate-y-1/2 h-2.5 w-2.5 text-red-400" />}
                </div>
                {errors.title && (
                  <p className="text-[8px] text-red-300 flex items-center gap-0.5 bg-red-900/20 px-1.5 py-0.5 rounded-lg border border-red-800/30">
                    <BsInfoCircle className="h-2 w-2" /> {errors.title}
                  </p>
                )}
              </div>

              {/* Category Field */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-slate-200 flex items-center gap-1">
                  <BsTag className="h-3 w-3 text-emerald-400" /> Category
                </label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className={`bg-slate-800/50 border-slate-600/50 text-white text-[10px] h-7 rounded-lg focus:border-emerald-400/50 focus:ring-emerald-400/20 transition-all duration-200 ${
                    errors.category ? 'border-red-400/50 ring-red-400/20' : ''
                  }`}>
                    <SelectValue placeholder="Choose category" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600/50 rounded-lg">
                    {CATEGORIES.map((category) => (
                      <SelectItem 
                        key={category.value} 
                        value={category.value}
                        className="text-white text-[10px] hover:bg-slate-700/50 focus:bg-slate-700/50"
                      >
                        <div className="flex items-center gap-1">
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
            </div>

            {/* Right Column */}
            <div className="space-y-3">
              {/* Employee Field */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-slate-200 flex items-center gap-1">
                  <BsPeople className="h-3 w-3 text-cyan-400" /> Assign To
                </label>
                <Select
                  value={formData.employeeId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, employeeId: value }))}
                >
                  <SelectTrigger className={`bg-slate-800/50 border-slate-600/50 text-white text-[10px] h-7 rounded-lg focus:border-cyan-400/50 focus:ring-cyan-400/20 transition-all duration-200 ${
                    errors.employeeId ? 'border-red-400/50 ring-red-400/20' : ''
                  }`}>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600/50 max-h-24 rounded-lg">
                    {users
                      .filter(user => user.role !== 'ADMIN')
                      .map((user) => (
                        <SelectItem 
                          key={user.id} 
                          value={user.id}
                          className="text-white text-[10px] hover:bg-slate-700/50 focus:bg-slate-700/50"
                        >
                          <div className="flex items-center gap-1">
                            {user.role === 'EMPLOYEE' && <BsPeople className="h-3 w-3 text-blue-400" />}
                            {user.role === 'MANAGER' && <BsStars className="h-3 w-3 text-purple-400" />}
                            <span className="font-medium">{user.name}</span>
                            <span className="text-[8px] text-slate-400">({user.email})</span>
                          </div>
                        </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Due Date Field */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-slate-200 flex items-center gap-1">
                  <BsCalendar className="h-3 w-3 text-orange-400" /> Due Date
                </label>
                <div className="relative">
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                    className={`bg-slate-800/50 border-slate-600/50 text-white text-[10px] h-7 rounded-lg pl-6 focus:border-orange-400/50 focus:ring-orange-400/20 transition-all duration-200 ${
                      errors.dueDate ? 'border-red-400/50 ring-red-400/20' : ''
                    }`}
                  />
                  <BsCalendar className="absolute left-1.5 top-1/2 transform -translate-y-1/2 text-blue-400 h-2.5 w-2.5" />
                </div>
              </div>
            </div>
          </div>

          {/* Description Field - Full Width */}
          <div className="space-y-1">
            <label className="text-[10px] font-medium text-slate-200 flex items-center gap-1">
              <BsListTask className="h-3 w-3 text-indigo-400" /> Description
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the goal..."
              className={`bg-slate-800/50 border-slate-600/50 text-white text-[10px] h-16 rounded-lg focus:border-indigo-400/50 focus:ring-indigo-400/20 resize-none transition-all duration-200 ${
                errors.description ? 'border-red-400/50 ring-red-400/20' : ''
              }`}
            />
          </div>

          {/* AI Context Section - Compact */}
          <div ref={aiSectionRef} className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-xl p-2 border border-slate-600/30">
            <div className="space-y-2">
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-blue-200 flex items-center gap-1">
                  <BsStars className="h-3 w-3 text-blue-400" /> AI Context
                </label>
                <Textarea
                  value={formData.context}
                  onChange={(e) => setFormData(prev => ({ ...prev, context: e.target.value }))}
                  placeholder="Add context for AI..."
                  className="bg-slate-800/50 border-slate-600/50 text-white text-[10px] h-12 rounded-lg focus:border-blue-400/50 focus:ring-blue-400/20 resize-none transition-all duration-200"
                />
              </div>

              {/* AI Suggestions */}
              <div className="bg-slate-800/70 rounded-xl p-2 border border-blue-500/20">
                <AIGoalSuggestions
                  category={formData.category}
                  context={formData.context}
                  onSuggestionSelect={handleSuggestionSelect}
                  onGenerate={scrollToAISection}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons - Full Width */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={loading}
              className="bg-slate-800/50 hover:bg-slate-700/50 border-slate-600/50 text-slate-200 text-[10px] h-7 rounded-xl transition-all duration-200 hover:border-slate-500/50 w-full"
            >
              <BsArrowCounterclockwise className="h-2.5 w-2.5 mr-1" /> Reset
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="bg-slate-800/50 hover:bg-slate-700/50 border-slate-600/50 text-slate-200 text-[10px] h-7 rounded-xl transition-all duration-200 hover:border-slate-500/50 w-full"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-[10px] h-7 rounded-xl font-medium transition-all duration-200 shadow-md hover:shadow-lg w-full"
            >
              {loading ? (
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <BsLightning className="h-2.5 w-2.5" />
                  <span>Save</span>
                </div>
              )}
            </Button>
          </div>

          {errors.submit && (
            <Alert variant="destructive" className="bg-red-900/30 border-red-800/30 py-1.5 rounded-xl">
              <AlertDescription className="text-[10px] text-red-200">{errors.submit}</AlertDescription>
            </Alert>
          )}
        </form>
      </div>
    </div>
  );
} 
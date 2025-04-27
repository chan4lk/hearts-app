import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { GoalFormData, Goal } from '../types';
import { CATEGORIES } from '@/app/components/shared/constants';

interface EditGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: GoalFormData) => void;
  assignedEmployees: any[];
  loading: boolean;
  formData: GoalFormData;
  setFormData: (data: GoalFormData) => void;
  goal: Goal | null;
}

export function EditGoalModal({
  isOpen,
  onClose,
  onSubmit,
  assignedEmployees,
  loading,
  formData,
  setFormData,
  goal
}: EditGoalModalProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (goal) {
      const parsedDate = new Date(goal.dueDate);
      const formattedDate = isNaN(parsedDate.getTime()) 
        ? new Date().toISOString().split('T')[0] // Fallback to today if invalid
        : parsedDate.toISOString().split('T')[0];

      setFormData({
        title: goal.title,
        description: goal.description,
        dueDate: formattedDate,
        employeeId: goal.employee?.id || '',
        category: goal.category
      });
    }
  }, [goal, setFormData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.dueDate) newErrors.dueDate = 'Due date is required';
    if (!formData.employeeId) newErrors.employeeId = 'Please select an employee';
    if (!formData.category) newErrors.category = 'Please select a category';

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onSubmit(formData);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-[#1E2028] border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-white">Edit Goal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Title</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="bg-[#25262b] border-gray-700 text-white"
              placeholder="Enter goal title"
            />
            {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Description</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-[#25262b] border-gray-700 text-white"
              placeholder="Enter goal description"
            />
            {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Due Date</label>
            <Input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="bg-[#25262b] border-gray-700 text-white"
            />
            {errors.dueDate && <p className="text-red-500 text-sm">{errors.dueDate}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Employee</label>
            <Select
              value={formData.employeeId}
              onValueChange={(value) => setFormData({ ...formData, employeeId: value })}
            >
              <SelectTrigger className="bg-[#25262b] border-gray-700 text-white">
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent className="bg-[#25262b] border-gray-700">
                {assignedEmployees.map((employee) => (
                  <SelectItem
                    key={employee.id}
                    value={employee.id}
                    className="text-white hover:bg-gray-700"
                  >
                    {employee.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.employeeId && <p className="text-red-500 text-sm">{errors.employeeId}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Category</label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger className="bg-[#25262b] border-gray-700 text-white">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="bg-[#25262b] border-gray-700">
                {CATEGORIES.map((category) => (
                  <SelectItem
                    key={category.value}
                    value={category.value}
                    className="text-white hover:bg-gray-700"
                  >
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && <p className="text-red-500 text-sm">{errors.category}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-gray-700 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 
import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { GoalForm } from '@/app/components/shared/GoalForm';
import { GoalFormData, Goal } from '../../types';

interface EditGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: GoalFormData) => void;
  assignedEmployees: any[];
  loading: boolean;
  goal: Goal | null;
}

export function EditGoalModal({
  isOpen,
  onClose,
  onSubmit,
  assignedEmployees,
  loading,
  goal
}: EditGoalModalProps) {
  // Prepare initial data for the form
  const initialData = goal
    ? {
        title: goal.title,
        description: goal.description,
        dueDate: new Date(goal.dueDate).toISOString().split('T')[0],
        employeeId: goal.employee?.id || '',
        category: goal.category,
      }
    : {
        title: '',
        description: '',
        dueDate: new Date().toISOString().split('T')[0],
        employeeId: '',
        category: 'PROFESSIONAL',
      };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] bg-[#1E2028] border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-white">Edit Goal</DialogTitle>
        </DialogHeader>
        <GoalForm
          initialData={initialData}
          users={assignedEmployees}
          onSubmit={async (data) => { onSubmit(data); }}
          onCancel={onClose}
          loading={loading}
          title="Edit Goal"
        />
      </DialogContent>
    </Dialog>
  );
} 
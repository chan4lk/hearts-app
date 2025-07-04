import { Goal, GoalFormData } from '@/app/components/shared/types';
import { GoalFormModal } from '@/app/components/shared/GoalFormModal';
import { GoalModal } from './GoalModal';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { useState, useEffect } from 'react';

interface GoalModalsProps {
  isCreateModalOpen: boolean;
  isEditModalOpen: boolean;
  isViewModalOpen: boolean;
  isDeleteModalOpen: boolean;
  selectedGoal: Goal | null;
  viewedGoal: Goal | null;
  goalToDelete: Goal | null;
  users: any[];
  loading: boolean;
  onCloseCreate: () => void;
  onCloseEdit: () => void;
  onCloseView: () => void;
  onCloseDelete: () => void;
  onCreate: (data: any) => Promise<void>;
  onUpdate: (data: any) => Promise<void>;
  onDelete: () => Promise<void>;
  setSelectedGoal: (goal: Goal | null) => void;
  setGoalToDelete: (goal: Goal | null) => void;
  setIsEditModalOpen: (isOpen: boolean) => void;
  setIsDeleteModalOpen: (isOpen: boolean) => void;
}

export function GoalModals({
  isCreateModalOpen,
  isEditModalOpen,
  isViewModalOpen,
  isDeleteModalOpen,
  selectedGoal,
  viewedGoal,
  goalToDelete,
  users,
  loading,
  onCloseCreate,
  onCloseEdit,
  onCloseView,
  onCloseDelete,
  onCreate,
  onUpdate,
  onDelete,
  setSelectedGoal,
  setGoalToDelete,
  setIsEditModalOpen,
  setIsDeleteModalOpen
}: GoalModalsProps) {
  const [formData, setFormData] = useState<GoalFormData>({
    title: '',
    description: '',
    dueDate: new Date().toISOString().split('T')[0],
    employeeId: '',
    category: 'PROFESSIONAL'
  });
  const [context, setContext] = useState('');
  const [errors, setErrors] = useState<{
    title?: string;
    category?: string;
    employeeId?: string;
  }>({});

  useEffect(() => {
    if (selectedGoal) {
      setFormData({
        title: selectedGoal.title,
        description: selectedGoal.description,
        dueDate: selectedGoal.dueDate.split('T')[0],
        employeeId: selectedGoal.employee?.id || '',
        category: selectedGoal.category
      });
    }
  }, [selectedGoal]);

  useEffect(() => {
    if (!isCreateModalOpen && !isEditModalOpen) {
      handleReset();
    }
  }, [isCreateModalOpen, isEditModalOpen]);

  const handleFormDataChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    setFormData({
      title: '',
      description: '',
      dueDate: new Date().toISOString().split('T')[0],
      employeeId: '',
      category: 'PROFESSIONAL'
    });
    setContext('');
    setErrors({});
  };

  return (
    <>
      {isCreateModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onCloseCreate();
            }
          }}
        >
          <div className="w-full max-w-2xl mx-4">
            <GoalFormModal
              isOpen={isCreateModalOpen}
              onClose={() => {
                handleReset();
                onCloseCreate();
              }}
              onSubmit={async (e) => {
                e.preventDefault();
                await onCreate(formData);
              }}
              assignedEmployees={users}
              loading={loading}
              formData={formData}
              onFormDataChange={handleFormDataChange}
              errors={errors}
              isEditMode={false}
              context={context}
              onContextChange={setContext}
              onReset={handleReset}
            />
          </div>
        </div>
      )}

      {isViewModalOpen && viewedGoal && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onCloseView();
            }
          }}
        >
          <GoalModal
            goal={viewedGoal}
            onClose={onCloseView}
            onEdit={(goal) => {
              onCloseView();
              setIsEditModalOpen(true);
              setSelectedGoal(goal);
            }}
            onDelete={(goalId) => {
              onCloseView();
              setIsDeleteModalOpen(true);
              setGoalToDelete(viewedGoal);
            }}
          />
        </div>
      )}

      {isEditModalOpen && selectedGoal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onCloseEdit();
            }
          }}
        >
          <div className="w-full max-w-2xl mx-4">
            <GoalFormModal
              isOpen={isEditModalOpen}
              onClose={() => {
                handleReset();
                onCloseEdit();
              }}
              onSubmit={async (e) => {
                e.preventDefault();
                await onUpdate(formData);
              }}
              assignedEmployees={users}
              loading={loading}
              formData={formData}
              onFormDataChange={handleFormDataChange}
              errors={errors}
              isEditMode={true}
              context={context}
              onContextChange={setContext}
              onReset={handleReset}
            />
          </div>
        </div>
      )}

      {isDeleteModalOpen && goalToDelete && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onCloseDelete();
            }
          }}
        >
          <DeleteConfirmationModal
            goal={goalToDelete}
            onClose={onCloseDelete}
            onConfirm={onDelete}
          />
        </div>
      )}
    </>
  );
} 
import { Goal, GoalFormData } from '@/app/components/shared/types';
import { GoalFormModal } from '@/app/components/shared/GoalFormModal';
import GoalDetailModal from '@/app/components/shared/GoalDetailModal';
import { DeleteConfirmationModal } from '@/app/components/shared/DeleteConfirmationModal';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

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
  context?: string;
  onContextChange?: (value: string) => void;
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
  setIsDeleteModalOpen,
  context = '',
  onContextChange = () => {}
}: GoalModalsProps) {
  const { data: session } = useSession();
  const [formData, setFormData] = useState<GoalFormData>({
    title: '',
    description: '',
    dueDate: new Date().toISOString().split('T')[0],
    employeeId: '',
    category: 'PROFESSIONAL',
    department: 'ENGINEERING',
    priority: 'MEDIUM'
  });

  // Filter out only the current admin user (self) from the employee dropdown
  // Allow assigning goals to other admins, managers, and employees
  const filteredUsers = users?.filter(user => user.id !== session?.user?.id) || [];
  const [localContext, setLocalContext] = useState(context);
  const [errors, setErrors] = useState<{
    title?: string;
    category?: string;
    employeeId?: string;
  }>({});

  // Sync local context with prop
  useEffect(() => {
    setLocalContext(context);
  }, [context]);

  useEffect(() => {
    if (selectedGoal && (isEditModalOpen || isCreateModalOpen)) {
      // Add a small delay to ensure modal is fully rendered
      const timer = setTimeout(() => {
        // Ensure we have all the required fields
        const newFormData = {
          title: selectedGoal.title || '',
          description: selectedGoal.description || '',
          dueDate: selectedGoal.dueDate ? selectedGoal.dueDate.split('T')[0] : new Date().toISOString().split('T')[0],
          employeeId: selectedGoal.employee?.id || '',
          category: selectedGoal.category || 'PROFESSIONAL',
          department: selectedGoal.department || 'ENGINEERING',
          priority: selectedGoal.priority || 'MEDIUM'
        };
        
        // Set the form data
        setFormData(newFormData);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [selectedGoal, isEditModalOpen, isCreateModalOpen]);

  // Force re-render when formData changes
  useEffect(() => {
    // Form data changes handled by state updates
  }, [formData, isEditModalOpen, selectedGoal]);

  // Separate useEffect for resetting - only when both modals are closed
  useEffect(() => {
    if (!isCreateModalOpen && !isEditModalOpen) {
      // Only reset when both modals are closed
      setFormData({
        title: '',
        description: '',
        dueDate: new Date().toISOString().split('T')[0],
        employeeId: '',
        category: 'PROFESSIONAL',
        department: 'ENGINEERING',
        priority: 'MEDIUM'
      });
      setLocalContext('');
      onContextChange('');
      setErrors({});
    }
  }, [isCreateModalOpen, isEditModalOpen]);

  const handleFormDataChange = (field: string, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      return newData;
    });
  };

  const handleReset = () => {
    if (selectedGoal && isEditModalOpen) {
      // If we're in edit mode, keep the selected goal's data
      setFormData({
        title: selectedGoal.title || '',
        description: selectedGoal.description || '',
        dueDate: selectedGoal.dueDate ? selectedGoal.dueDate.split('T')[0] : new Date().toISOString().split('T')[0],
        employeeId: selectedGoal.employee?.id || '',
        category: selectedGoal.category || 'PROFESSIONAL',
        department: selectedGoal.department || 'ENGINEERING',
        priority: selectedGoal.priority || 'MEDIUM'
      });
    } else {
      // Otherwise, reset to default values
      setFormData({
        title: '',
        description: '',
        dueDate: new Date().toISOString().split('T')[0],
        employeeId: '',
        category: 'PROFESSIONAL',
        department: 'ENGINEERING',
        priority: 'MEDIUM'
      });
    }
    setLocalContext('');
    onContextChange('');
    setErrors({});
  };

  return (
    <>
      {isCreateModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleReset();
              setSelectedGoal(null);
              onCloseCreate();
            }
          }}
        >
          <div className="w-full max-w-2xl mx-4">
            <GoalFormModal
              isOpen={isCreateModalOpen}
              onClose={() => {
                handleReset();
                setSelectedGoal(null);
                onCloseCreate();
              }}
              onSubmit={async (e) => {
                e.preventDefault();
                await onCreate(formData);
              }}
              assignedEmployees={filteredUsers}
              loading={loading}
              formData={formData}
              onFormDataChange={handleFormDataChange}
              errors={errors}
              isEditMode={false}
              context={localContext}
              onContextChange={(value) => {
                setLocalContext(value);
                onContextChange(value);
              }}
              onReset={handleReset}
            />
          </div>
        </div>
      )}

      {isViewModalOpen && viewedGoal && (
        <GoalDetailModal
          goal={viewedGoal}
          onClose={onCloseView}
          onEdit={(goal) => {
            onCloseView();
            setIsEditModalOpen(true);
            setSelectedGoal(goal);
          }}
          onDelete={(goal) => {
            onCloseView();
            setIsDeleteModalOpen(true);
            setGoalToDelete(goal);
          }}
        />
      )}

      {isEditModalOpen && selectedGoal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onCloseEdit();
              handleReset();
              setSelectedGoal(null);
            }
          }}
        >
          <div className="w-full max-w-2xl mx-4">
            <GoalFormModal
              key={`edit-modal-${selectedGoal?.id}-${formData.employeeId}`}
              isOpen={isEditModalOpen}
              onClose={() => {
                onCloseEdit();
                handleReset();
                setSelectedGoal(null);
              }}
              onSubmit={async (e) => {
                e.preventDefault();
                await onUpdate(formData);
              }}
              assignedEmployees={filteredUsers}
              loading={loading}
              formData={formData}
              onFormDataChange={handleFormDataChange}
              errors={errors}
              isEditMode={true}
              context={localContext}
              onContextChange={(value) => {
                setLocalContext(value);
                onContextChange(value);
              }}
              onReset={handleReset}
            />
          </div>
        </div>
      )}

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={onCloseDelete}
        onConfirm={onDelete}
        title="Delete Goal"
        message={goalToDelete ? `Are you sure you want to delete "${goalToDelete.title}"? This action cannot be undone.` : "Are you sure you want to delete this goal? This action cannot be undone."}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </>
  );
} 
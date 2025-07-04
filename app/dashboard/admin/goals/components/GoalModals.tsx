import { Goal, GoalFormData } from '@/app/components/shared/types';
import { GoalFormModal } from '@/app/components/shared/GoalFormModal';
import { GoalModal } from './GoalModal';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
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
  
  // Debug: Log filtering results
  console.log('GoalModals - Current user ID:', session?.user?.id);
  console.log('GoalModals - Total users:', users?.length);
  console.log('GoalModals - Filtered users:', filteredUsers?.length);
  console.log('GoalModals - Filtered users:', filteredUsers?.map(u => ({ id: u.id, name: u.name, role: u.role })));
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
        
        // Log for debugging
        console.log('Setting form data:', newFormData);
        console.log('Selected goal:', selectedGoal);
        console.log('Modal type:', isEditModalOpen ? 'edit' : 'create');
        
        // Set the form data
        setFormData(newFormData);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [selectedGoal, isEditModalOpen, isCreateModalOpen]);

  // Force re-render when formData changes
  useEffect(() => {
    if (isEditModalOpen && selectedGoal) {
      console.log('Form data updated:', formData);
    }
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
    console.log('GoalModals - Form data change:', field, value);
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      console.log('GoalModals - New form data:', newData);
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
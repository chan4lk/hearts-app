import { Goal } from '../types';
import { GoalForm } from './GoalForm';
import { GoalModal } from './GoalModal';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';

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
  return (
    <>
      {isCreateModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center "
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onCloseCreate();
            }
          }}
        >
          <div className="w-full max-w-2xl mx-4">
            

            <GoalForm
              users={users}
              onSubmit={onCreate}
              onCancel={onCloseCreate}
              loading={loading}
              title="Create Goal"
              initialData={selectedGoal ? {
                title: selectedGoal.title,
                description: selectedGoal.description,
                dueDate: new Date(selectedGoal.dueDate).toISOString().split('T')[0],
                employeeId: selectedGoal.employee?.id || '',
                category: selectedGoal.category
              } : undefined}
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
            

            <GoalForm
              initialData={{
                title: selectedGoal.title,
                description: selectedGoal.description,
                dueDate: new Date(selectedGoal.dueDate).toISOString().split('T')[0],
                employeeId: selectedGoal.employee?.id || '',
                category: selectedGoal.category
              }}
              users={users}
              onSubmit={onUpdate}
              onCancel={onCloseEdit}
              loading={loading}
              title="Update Goal"
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
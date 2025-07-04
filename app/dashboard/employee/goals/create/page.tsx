'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import LoadingComponent from '@/app/components/LoadingScreen';
import { BsPlus, BsArrowUpRight } from 'react-icons/bs';
import GoalTemplates from '@/app/components/shared/GoalTemplates';
import { HeroSection } from './components/HeroSection';
import { GoalsList } from './components/GoalsList';
import { GoalDetailsModal } from './components/modals/GoalDetailsModal';
import { Goal, NewGoal } from '@/app/components/shared/types';
import { useSession, getSession } from 'next-auth/react';
import { CATEGORIES } from '@/app/components/shared/constants';
import { GoalFormModal } from '@/app/components/shared/GoalFormModal';

// Helper function to get the auth token
const getAuthToken = async () => {
  const session = await getSession();
  return session?.user?.id || '';
};

function GoalsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');
  const [selectedViewGoal, setSelectedViewGoal] = useState<Goal | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: new Date().toISOString().split('T')[0],
    employeeId: '',
    category: 'PROFESSIONAL'
  });
  const [context, setContext] = useState('');
  const [formErrors, setFormErrors] = useState<{
    title?: string;
    category?: string;
    employeeId?: string;
  }>({});
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteGoal, setDeleteGoal] = useState<Goal | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  // Helper to check if user is admin or manager
  const userIsAdminOrManager = session?.user?.role === 'ADMIN' || session?.user?.role === 'MANAGER';

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || !['EMPLOYEE', 'MANAGER', 'ADMIN'].includes(session.user.role)) {
      window.location.href = '/login';
    }
  }, [session, status]);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const response = await fetch('/api/goals/self');
      if (response.ok) {
        const data = await response.json();
        const sortedGoals = data.goals.sort((a: Goal, b: Goal) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setGoals(sortedGoals);
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
      showNotificationWithTimeout('Failed to load goals', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotificationWithTimeout = (message: string, type: 'success' | 'error') => {
    setNotificationMessage(message);
    setNotificationType(type);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const handleFormDataChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (goalData: NewGoal) => {
    setLoading(true);
    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goalData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to create goal: ${errorData.error || response.statusText}`);
      }

      setIsCreateModalOpen(false);
      showNotificationWithTimeout('Goal created successfully!', 'success');
      fetchGoals();
      setFormData({
        title: '',
        description: '',
        dueDate: new Date().toISOString().split('T')[0],
        employeeId: '',
        category: 'PROFESSIONAL'
      });
    } catch (error) {
      console.error('Error submitting goal:', error);
      showNotificationWithTimeout(
        `Failed to create goal: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEditGoal = (goal: Goal) => {
    setEditGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description,
      dueDate: goal.dueDate.split('T')[0],
      employeeId: '',
      category: goal.category
    });
    setIsEditModalOpen(true);
    setSelectedViewGoal(null); // Close details modal
  };

  const handleDeleteGoal = (goal: Goal) => {
    setDeleteGoal(goal);
    setIsDeleteModalOpen(true);
    setSelectedViewGoal(null); // Close details modal
  };

  const handleEditSubmit = async (goalData: NewGoal) => {
    if (!editGoal?.id || !session?.user) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/goals/${editGoal.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`
        },
        body: JSON.stringify({
          title: goalData.title.trim(),
          description: goalData.description.trim(),
          category: goalData.category,
          dueDate: goalData.dueDate,
          employeeId: session.user.id // Add the employee ID
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update goal');
      }

      const { goal } = await response.json();
      
      // Update the goals list optimistically
      const updatedGoals = goals.map(g => 
        g.id === editGoal.id ? goal : g
      );
      setGoals(updatedGoals);
      
      setIsEditModalOpen(false);
      setEditGoal(null);
      showNotificationWithTimeout('Goal updated successfully!', 'success');
      fetchGoals(); // Refresh to get the latest data
    } catch (error) {
      console.error('Error updating goal:', error);
      showNotificationWithTimeout(
        error instanceof Error ? error.message : 'Failed to update goal',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteGoal?.id || !session?.user) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/goals/${deleteGoal.id}`, {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete goal');
      }

      const { goal } = await response.json();
      
      // Update the goals list optimistically
      const updatedGoals = goals.filter(g => g.id !== deleteGoal.id);
      setGoals(updatedGoals);
      
      setIsDeleteModalOpen(false);
      setDeleteGoal(null);
      showNotificationWithTimeout('Goal deleted successfully!', 'success');
      fetchGoals(); // Refresh to get the latest data
    } catch (error) {
      console.error('Error deleting goal:', error);
      showNotificationWithTimeout(
        error instanceof Error ? error.message : 'Failed to delete goal',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  // Calculate completed goals for HeroSection
  const completedGoals = goals.filter(g => g.status === 'APPROVED').length;

  if (loading) {
    return <LoadingComponent />;
  }

  return (
    <DashboardLayout type="employee">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        

       
    

        {/* Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-indigo-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 p-6 space-y-8">
          {/* Hero Section */}
          <HeroSection
            onCreateClick={() => setIsCreateModalOpen(true)}
            totalGoals={goals.length}
            completedGoals={completedGoals}
          />

          {/* Notification Toast */}
          {showNotification && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 p-4 rounded-xl shadow-2xl flex items-center gap-3 max-w-[90%] md:max-w-md backdrop-blur-xl border border-white/20 ${
                notificationType === 'success' ? 'bg-green-500/90' : 'bg-red-500/90'
              } text-white`}
            >
              <span className="text-sm md:text-base font-medium">{notificationMessage}</span>
            </motion.div>
          )}

          {/* Main Content */}
          <motion.div 
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.1 }
              }
            }}
            initial="hidden"
            animate="visible"
            className="w-full space-y-4"
          >
            {/* View Templates Button */}
            <motion.button
              onClick={() => setShowTemplates(!showTemplates)}
              className="w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-4 
                shadow-md border border-white/10 dark:border-gray-700/30 
                hover:bg-white/90 dark:hover:bg-gray-700/80 transition-all duration-300
                text-gray-900 dark:text-white font-medium flex items-center justify-center gap-2"
            >
              {showTemplates ? 'Hide Templates' : 'View Templates'}
              <BsArrowUpRight className={`transform transition-transform duration-300 ${showTemplates ? 'rotate-180' : ''}`} />
            </motion.button>

            {/* Goal Templates */}
            <AnimatePresence>
              {showTemplates && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <GoalTemplates onSelect={(template) => {
                    setFormData({
                      title: template.title,
                      description: template.description,
                      dueDate: new Date().toISOString().split('T')[0],
                      employeeId: '',
                      category: template.category
                    });
                    setIsCreateModalOpen(true);
                  }} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Goals List */}
          <GoalsList
            goals={goals}
            selectedStatus={selectedStatus}
            selectedCategory={selectedCategory}
            setSelectedStatus={setSelectedStatus}
            setSelectedCategory={setSelectedCategory}
            onViewGoal={setSelectedViewGoal}
          />
        </div>
      </div>

      {/* Modals */}
      <GoalFormModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setFormData({
            title: '',
            description: '',
            dueDate: new Date().toISOString().split('T')[0],
            employeeId: '',
            category: 'PROFESSIONAL'
          });
        }}
        onSubmit={async (e) => {
          e.preventDefault();
          await handleSubmit({
            title: formData.title,
            description: formData.description,
            category: formData.category,
            dueDate: formData.dueDate
          });
        }}
        assignedEmployees={[]}
        loading={loading}
        formData={formData}
        onFormDataChange={handleFormDataChange}
        errors={formErrors}
        isEditMode={false}
        context={context}
        onContextChange={(value) => setContext(value)}
        onReset={() => {
          setFormData({
            title: '',
            description: '',
            dueDate: new Date().toISOString().split('T')[0],
            employeeId: '',
            category: 'PROFESSIONAL'
          });
          setContext('');
        }}
      />

      <GoalDetailsModal
        isOpen={!!selectedViewGoal}
        onClose={() => setSelectedViewGoal(null)}
        goal={selectedViewGoal}
        onEdit={handleEditGoal}
        onDelete={handleDeleteGoal}
        userIsAdminOrManager={userIsAdminOrManager}
      />

      <GoalFormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditGoal(null);
          setFormData({
            title: '',
            description: '',
            dueDate: new Date().toISOString().split('T')[0],
            employeeId: '',
            category: 'PROFESSIONAL'
          });
        }}
        onSubmit={async (e) => {
          e.preventDefault();
          await handleEditSubmit({
            title: formData.title,
            description: formData.description,
            category: formData.category,
            dueDate: formData.dueDate
          });
        }}
        assignedEmployees={[]}
        loading={loading}
        formData={formData}
        onFormDataChange={handleFormDataChange}
        errors={formErrors}
        isEditMode={true}
        context={context}
        onContextChange={(value) => setContext(value)}
        onReset={() => {
          setFormData({
            title: '',
            description: '',
            dueDate: new Date().toISOString().split('T')[0],
            employeeId: '',
            category: 'PROFESSIONAL'
          });
          setContext('');
        }}
      />

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeleteModalOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 flex items-center justify-center p-4 z-50"
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm mx-auto shadow-xl">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Delete Goal</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Are you sure you want to delete this goal? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {loading && <LoadingComponent />}
    </DashboardLayout>
  );
}

export default function GoalsPage() {
  return (
    <Suspense fallback={<LoadingComponent />}>
      <GoalsPageContent />
    </Suspense>
  );
} 
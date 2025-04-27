'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import GoalTemplates from '@/app/components/shared/GoalTemplates';
import { Goal, GoalTemplate } from './types';
import { CATEGORIES } from './constants';
import { Header } from './components/Header';
import { GoalCard } from '@/app/components/shared/GoalCard';
import { SelfCreateGoalModal } from '@/app/components/shared/SelfCreateGoalModal';

export default function ManagerGoalsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [modalGoalData, setModalGoalData] = useState({
    title: '',
    description: '',
    dueDate: new Date().toISOString().split('T')[0],
    category: 'PROFESSIONAL',
  });
  const [viewedGoal, setViewedGoal] = useState<Goal | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const response = await fetch('/api/goals/manager/self');
      const data = await response.json();
      setGoals(data || []);
    } catch (error) {
      console.error('Error fetching goals:', error);
    }
  };

  const showNotificationWithTimeout = (message: string, type: 'success' | 'error') => {
    setNotificationMessage(message);
    setNotificationType(type);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const handleModalSubmit = async (formData: typeof modalGoalData) => {
    setLoading(true);
    try {
      const payload = {
        ...formData,
        assignedTo: session?.user?.id,
      };
      const response = await fetch('/api/goals/manager/self', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error('Failed to create goal');
      }
      showNotificationWithTimeout('Goal created successfully!', 'success');
      fetchGoals();
      setIsCreateModalOpen(false);
      setModalGoalData({
        title: '',
        description: '',
        dueDate: new Date().toISOString().split('T')[0],
        category: 'PROFESSIONAL',
      });
    } catch (error) {
      console.error('Error creating goal:', error);
      showNotificationWithTimeout('Failed to create goal. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickCreate = () => {
    setModalGoalData({
      title: '',
      description: '',
      dueDate: new Date().toISOString().split('T')[0],
      category: 'PROFESSIONAL',
    });
    setIsCreateModalOpen(true);
  };

  const handleTemplateSelect = (template: GoalTemplate) => {
    setModalGoalData({
      title: template.title,
      description: template.description,
      dueDate: new Date().toISOString().split('T')[0],
      category: template.category,
    });
    setIsCreateModalOpen(true);
  };

  // View handler
  const handleView = (goal: Goal) => {
    setViewedGoal(goal);
    setIsViewModalOpen(true);
  };

  // Delete handler
  const handleDelete = async (goalId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/goals/${goalId}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('Failed to delete goal');
      }
      showNotificationWithTimeout('Goal deleted successfully!', 'success');
      fetchGoals();
    } catch (error) {
      console.error('Error deleting goal:', error);
      showNotificationWithTimeout('Failed to delete goal. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Show all goals (not just self-created)
  const displayedGoals = goals;

  return (
    <DashboardLayout type="manager">
      <div className="space-y-6">
        {showNotification && (
          <div className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 p-4 rounded-lg shadow-lg flex items-center gap-2 ${
            notificationType === 'success' ? 'bg-emerald-500' : 'bg-rose-500'
          } text-white`}>
            {notificationMessage}
          </div>
        )}
        <Header onQuickCreateClick={handleQuickCreate} />
        <div className="w-full">
          <GoalTemplates onSelect={handleTemplateSelect} />
        </div>
        <SelfCreateGoalModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleModalSubmit}
          loading={loading}
          goal={modalGoalData}
          setGoal={setModalGoalData}
        />
        {/* Simple View Modal */}
        {isViewModalOpen && viewedGoal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
            <div className="bg-[#23263a] rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Goal Details</h2>
                <button onClick={() => setIsViewModalOpen(false)} className="text-gray-400 hover:text-white">×</button>
              </div>
              <div className="space-y-2">
                <div><span className="font-semibold text-gray-300">Title:</span> <span className="text-white">{viewedGoal.title}</span></div>
                <div><span className="font-semibold text-gray-300">Description:</span> <span className="text-white">{viewedGoal.description}</span></div>
                <div><span className="font-semibold text-gray-300">Category:</span> <span className="text-white">{viewedGoal.category}</span></div>
                <div><span className="font-semibold text-gray-300">Due Date:</span> <span className="text-white">{viewedGoal.dueDate}</span></div>
                <div><span className="font-semibold text-gray-300">Status:</span> <span className="text-white">{viewedGoal.status}</span></div>
              </div>
              <div className="flex justify-end mt-6">
                <button onClick={() => setIsViewModalOpen(false)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Close</button>
              </div>
            </div>
          </div>
        )}
        {/* Goal Management Section */}
        <div className="bg-[#1E2028] rounded-xl p-6 border border-gray-800 shadow-lg mt-6">
          <h2 className="text-xl font-bold text-white mb-4">Goal Management</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {displayedGoals.length === 0 ? (
              <div className="text-gray-400 col-span-full">No goals found.</div>
            ) : (
              displayedGoals.map(goal => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onView={() => handleView(goal)}
                  onEdit={() => {}}
                  onDelete={() => handleDelete(goal.id)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 
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
      <div className="space-y-4 sm:space-y-6 px-4 sm:px-6 max-w-7xl mx-auto">
        {showNotification && (
          <div className={`fixed top-4 sm:top-1/2 left-1/2 transform -translate-x-1/2 sm:-translate-y-1/2 z-50 p-4 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in ${
            notificationType === 'success' ? 'bg-gradient-to-r from-emerald-500 to-green-500' : 'bg-gradient-to-r from-rose-500 to-red-500'
          } text-white max-w-[90vw] sm:max-w-md backdrop-blur-sm`}>
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-[#23263a] rounded-xl p-4 sm:p-6 w-full max-w-lg mx-auto max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-700/50">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Goal Details</h2>
                <button 
                  onClick={() => setIsViewModalOpen(false)} 
                  className="text-gray-400 hover:text-white transition-all p-2 hover:bg-gray-700/50 rounded-full hover:rotate-90 duration-200"
                >
                  ×
                </button>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors">
                  <span className="font-semibold text-gray-300 block mb-2">Title</span>
                  <span className="text-white text-lg">{viewedGoal.title}</span>
                </div>
                <div className="p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors">
                  <span className="font-semibold text-gray-300 block mb-2">Description</span>
                  <span className="text-white whitespace-pre-wrap">{viewedGoal.description}</span>
                </div>
                <div className="p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors">
                  <span className="font-semibold text-gray-300 block mb-2">Category</span>
                  <span className="text-white">{viewedGoal.category}</span>
                </div>
                <div className="p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors">
                  <span className="font-semibold text-gray-300 block mb-2">Due Date</span>
                  <span className="text-white">{viewedGoal.dueDate}</span>
                </div>
                <div className="p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors">
                  <span className="font-semibold text-gray-300 block mb-2">Status</span>
                  <span className="text-white">{viewedGoal.status}</span>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button 
                  onClick={() => setIsViewModalOpen(false)} 
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:from-indigo-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Goal Management Section */}
        <div className="bg-[#1E2028] rounded-xl p-4 sm:p-6 border border-gray-800 shadow-lg mt-6 backdrop-blur-sm bg-opacity-95">
          <h2 className="text-xl font-bold text-white mb-6">Goal Management</h2>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {displayedGoals.length === 0 ? (
              <div className="text-gray-400 col-span-full text-center py-12 bg-gray-800/30 rounded-lg border border-gray-700/50">
                <p className="text-lg">No goals found.</p>
                <p className="text-sm mt-2 text-gray-500">Create your first goal to get started</p>
              </div>
            ) : (
              displayedGoals.map(goal => (
                <div key={goal.id} className="transform transition-all duration-200 hover:scale-[1.02] hover:shadow-xl">
                  <GoalCard
                    goal={goal}
                    onView={() => handleView(goal)}
                    onEdit={() => {}}
                    onDelete={() => handleDelete(goal.id)}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 
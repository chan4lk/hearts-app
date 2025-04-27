'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { Header } from './components/Header';
import GoalTemplates from '@/app/components/shared/GoalTemplates';
import { CreateGoalModal } from './components/CreateGoalModal';
import { AIGenerateModal } from './components/AIGenerateModal';
import { Goal, GoalTemplate } from './types';
import { CATEGORIES } from './constants';

export default function ManagerGoalsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');
  const [newGoal, setNewGoal] = useState<Partial<Goal>>({
    title: '',
    description: '',
    category: 'PROFESSIONAL',
    dueDate: new Date().toISOString().split('T')[0]
  });

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

  const handleSubmit = async (goal: Partial<Goal>) => {
    setLoading(true);
    try {
      const response = await fetch('/api/goals/manager/self', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(goal)
      });

      if (!response.ok) {
        throw new Error('Failed to create goal');
      }

      setIsCreateModalOpen(false);
      showNotificationWithTimeout('Goal created successfully!', 'success');
      fetchGoals();
      setNewGoal({
        title: '',
        description: '',
        category: 'PROFESSIONAL',
        dueDate: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Error creating goal:', error);
      showNotificationWithTimeout('Failed to create goal. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (template: GoalTemplate) => {
    setNewGoal({
      ...newGoal,
      title: template.title,
      description: template.description,
      category: template.category
    });
    setIsCreateModalOpen(true);
  };

  const handleAIGenerate = async (category: string, context: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/generate-goal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: `Create a professional goal in the ${category} category${context ? ` with this context: ${context}` : ''}`,
          category 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate goal');
      }

      const data = await response.json();
      setNewGoal(prev => ({
        ...prev,
        title: data.title,
        description: data.description,
      }));
      setIsAIModalOpen(false);
      showNotificationWithTimeout('Goal generated successfully!', 'success');
    } catch (error) {
      console.error('Error generating goal:', error);
      showNotificationWithTimeout('Failed to generate goal. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout type="manager">
      <div className="space-y-6">
        {/* Notification Toast */}
        {showNotification && (
          <div className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 p-4 rounded-lg shadow-lg flex items-center gap-2 ${
            notificationType === 'success' ? 'bg-emerald-500' : 'bg-rose-500'
          } text-white`}>
            {notificationMessage}
          </div>
        )}

        <Header 
          onAIClick={() => setIsAIModalOpen(true)}
          onQuickCreateClick={() => setIsCreateModalOpen(true)}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <GoalTemplates onSelect={handleTemplateSelect} />
          </div>
        </div>

        <CreateGoalModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleSubmit}
          loading={loading}
          goal={newGoal}
          setGoal={setNewGoal}
        />

        <AIGenerateModal
          isOpen={isAIModalOpen}
          onClose={() => setIsAIModalOpen(false)}
          onGenerate={handleAIGenerate}
          loading={loading}
          goal={newGoal}
          setGoal={setNewGoal}
        />
      </div>
    </DashboardLayout>
  );
} 
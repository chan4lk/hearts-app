'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import GoalTemplates from '@/app/components/shared/GoalTemplates';
import { Goal, GoalTemplate } from './types';
import { CATEGORIES } from './constants';
import { Header } from './components/Header';
import { CreateGoalModal } from '../setgoals/components/modals/CreateGoalModal';
import type { User, GoalFormData } from '../setgoals/components/types';

export default function ManagerGoalsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [modalGoalData, setModalGoalData] = useState<GoalFormData>({
    title: '',
    description: '',
    dueDate: new Date().toISOString().split('T')[0],
    employeeId: '',
    category: 'PROFESSIONAL',
  });
  const [assignedEmployees, setAssignedEmployees] = useState<User[]>([]);

  useEffect(() => {
    fetchGoals();
    fetchEmployees();
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

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees/assigned');
      const data = await response.json();
      setAssignedEmployees(data.employees || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const showNotificationWithTimeout = (message: string, type: 'success' | 'error') => {
    setNotificationMessage(message);
    setNotificationType(type);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const handleModalSubmit = async (formData: GoalFormData) => {
    setLoading(true);
    try {
      const response = await fetch('/api/goals/manager/self', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
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
        employeeId: '',
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
      employeeId: '',
      category: 'PROFESSIONAL',
    });
    setIsCreateModalOpen(true);
  };

  const handleTemplateSelect = (template: GoalTemplate) => {
    setModalGoalData({
      title: template.title,
      description: template.description,
      dueDate: new Date().toISOString().split('T')[0],
      employeeId: '',
      category: template.category,
    });
    setIsCreateModalOpen(true);
  };

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
        <CreateGoalModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleModalSubmit}
          assignedEmployees={assignedEmployees}
          loading={loading}
          formData={modalGoalData}
          setFormData={setModalGoalData}
        />
      </div>
    </DashboardLayout>
  );
} 
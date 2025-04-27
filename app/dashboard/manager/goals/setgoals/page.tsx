'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Toaster } from 'sonner';
import { 
  BsCalendar, 
  BsListTask, 
  BsTag,
  BsCheckCircle,
  BsClock,
  BsXCircle,
  BsPeople,
  BsPlus,
  BsEye,
  BsPencil,
  BsTrash,
  BsX,
  BsArrowCounterclockwise,
  BsLightbulb,
  BsAward,
  BsGraphUp,
  BsBriefcase,
  BsRocket,
  BsExclamationTriangle,
  BsGear,
  BsTrophy,
  BsBook,
  BsRobot
} from 'react-icons/bs';
import { User, Calendar } from 'lucide-react';
import type { IconType } from 'react-icons';

import { CreateGoalModal } from './components/modals/CreateGoalModal';
import { ViewGoalModal } from './components/modals/ViewGoalModal';
import { DeleteGoalModal } from './components/modals/DeleteGoalModal';
import { EditGoalModal } from './components/modals/EditGoalModal';
import { GoalCard } from '@/app/components/shared/GoalCard';
import { GoalTemplates } from '@/app/components/shared/GoalTemplates';
import { GoalStats } from './components/GoalStats';
import { GoalFormData, GoalStats as GoalStatsType } from './components/types';
import { CATEGORIES, GOAL_TEMPLATES } from '@/app/components/shared/constants';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string | null;
  position: string | null;
}

interface Goal {
  id: string;
  title: string;
  description: string;
  status: 'PENDING' | 'COMPLETED' | 'APPROVED' | 'REJECTED' | 'MODIFIED' | 'DRAFT';
  dueDate: string;
  category: string;
  createdAt: string;
  employee: {
    id: string;
    name: string;
    email: string;
  } | null;
  manager: {
    id: string;
    name: string;
    email: string;
  } | null;
}

type Template = {
  id: string;
  title: string;
  category: string;
  icon: IconType;
  iconColor: string;
  description: string;
  subtitle: string;
  bgGradient: string;
  bgColor: string;
};

function ManagerGoalSettingPageContent() {
  const { data: session } = useSession();
  const [assignedEmployees, setAssignedEmployees] = useState<User[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewedGoal, setViewedGoal] = useState<Goal | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [formData, setFormData] = useState<GoalFormData>({
    title: '',
    description: '',
    dueDate: new Date().toISOString().split('T')[0],
    employeeId: '',
    category: 'PROFESSIONAL'
  });
  const [stats, setStats] = useState<GoalStatsType>({
    totalEmployees: 0,
    totalGoals: 0,
    completedGoals: 0,
    pendingGoals: 0,
    draftGoals: 0,
    categoryStats: {}
  });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssignedEmployees = async () => {
      try {
        const response = await fetch('/api/employees/assigned');
        if (!response.ok) throw new Error('Failed to fetch assigned employees');
        const data = await response.json();
        setAssignedEmployees(data.employees);
      } catch (error) {
        console.error('Error fetching assigned employees:', error);
        toast.error('Failed to load assigned employees');
      }
    };

    fetchAssignedEmployees();
  }, []);

  const getFilteredGoals = (goals: Goal[]) => {
    if (selectedEmployee === 'all') return goals;
    return goals.filter(goal => goal.employee?.id === selectedEmployee);
  };

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const response = await fetch('/api/goals/managed');
        if (!response.ok) throw new Error('Failed to fetch goals');
        const data = await response.json();
        
        const assignedGoals = data.goals.filter((goal: Goal) => 
          goal.manager?.id === session?.user?.id && 
          goal.employee?.id !== session?.user?.id
        );
        
        setGoals(assignedGoals);
        
        const filteredGoals = getFilteredGoals(assignedGoals);
        setStats(prevStats => ({
          ...prevStats,
          totalEmployees: assignedEmployees.length,
          totalGoals: filteredGoals.length,
          completedGoals: filteredGoals.filter((g: Goal) => g.status === 'COMPLETED').length,
          pendingGoals: filteredGoals.filter((g: Goal) => g.status === 'PENDING').length,
          draftGoals: filteredGoals.filter((g: Goal) => g.status === 'DRAFT').length,
          categoryStats: filteredGoals.reduce((acc: { [key: string]: number }, goal: Goal) => {
            acc[goal.category] = (acc[goal.category] || 0) + 1;
            return acc;
          }, {})
        }));
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching goals:', error);
        toast.error('Failed to load goals');
        setLoading(false);
      }
    };

    if (assignedEmployees.length > 0) {
      fetchGoals();
    }
  }, [assignedEmployees, session?.user?.id, selectedEmployee]);

  const handleSubmit = async (formData: GoalFormData) => {
    setLoading(true);

    try {
      const validationErrors = [];
      if (!formData.title.trim()) validationErrors.push('Title is required');
      if (!formData.description.trim()) validationErrors.push('Description is required');
      if (!formData.dueDate) validationErrors.push('Due date is required');
      if (!formData.employeeId) validationErrors.push('Please select an employee');
      if (!formData.category) validationErrors.push('Please select a category');

      if (validationErrors.length > 0) {
        toast.error(validationErrors.join('\n'));
        setLoading(false);
        return;
      }

      const selectedDate = new Date(formData.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        toast.warning('Due date cannot be in the past');
        setLoading(false);
        return;
      }

      const goalData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        employeeId: formData.employeeId,
        dueDate: new Date(formData.dueDate).toISOString(),
        category: formData.category,
        status: 'DRAFT'
      };

      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(goalData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create goal');
      }

      const responseData = await response.json();
      setGoals(prevGoals => [responseData.goal, ...prevGoals]);
      setIsCreateModalOpen(false);
      setFormData({
        title: '',
        description: '',
        dueDate: new Date().toISOString().split('T')[0],
        employeeId: '',
        category: 'PROFESSIONAL'
      });
      
      setTimeout(() => {
        toast.success('Goal created successfully! 🎯', {
          duration: 3000,
          position: 'top-center',
          style: {
            background: '#1E2028',
            color: 'white',
            border: '1px solid #2d2f36',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          },
        });
      }, 100);
    } catch (error) {
      console.error('Error creating goal:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create goal');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (template: Template) => {
    setFormData({
      ...formData,
      title: template.title,
      description: template.description,
      category: template.category
    });
    setIsCreateModalOpen(true);
  };

  const handleView = (goal: Goal) => {
    setViewedGoal(goal);
    setIsViewModalOpen(true);
  };

  const handleEdit = (goal: Goal) => {
    setSelectedGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description,
      dueDate: new Date(goal.dueDate).toISOString().split('T')[0],
      employeeId: goal.employee?.id || '',
      category: goal.category
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateGoal = async (updatedData: GoalFormData) => {
    if (!selectedGoal) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/goals/${selectedGoal.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        throw new Error('Failed to update goal');
      }

      const updatedGoal = await response.json();
      
      // Update the goals list with the new data
      setGoals(prevGoals => 
        prevGoals.map(goal => goal.id === selectedGoal.id ? updatedGoal : goal)
      );
      
      // Calculate filtered goals using the updated list
      const filteredGoals = getFilteredGoals(goals.map(goal => 
        goal.id === selectedGoal.id ? updatedGoal : goal
      ));
      
      setStats(prevStats => ({
        ...prevStats,
        totalGoals: filteredGoals.length,
        completedGoals: filteredGoals.filter((g: Goal) => g.status === 'COMPLETED').length,
        pendingGoals: filteredGoals.filter((g: Goal) => g.status === 'PENDING').length,
        draftGoals: filteredGoals.filter((g: Goal) => g.status === 'DRAFT').length,
        categoryStats: filteredGoals.reduce((acc: { [key: string]: number }, goal: Goal) => {
          acc[goal.category] = (acc[goal.category] || 0) + 1;
          return acc;
        }, {})
      }));

      setIsEditModalOpen(false);
      setSelectedGoal(null);
      setFormData({
        title: '',
        description: '',
        dueDate: new Date().toISOString().split('T')[0],
        employeeId: '',
        category: 'PROFESSIONAL'
      });

      toast.success('Goal updated successfully! 🎯');
    } catch (error) {
      console.error('Error updating goal:', error);
      toast.error('Failed to update goal');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (goalId: string) => {
    setGoalToDelete(goalId);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!goalToDelete) return;

    try {
      const response = await fetch(`/api/goals/${goalToDelete}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete goal');
      }

      setGoals(prevGoals => prevGoals.filter(goal => goal.id !== goalToDelete));
      setIsDeleteModalOpen(false);
      setGoalToDelete(null);
      
      toast.success('Goal deleted successfully! 🗑️');
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete goal');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#1E2028] rounded-xl p-6 border border-gray-800 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              Manage Employee Goals
              <span className="bg-blue-500/10 p-1 rounded text-blue-400 text-sm font-normal">
                Manager Portal
              </span>
            </h1>
            <p className="text-gray-400 mt-1">Create and manage goals for your assigned employees</p>
          </div>
          <div className="flex gap-3">
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <BsPlus className="w-5 h-5" />
            Quick Create
          </Button>
        </div>
      </div>
        </div>

      <GoalTemplates onTemplateSelect={handleTemplateSelect} />
      <GoalStats stats={stats} />

      <div className="bg-[#1E2028] rounded-xl p-6 border border-gray-800 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Goal Management
              <span className="bg-blue-500/10 p-1 rounded text-blue-400 text-sm font-normal">
                {getFilteredGoals(goals).length} Goals
              </span>
            </h2>
            <p className="text-gray-400 mt-1">Manage and track all assigned goals</p>
          </div>
          <div className="flex items-center gap-4">
            <Select
              value={selectedEmployee}
              onValueChange={setSelectedEmployee}
            >
              <SelectTrigger className="w-[200px] bg-[#25262b] border-0 focus:ring-1 focus:ring-gray-500 text-white">
                <SelectValue>
                  <div className="flex items-center gap-2 text-white">
                    <BsPeople className="h-4 w-4 text-gray-400" />
                    <span className="text-white">{selectedEmployee === 'all' ? 'All Employees' : assignedEmployees.find(e => e.id === selectedEmployee)?.name}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-[#25262b] border border-gray-700">
                <SelectItem value="all" className="focus:bg-gray-700">
                  <div className="flex items-center gap-2 text-white">
                    <BsPeople className="h-4 w-4 text-gray-400" />
                    <span className="text-white">All Employees</span>
                  </div>
                </SelectItem>
                {assignedEmployees.map((employee) => (
                  <SelectItem 
                    key={employee.id} 
                    value={employee.id}
                    className="focus:bg-gray-700"
                  >
                    <div className="flex items-center gap-2 text-white">
                      <BsPeople className="h-4 w-4 text-gray-400" />
                      <span className="text-white">{employee.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {getFilteredGoals(goals).map((goal) => (
            <GoalCard
              key={goal.id} 
              goal={goal}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
                </div>
                  </div>

      <CreateGoalModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleSubmit}
        assignedEmployees={assignedEmployees}
        loading={loading}
        formData={formData}
        setFormData={setFormData}
      />

      <EditGoalModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleUpdateGoal}
        assignedEmployees={assignedEmployees}
        loading={loading}
        formData={formData}
        setFormData={setFormData}
        goal={selectedGoal}
      />

      <ViewGoalModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        goal={viewedGoal}
        onEdit={() => {
          setIsViewModalOpen(false);
          if (viewedGoal) handleEdit(viewedGoal);
        }}
      />

      <DeleteGoalModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setGoalToDelete(null);
        }}
        onConfirm={confirmDelete}
      />

      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1E2028',
            color: 'white',
            border: '1px solid #2d2f36',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          },
        }}
      />
    </div>
  );
}

export default function ManagerGoalSettingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardLayout type="manager">
        <ManagerGoalSettingPageContent />
      </DashboardLayout>
    </Suspense>
  );
}
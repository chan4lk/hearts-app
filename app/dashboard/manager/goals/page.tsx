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
  BsBook
} from 'react-icons/bs';
import { User, Calendar } from 'lucide-react';

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

const CATEGORIES = [
  { 
    value: 'PROFESSIONAL', 
    label: 'Professional Development',
    icon: <BsRocket className="w-4 h-4 text-blue-400" />
  },
  { 
    value: 'TECHNICAL', 
    label: 'Technical Skills',
    icon: <BsGear className="w-4 h-4 text-emerald-400" />
  },
  { 
    value: 'LEADERSHIP', 
    label: 'Leadership',
    icon: <BsTrophy className="w-4 h-4 text-amber-400" />
  },
  { 
    value: 'PERSONAL', 
    label: 'Personal Growth',
    icon: <BsGraphUp className="w-4 h-4 text-purple-400" />
  },
  { 
    value: 'TRAINING', 
    label: 'Training',
    icon: <BsBook className="w-4 h-4 text-rose-400" />
  }
] as const;

const GOAL_TEMPLATES = [
  {
    id: 'project-completion',
    title: 'Project Milestone',
    category: 'PROFESSIONAL',
    icon: <BsRocket className="w-6 h-6 text-blue-400" />,
    description: 'Complete [Project Name] milestone by [Date] achieving [Specific Metrics]',
    subtitle: 'Project Excellence',
    bgGradient: 'from-blue-500/10 to-transparent',
    bgColor: 'bg-[#1a1f35]'
  },
  {
    id: 'skill-mastery',
    title: 'Skill Mastery',
    category: 'TECHNICAL',
    icon: <BsLightbulb className="w-6 h-6 text-amber-400" />,
    description: 'Master [Technology/Skill] through [Training/Project] by [Date]',
    subtitle: 'Technical Growth',
    bgGradient: 'from-amber-500/10 to-transparent',
    bgColor: 'bg-[#2a2520]'
  },
  {
    id: 'leadership-initiative',
    title: 'Leadership Initiative',
    category: 'LEADERSHIP',
    icon: <BsAward className="w-6 h-6 text-purple-400" />,
    description: 'Lead [Team/Project] to achieve [Specific Outcome] by [Date]',
    subtitle: 'Leadership Development',
    bgGradient: 'from-purple-500/10 to-transparent',
    bgColor: 'bg-[#251a35]'
  },
  {
    id: 'career-growth',
    title: 'Career Development',
    category: 'PERSONAL',
    icon: <BsGraphUp className="w-6 h-6 text-emerald-400" />,
    description: 'Achieve [Career Milestone] through [Actions] by [Date]',
    subtitle: 'Professional Growth',
    bgGradient: 'from-emerald-500/10 to-transparent',
    bgColor: 'bg-[#1a2a25]'
  },
  {
    id: 'certification-goal',
    title: 'Certification Goal',
    category: 'TRAINING',
    icon: <BsBriefcase className="w-6 h-6 text-rose-400" />,
    description: 'Obtain [Certification Name] certification by [Date]',
    subtitle: 'Professional Certification',
    bgGradient: 'from-rose-500/10 to-transparent',
    bgColor: 'bg-[#2a1a20]'
  }
];

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
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: new Date().toISOString().split('T')[0],
    employeeId: '',
    category: 'PROFESSIONAL'
  });
  const [stats, setStats] = useState({
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
        
        // Filter goals to only show those assigned by the manager to employees
        const assignedGoals = data.goals.filter((goal: Goal) => 
          goal.manager?.id === session?.user?.id && 
          goal.employee?.id !== session?.user?.id
        );
        
        setGoals(assignedGoals);
        
        // Update stats based on filtered goals
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validationErrors = [];
      if (!formData.title.trim()) validationErrors.push('Title is required');
      if (!formData.description.trim()) validationErrors.push('Description is required');
      if (!formData.dueDate) validationErrors.push('Due date is required');
      if (!formData.employeeId) validationErrors.push('Please select an employee');
      if (!formData.category) validationErrors.push('Please select a category');

      if (validationErrors.length > 0) {
        toast.error(validationErrors.join('\n'), {
          position: 'top-center',
          duration: 3000,
          style: {
            background: '#1E2028',
            color: 'white',
            border: '1px solid #2d2f36',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          },
          icon: <BsXCircle className="w-5 h-5 text-rose-400" />,
        });
        setLoading(false);
        return;
      }

      const selectedDate = new Date(formData.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        toast.error('Due date cannot be in the past', {
          position: 'top-center',
          duration: 3000,
          style: {
            background: '#1E2028',
            color: 'white',
            border: '1px solid #2d2f36',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          },
          icon: <BsXCircle className="w-5 h-5 text-rose-400" />,
        });
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
      setFormData({
        title: '',
        description: '',
        dueDate: new Date().toISOString().split('T')[0],
        employeeId: '',
        category: 'PROFESSIONAL'
      });

      setIsCreateModalOpen(false);
      
      // Ensure the toast is shown after the modal is closed
      setTimeout(() => {
        toast.success('Goal created successfully', {
          position: 'top-center',
          duration: 3000,
          style: {
            background: '#1E2028',
            color: 'white',
            border: '1px solid #2d2f36',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          },
          icon: <BsCheckCircle className="w-5 h-5 text-emerald-400" />,
        });
      }, 100);

    } catch (error) {
      console.error('Error creating goal:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create goal', {
        position: 'top-center',
        duration: 3000,
        style: {
          background: '#1E2028',
          color: 'white',
          border: '1px solid #2d2f36',
          padding: '16px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        },
        icon: <BsXCircle className="w-5 h-5 text-rose-400" />,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (template: typeof GOAL_TEMPLATES[0]) => {
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

  const handleDelete = async (goalId: string) => {
    setGoalToDelete(goalId);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!goalToDelete) return;

    try {
      const response = await fetch(`/api/goals?id=${goalToDelete}`, {
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
      
      toast.success('Goal deleted successfully', {
        position: 'top-center',
        duration: 3000,
        style: {
          background: '#1E2028',
          color: 'white',
          border: '1px solid #2d2f36',
          padding: '16px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        },
        icon: <BsCheckCircle className="w-5 h-5 text-emerald-400" />,
      });
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete goal', {
        position: 'top-center',
        duration: 3000,
        style: {
          background: '#1E2028',
          color: 'white',
          border: '1px solid #2d2f36',
          padding: '16px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        },
        icon: <BsXCircle className="w-5 h-5 text-rose-400" />,
      });
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    if (!selectedGoal) return;

    // Validate required fields
    const validationErrors = [];
    if (!formData.title.trim()) validationErrors.push('Title is required');
    if (!formData.description.trim()) validationErrors.push('Description is required');
    if (!formData.dueDate) validationErrors.push('Due date is required');
    if (!formData.employeeId) validationErrors.push('Please select an employee');
    if (!formData.category) validationErrors.push('Please select a category');

    if (validationErrors.length > 0) {
      toast.error(validationErrors.join('\n'), {
        position: 'top-center',
        duration: 3000,
        style: {
          background: '#1E2028',
          color: 'white',
          border: '1px solid #2d2f36',
          padding: '16px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        },
        icon: <BsXCircle className="w-5 h-5 text-rose-400" />,
      });
      setLoading(false);
      return;
    }

    // Validate due date is not in the past
    const selectedDate = new Date(formData.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      toast.error('Due date cannot be in the past', {
        position: 'top-center',
        duration: 3000,
        style: {
          background: '#1E2028',
          color: 'white',
          border: '1px solid #2d2f36',
          padding: '16px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        },
        icon: <BsXCircle className="w-5 h-5 text-rose-400" />,
      });
      setLoading(false);
      return;
    }

    try {
      const goalData = {
        id: selectedGoal.id,
        title: formData.title.trim(),
        description: formData.description.trim(),
        employeeId: formData.employeeId,
        dueDate: new Date(formData.dueDate).toISOString(),
        category: formData.category
      };

      const response = await fetch(`/api/goals`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(goalData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update goal');
      }

      const updatedGoal = await response.json();
      
      if (!updatedGoal || !updatedGoal.id) {
        throw new Error('Invalid goal data received from server');
      }

      // Update goals state with the updated goal
      setGoals(prevGoals => prevGoals.map(goal => 
        goal.id === updatedGoal.id ? updatedGoal : goal
      ));
      
      // Reset form and close modal
      setSelectedGoal(null);
      setFormData({
        title: '',
        description: '',
        dueDate: new Date().toISOString().split('T')[0],
        employeeId: '',
        category: 'PROFESSIONAL'
      });
      setIsEditModalOpen(false);

      // Show success message after modal is closed
      setTimeout(() => {
        toast.success('Goal updated successfully!', {
          position: 'top-center',
          duration: 4000,
          style: {
            background: '#1E2028',
            color: 'white',
            border: '1px solid #2d2f36',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          },
          icon: <BsCheckCircle className="w-5 h-5 text-emerald-400" />,
          description: (
            <div className="mt-1 text-sm text-gray-400">
              The goal "{updatedGoal.title}" has been successfully updated.
            </div>
          ),
        });
      }, 100);
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update goal', {
        position: 'top-center',
        duration: 4000,
        style: {
          background: '#1E2028',
          color: 'white',
          border: '1px solid #2d2f36',
          padding: '16px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        },
        icon: <BsXCircle className="w-5 h-5 text-rose-400" />,
        description: (
          <div className="mt-1 text-sm text-gray-400">
            Please try again or contact support if the problem persists.
          </div>
        ),
      });
    } finally {
      setLoading(false);
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
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <BsPlus className="w-5 h-5" />
            Quick Create
          </Button>
        </div>
      </div>

      {/* Goal Templates */}
      <div className="bg-[#1E2028] rounded-xl p-6 border border-gray-800">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-amber-500/10 p-2 rounded-lg">
            <BsLightbulb className="w-5 h-5 text-amber-400" />
          </div>
          <h2 className="text-xl font-semibold text-white">Goal Templates</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {GOAL_TEMPLATES.map((template) => (
            <div
              key={template.id}
              onClick={() => handleTemplateSelect(template)}
              className={`${template.bgColor} hover:bg-opacity-80 border border-gray-800 hover:border-gray-700 rounded-lg p-4 cursor-pointer transition-all duration-200`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-[#1E2028] border border-gray-700">
                  {template.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-medium">{template.title}</h3>
                  <p className="text-sm text-gray-400">{template.subtitle}</p>
                  <p className="text-xs text-gray-500 mt-2">{template.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#1E2028] rounded-xl p-6 border border-gray-800 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <BsPeople className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Employees</p>
              <h3 className="text-2xl font-bold text-white">{stats.totalEmployees}</h3>
            </div>
          </div>
        </div>

        <div className="bg-[#1E2028] rounded-xl p-6 border border-gray-800 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-emerald-500/10">
              <BsCheckCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Completed Goals</p>
              <h3 className="text-2xl font-bold text-white">{stats.completedGoals}</h3>
            </div>
          </div>
        </div>

        <div className="bg-[#1E2028] rounded-xl p-6 border border-gray-800 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-amber-500/10">
              <BsClock className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Pending Goals</p>
              <h3 className="text-2xl font-bold text-white">{stats.pendingGoals}</h3>
            </div>
          </div>
        </div>

        <div className="bg-[#1E2028] rounded-xl p-6 border border-gray-800 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-gray-500/10">
              <BsListTask className="w-6 h-6 text-gray-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Draft Goals</p>
              <h3 className="text-2xl font-bold text-white">{stats.draftGoals}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Goal Cards */}
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
            <Card 
              key={goal.id} 
              className="bg-[#1E2028] border-gray-800 hover:shadow-lg transition-shadow group"
            >
              <CardHeader>
                <CardTitle className="text-white">{goal.title}</CardTitle>
                <CardDescription>
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 mr-2">
                    {goal.category}
                  </Badge>
                  <Badge 
                    variant={goal.status === 'DRAFT' ? 'outline' : 'default'}
                    className={goal.status === 'DRAFT' ? 'bg-gray-500/10 text-gray-400 border-gray-500/20' : ''}
                  >
                    {goal.status}
                  </Badge>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 mb-4">{goal.description}</p>
                <div className="space-y-2 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <BsPeople className="w-4 h-4 text-blue-400" />
                    <span>{goal.employee?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BsCalendar className="w-4 h-4 text-amber-400" />
                    <span>{new Date(goal.dueDate).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleView(goal)}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    <BsEye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedGoal(goal);
                      setFormData({
                        title: goal.title,
                        description: goal.description,
                        dueDate: new Date(goal.dueDate).toISOString().split('T')[0],
                        employeeId: goal.employee?.id || '',
                        category: goal.category
                      });
                      setIsEditModalOpen(true);
                    }}
                    className="text-amber-400 hover:text-amber-300"
                  >
                    <BsPencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(goal.id)}
                    className="text-rose-400 hover:text-rose-300"
                  >
                    <BsTrash className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center pt-16">
          <div className="bg-[#1a1b1e] rounded-lg w-full max-w-xl mx-4">
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-500/10 p-2 rounded-lg">
                    <BsPlus className="w-5 h-5 text-amber-400" />
                  </div>
                  <h2 className="text-2xl font-semibold text-white">Create New Goal</h2>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <BsX className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Goal Title
                  </label>
                  <div className="relative">
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Enter goal title"
                      className="bg-[#25262b] border-0 focus:ring-1 focus:ring-gray-500 text-white pl-10"
                    />
                    <BsListTask className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the goal"
                    className="bg-[#25262b] border-0 focus:ring-1 focus:ring-gray-500 text-white min-h-[120px]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Assign to Employee
                  </label>
                  <Select
                    value={formData.employeeId}
                    onValueChange={(value) => setFormData({ ...formData, employeeId: value })}
                  >
                    <SelectTrigger className="bg-[#25262b] border-0 focus:ring-1 focus:ring-gray-500">
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          <BsPeople className="h-4 w-4 text-gray-400" />
                          <span>{assignedEmployees.find(e => e.id === formData.employeeId)?.name || "Select employee"}</span>
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-[#25262b] border border-gray-700">
                      {assignedEmployees.map((employee) => (
                        <SelectItem 
                          key={employee.id} 
                          value={employee.id}
                          className="focus:bg-gray-700"
                        >
                          <div className="flex items-center gap-2">
                            <BsPeople className="h-4 w-4 text-gray-400" />
                            <span>{employee.name}</span>
                            <span className="text-gray-500 text-sm ml-2">({employee.email})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Category
                    </label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger className="bg-[#25262b] border-0 focus:ring-1 focus:ring-gray-500">
                        <SelectValue>
                          {formData.category && (
                            <div className="flex items-center gap-2">
                              {CATEGORIES.find(c => c.value === formData.category)?.icon}
                              <span>{CATEGORIES.find(c => c.value === formData.category)?.label}</span>
                            </div>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-[#25262b] border border-gray-700">
                        {CATEGORIES.map((category) => (
                          <SelectItem 
                            key={category.value} 
                            value={category.value}
                            className="focus:bg-gray-700"
                          >
                            <div className="flex items-center gap-2">
                              {category.icon}
                              <span>{category.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Due Date
                    </label>
                    <div className="relative">
                      <Input
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                        className="bg-[#25262b] border-0 focus:ring-1 focus:ring-gray-500 text-white pl-10"
                      />
                      <BsCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="bg-transparent hover:bg-gray-800 border-gray-700 text-gray-300"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setFormData({
                        title: '',
                        description: '',
                        dueDate: new Date().toISOString().split('T')[0],
                        employeeId: '',
                        category: 'PROFESSIONAL'
                      });
                    }}
                    className="bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-400 flex items-center gap-2 transition-colors"
                  >
                    <BsArrowCounterclockwise className="h-4 w-4" />
                    Reset
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-[#4c49ed] hover:bg-[#4644e5] text-white"
                  >
                    Create Goal
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {isViewModalOpen && viewedGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsViewModalOpen(false)}
          />
          <div className="relative z-10 bg-[#1E2028] border border-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-blue-500/10 p-2 rounded-lg">
                  <BsEye className="w-5 h-5 text-blue-400" />
                </div>
                <h2 className="text-xl font-bold text-white">View Goal Details</h2>
              </div>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <BsX className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-[#2d2f36] rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-2">{viewedGoal.title}</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                    {CATEGORIES.find(c => c.value === viewedGoal.category)?.label || viewedGoal.category}
                  </Badge>
                  <Badge 
                    variant="outline"
                    className={`
                      ${viewedGoal.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : ''}
                      ${viewedGoal.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : ''}
                      ${viewedGoal.status === 'DRAFT' ? 'bg-gray-500/10 text-gray-400 border-gray-500/20' : ''}
                      ${viewedGoal.status === 'APPROVED' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : ''}
                      ${viewedGoal.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : ''}
                    `}
                  >
                    {viewedGoal.status}
                  </Badge>
                </div>
              </div>

              <div className="bg-[#2d2f36] rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-400 mb-2">Description</h4>
                <p className="text-gray-300 whitespace-pre-wrap">{viewedGoal.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#2d2f36] rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Assigned To</h4>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-400" />
                    <div>
                      <p className="text-gray-300">{viewedGoal.employee?.name}</p>
                      <p className="text-sm text-gray-500">{viewedGoal.employee?.email}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#2d2f36] rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Due Date</h4>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-400" />
                    <p className="text-gray-300">
                      {new Date(viewedGoal.dueDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                <Button
                  variant="outline"
                  onClick={() => setIsViewModalOpen(false)}
                  className="bg-transparent hover:bg-gray-800 border-gray-700 text-gray-300"
                >
                  Close
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsViewModalOpen(false);
                    setSelectedGoal(viewedGoal);
                    setFormData({
                      title: viewedGoal.title,
                      description: viewedGoal.description,
                      dueDate: new Date(viewedGoal.dueDate).toISOString().split('T')[0],
                      employeeId: viewedGoal.employee?.id || '',
                      category: viewedGoal.category
                    });
                    setIsEditModalOpen(true);
                  }}
                  className="bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30 text-blue-400"
                >
                  <BsPencil className="w-4 h-4 mr-2" />
                  Edit Goal
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedGoal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center pt-16">
          <div className="bg-[#1a1b1e] rounded-lg w-full max-w-xl mx-4">
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-500/10 p-2 rounded-lg">
                    <BsPencil className="w-5 h-5 text-amber-400" />
                  </div>
                  <h2 className="text-2xl font-semibold text-white">Edit Goal</h2>
                </div>
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedGoal(null);
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <BsX className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                handleUpdate(e);
              }} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Goal Title
                  </label>
                  <div className="relative">
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Enter goal title"
                      className="bg-[#25262b] border-0 focus:ring-1 focus:ring-gray-500 text-white pl-10"
                    />
                    <BsListTask className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the goal"
                    className="bg-[#25262b] border-0 focus:ring-1 focus:ring-gray-500 text-white min-h-[120px]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Assign to Employee
                  </label>
                  <Select
                    value={formData.employeeId}
                    onValueChange={(value) => setFormData({ ...formData, employeeId: value })}
                  >
                    <SelectTrigger className="bg-[#25262b] border-0 focus:ring-1 focus:ring-gray-500">
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          <BsPeople className="h-4 w-4 text-gray-400" />
                          <span>{assignedEmployees.find(e => e.id === formData.employeeId)?.name || "Select employee"}</span>
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-[#25262b] border border-gray-700">
                      {assignedEmployees.map((employee) => (
                        <SelectItem 
                          key={employee.id} 
                          value={employee.id}
                          className="focus:bg-gray-700"
                        >
                          <div className="flex items-center gap-2">
                            <BsPeople className="h-4 w-4 text-gray-400" />
                            <span>{employee.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Category
                    </label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger className="bg-[#25262b] border-0 focus:ring-1 focus:ring-gray-500">
                        <SelectValue>
                          {formData.category && (
                            <div className="flex items-center gap-2">
                              {CATEGORIES.find(c => c.value === formData.category)?.icon}
                              <span>{CATEGORIES.find(c => c.value === formData.category)?.label}</span>
                            </div>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-[#25262b] border border-gray-700">
                        {CATEGORIES.map((category) => (
                          <SelectItem 
                            key={category.value} 
                            value={category.value}
                            className="focus:bg-gray-700"
                          >
                            <div className="flex items-center gap-2">
                              {category.icon}
                              <span>{category.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Due Date
                    </label>
                    <div className="relative">
                      <Input
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                        className="bg-[#25262b] border-0 focus:ring-1 focus:ring-gray-500 text-white pl-10"
                      />
                      <BsCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setSelectedGoal(null);
                    }}
                    className="bg-transparent hover:bg-gray-800 border-gray-700 text-gray-300"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (selectedGoal) {
                        setFormData({
                          title: selectedGoal.title,
                          description: selectedGoal.description,
                          dueDate: new Date(selectedGoal.dueDate).toISOString().split('T')[0],
                          employeeId: selectedGoal.employee?.id || '',
                          category: selectedGoal.category
                        });
                      }
                    }}
                    className="bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-400 flex items-center gap-2 transition-colors"
                  >
                    <BsArrowCounterclockwise className="h-4 w-4" />
                    Reset
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-[#4c49ed] hover:bg-[#4644e5] text-white"
                  >
                    Update Goal
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setIsDeleteModalOpen(false);
              setGoalToDelete(null);
            }}
          />
          <div className="relative z-10 bg-[#1E2028] border border-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-start gap-4">
              <div className="bg-rose-500/10 p-2 rounded-lg">
                <BsExclamationTriangle className="w-6 h-6 text-rose-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">Delete Goal</h3>
                <p className="text-gray-400 mt-2">
                  Are you sure you want to delete this goal? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsDeleteModalOpen(false);
                      setGoalToDelete(null);
                    }}
                    className="bg-transparent border-gray-700 hover:bg-gray-700/50"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={confirmDelete}
                    className="bg-rose-600 hover:bg-rose-700"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
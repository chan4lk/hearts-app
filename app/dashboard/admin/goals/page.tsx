'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BsCalendar, 
  BsListTask, 
  BsTag, 
  BsArrowLeft, 
  BsSearch, 
  BsBarChartLine, 
  BsCheckCircle, 
  BsClock, 
  BsXCircle,
  BsChevronRight,
  BsThreeDotsVertical,
  BsLightningCharge,
  BsBook,
  BsGraphUp,
  BsPeople,
  BsStars,
  BsTrophy,
  BsGear,
  BsArrowUpRight,
  BsRocket,
  BsLightbulb,
  BsAward,
  BsBriefcase,
  BsPlus,
  BsEye,
  BsPencil,
  BsTrash,
  BsX
} from 'react-icons/bs';
import { Badge } from '@/components/ui/badge';
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
  status: 'PENDING' | 'COMPLETED' | 'APPROVED' | 'REJECTED' | 'MODIFIED';
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
  { value: 'PROFESSIONAL', label: 'Professional Development' },
  { value: 'TECHNICAL', label: 'Technical Skills' },
  { value: 'LEADERSHIP', label: 'Leadership' },
  { value: 'PERSONAL', label: 'Personal Growth' },
  { value: 'TRAINING', label: 'Training' }
] as const;

const getStatusBadge = (status: string) => {
  const statusVariants = {
    PENDING: 'secondary',
    COMPLETED: 'default',
    APPROVED: 'default',
    REJECTED: 'destructive',
    MODIFIED: 'outline'
  } as const;

  return statusVariants[status as keyof typeof statusVariants] || 'secondary';
};

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
    id: 'innovation-project',
    title: 'Innovation Project',
    category: 'PROFESSIONAL',
    icon: <BsStars className="w-6 h-6 text-indigo-400" />,
    description: 'Develop innovative solution for [Problem] achieving [Metrics]',
    subtitle: 'Innovation & Creativity',
    bgGradient: 'from-indigo-500/10 to-transparent',
    bgColor: 'bg-[#1a1a35]'
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

function AdminGoalSettingPageContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalManagers: 0,
    totalGoals: 0,
    completedGoals: 0,
    pendingGoals: 0,
    categoryStats: {}
  });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: new Date().toISOString().split('T')[0],
    employeeId: '',
    category: 'PROFESSIONAL'
  });
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewedGoal, setViewedGoal] = useState<Goal | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');
        if (!response.ok) throw new Error('Failed to fetch users');
        const data = await response.json();
        setUsers(data.users);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchGoalsAndStats = async () => {
      try {
        const response = await fetch('/api/goals');
        if (!response.ok) throw new Error('Failed to fetch goals');
        const data = await response.json();
        setGoals(data.goals);
        
        // Update stats with the data from API
        setStats(prevStats => ({
          ...prevStats,
          totalGoals: data.stats.total,
          completedGoals: data.stats.completed,
          pendingGoals: data.stats.pending,
          inProgressGoals: data.stats.inProgress
        }));

        // Update employee and manager counts
        const employeeCount = users.filter(user => user.role === 'EMPLOYEE').length;
        const managerCount = users.filter(user => user.role === 'MANAGER').length;
        
        setStats(prevStats => ({
          ...prevStats,
          totalEmployees: employeeCount,
          totalManagers: managerCount
        }));

        // Calculate category stats
        const categoryStats = data.goals.reduce((acc: any, goal: Goal) => {
          acc[goal.category] = (acc[goal.category] || 0) + 1;
          return acc;
        }, {});

        setStats(prevStats => ({
          ...prevStats,
          categoryStats
        }));

      } catch (error) {
        console.error('Error fetching goals:', error);
        toast.error('Failed to load goals');
      }
    };

    if (users.length > 0) {
      fetchGoalsAndStats();
    }
  }, [users]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields with detailed error messages
      const validationErrors = [];
      if (!formData.title.trim()) validationErrors.push('Title is required');
      if (!formData.description.trim()) validationErrors.push('Description is required');
      if (!formData.dueDate) validationErrors.push('Due date is required');
      if (!formData.employeeId) validationErrors.push('Please select an employee or manager');
      if (!formData.category) validationErrors.push('Please select a category');

      if (validationErrors.length > 0) {
        toast.error(validationErrors.join('\n'));
        setLoading(false);
        return;
      }

      // Validate due date is not in the past
      const selectedDate = new Date(formData.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        toast.error('Due date cannot be in the past');
        setLoading(false);
        return;
      }

      // Prepare the request body with proper date formatting
      const goalData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        employeeId: formData.employeeId,
        dueDate: new Date(formData.dueDate).toISOString(),
        category: formData.category
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
      
      // Add the new goal to the state
      setGoals(prevGoals => [responseData.goal, ...prevGoals]);

      // Update stats
      const statsResponse = await fetch('/api/goals');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(prevStats => ({
          ...prevStats,
          totalGoals: statsData.stats.total,
          completedGoals: statsData.stats.completed,
          pendingGoals: statsData.stats.pending,
          inProgressGoals: statsData.stats.inProgress,
          categoryStats: statsData.stats.categories
        }));
      }

      // Reset form and show success message
      setFormData({
        title: '',
        description: '',
        dueDate: new Date().toISOString().split('T')[0],
        employeeId: '',
        category: 'PROFESSIONAL'
      });

      // Close modal and show success message
      setIsCreateModalOpen(false);
      toast.success('Goal created successfully');

    } catch (error) {
      console.error('Error creating goal:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create goal');
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

  const filteredUsers = (role: string) => {
    return users.filter(user => user.role === role);
  };

  const handleDelete = async (goalId: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;
    
    try {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          // Add session token if available
          ...(session?.user?.email && { 'Authorization': `Bearer ${session.user.email}` })
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete goal');
      }
      
      setGoals(prevGoals => prevGoals.filter(g => g.id !== goalId));
      toast.success('Goal deleted successfully');
      router.refresh();
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete goal');
    }
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

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!selectedGoal) return;

      // Validate required fields
      const validationErrors = [];
      if (!formData.title.trim()) validationErrors.push('Title is required');
      if (!formData.description.trim()) validationErrors.push('Description is required');
      if (!formData.dueDate) validationErrors.push('Due date is required');
      if (!formData.employeeId) validationErrors.push('Please select an employee or manager');
      if (!formData.category) validationErrors.push('Please select a category');

      if (validationErrors.length > 0) {
        toast.error(validationErrors.join('\n'));
        setLoading(false);
        return;
      }

      // Validate due date is not in the past
      const selectedDate = new Date(formData.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        toast.error('Due date cannot be in the past');
        setLoading(false);
        return;
      }

      const goalData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        employeeId: formData.employeeId,
        dueDate: new Date(formData.dueDate).toISOString(),
        category: formData.category
      };

      const response = await fetch(`/api/goals/${selectedGoal.id}`, {
        method: 'PUT',
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
      
      // Update the goals list with the updated goal
      setGoals(prevGoals => 
        prevGoals.map(g => g.id === selectedGoal.id ? updatedGoal.goal : g)
      );

      // Close modal and show success message
      setIsEditModalOpen(false);
      toast.success('Goal updated successfully');

    } catch (error) {
      console.error('Error updating goal:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update goal');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {showNotification && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowNotification(false)} />
          <div className={`relative p-6 rounded-lg shadow-lg flex items-center gap-3 ${
            notificationType === 'success' ? 'bg-[#1E2028] border border-emerald-500/20' : 'bg-[#1E2028] border border-rose-500/20'
          } min-w-[300px] transform transition-all duration-300 ease-in-out`}>
            {notificationType === 'success' ? 
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <BsCheckCircle className="w-6 h-6 text-emerald-400" />
              </div> : 
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center">
                <BsXCircle className="w-6 h-6 text-rose-400" />
              </div>
            }
            <div className="flex-1">
              <h3 className={`font-medium ${notificationType === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {notificationType === 'success' ? 'Success' : 'Error'}
              </h3>
              <p className="text-gray-300 text-sm mt-1">{notificationMessage}</p>
            </div>
            <button 
              onClick={() => setShowNotification(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="bg-[#1E2028] rounded-xl p-6 border border-gray-800 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              Create New Goal
              <span className="bg-indigo-500/10 p-1 rounded text-indigo-400 text-sm font-normal">
                Admin Portal
              </span>
            </h1>
            <p className="text-gray-400 mt-1">Create and assign goals to employees and managers</p>
          </div>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <BsPlus className="w-5 h-5" />
            Quick Create
          </button>
        </div>
      </div>

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
            <div className="p-3 rounded-lg bg-purple-500/10">
              <BsStars className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Managers</p>
              <h3 className="text-2xl font-bold text-white">{stats.totalManagers}</h3>
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
      </div>

      <div className="bg-[#1E2028] rounded-xl p-6 border border-gray-800 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Goal Management
              <span className="bg-blue-500/10 p-1 rounded text-blue-400 text-sm font-normal">
                {goals.length} Goals
              </span>
            </h2>
            <p className="text-gray-400 mt-1">Manage and track all assigned goals</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
            <Card key={goal.id} className="hover:shadow-lg transition-shadow bg-[#1E2028] border-gray-800 relative group">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
              <CardHeader className="relative">
                <CardTitle className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-2">
                    {goal.category === 'PROFESSIONAL' && <BsRocket className="h-5 w-5 text-blue-400" />}
                    {goal.category === 'TECHNICAL' && <BsLightbulb className="h-5 w-5 text-amber-400" />}
                    {goal.category === 'LEADERSHIP' && <BsAward className="h-5 w-5 text-purple-400" />}
                    {goal.category === 'PERSONAL' && <BsGraphUp className="h-5 w-5 text-emerald-400" />}
                    {goal.category === 'TRAINING' && <BsBriefcase className="h-5 w-5 text-rose-400" />}
                    <span className="font-semibold">{goal.title}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleView(goal);
                      }}
                      className="hover:bg-gray-800/50 text-gray-400 hover:text-white"
                    >
                      <BsEye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(goal);
                      }}
                      className="hover:bg-gray-800/50 text-gray-400 hover:text-white"
                    >
                      <BsPencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(goal.id);
                      }}
                      className="hover:bg-red-900/30 text-gray-400 hover:text-red-400"
                    >
                      <BsTrash className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription className="mt-3">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className="border-gray-700 text-gray-300 bg-gray-800/50"
                    >
                      {goal.category}
                    </Badge>
                    <Badge 
                      variant={getStatusBadge(goal.status)} 
                      className={`text-xs ${
                        goal.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-400' :
                        goal.status === 'COMPLETED' ? 'bg-green-500/10 text-green-400' :
                        goal.status === 'APPROVED' ? 'bg-blue-500/10 text-blue-400' :
                        goal.status === 'REJECTED' ? 'bg-red-500/10 text-red-400' :
                        'bg-gray-500/10 text-gray-400'
                      }`}
                    >
                      {goal.status}
                    </Badge>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-300 line-clamp-2 mb-4">{goal.description}</p>
                <div className="space-y-2 bg-gray-900/30 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <User className="h-4 w-4 text-gray-400" />
                    <span>Assigned to: <span className="text-white">{goal.employee?.name}</span></span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>Due: <span className="text-white">{new Date(goal.dueDate).toLocaleDateString()}</span></span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-[#1a1c23] rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Create New Goal</h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                  Goal Title
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <BsListTask className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 bg-[#2d2f36] text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter goal title"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-[#2d2f36] text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Describe your goal in detail"
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">
                    Category
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <BsTag className="text-gray-400" />
                    </div>
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 bg-[#2d2f36] text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    >
                      {CATEGORIES.map(category => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="dueDate" className="block text-sm font-medium text-gray-300 mb-2">
                    Due Date
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <BsCalendar className="text-gray-400" />
                    </div>
                    <input
                      type="date"
                      id="dueDate"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 bg-[#2d2f36] text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Assign to
                </label>
                <Tabs defaultValue="employees" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="employees">Employees</TabsTrigger>
                    <TabsTrigger value="managers">Managers</TabsTrigger>
                  </TabsList>
                  <TabsContent value="employees">
                    <Select
                      value={formData.employeeId}
                      onValueChange={(value) => setFormData({ ...formData, employeeId: value })}
                    >
                      <SelectTrigger className="w-full bg-[#2d2f36] text-white border-gray-700">
                        <SelectValue placeholder="Select an employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredUsers('EMPLOYEE').map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TabsContent>
                  <TabsContent value="managers">
                    <Select
                      value={formData.employeeId}
                      onValueChange={(value) => setFormData({ ...formData, employeeId: value })}
                    >
                      <SelectTrigger className="w-full bg-[#2d2f36] text-white border-gray-700">
                        <SelectValue placeholder="Select a manager" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredUsers('MANAGER').map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TabsContent>
                </Tabs>
              </div>

              <div className="flex justify-end space-x-4 pt-6">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2 ${
                    loading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Goal</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isViewModalOpen && viewedGoal && (
        <div className="bg-[#1E2028] rounded-lg p-6 w-full max-w-2xl mx-4 border border-gray-800 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              {viewedGoal.category === 'PROFESSIONAL' && <BsRocket className="h-7 w-7 text-blue-400" />}
              {viewedGoal.category === 'TECHNICAL' && <BsLightbulb className="h-7 w-7 text-amber-400" />}
              {viewedGoal.category === 'LEADERSHIP' && <BsAward className="h-7 w-7 text-purple-400" />}
              {viewedGoal.category === 'PERSONAL' && <BsGraphUp className="h-7 w-7 text-emerald-400" />}
              {viewedGoal.category === 'TRAINING' && <BsBriefcase className="h-7 w-7 text-rose-400" />}
              <h2 className="text-2xl font-bold text-white">{viewedGoal.title}</h2>
            </div>
            <button
              onClick={() => setIsViewModalOpen(false)}
              className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-800 rounded-lg"
            >
              <BsX className="h-6 w-6" />
            </button>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className="border-gray-700 text-gray-300 bg-gray-800/50 text-sm"
              >
                {viewedGoal.category}
              </Badge>
              <Badge 
                variant={getStatusBadge(viewedGoal.status)}
                className={`text-sm ${
                  viewedGoal.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-400' :
                  viewedGoal.status === 'COMPLETED' ? 'bg-green-500/10 text-green-400' :
                  viewedGoal.status === 'APPROVED' ? 'bg-blue-500/10 text-blue-400' :
                  viewedGoal.status === 'REJECTED' ? 'bg-red-500/10 text-red-400' :
                  'bg-gray-500/10 text-gray-400'
                }`}
              >
                {viewedGoal.status}
              </Badge>
            </div>

            <div className="bg-gray-900/30 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <BsListTask className="h-4 w-4 text-gray-400" />
                Description
              </h3>
              <p className="text-gray-100 leading-relaxed">{viewedGoal.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-900/30 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <User className="h-4 w-4 text-gray-400" />
                  <h3 className="text-sm font-medium text-gray-300">Assigned To</h3>
                </div>
                <p className="text-white font-medium">{viewedGoal.employee?.name}</p>
                <p className="text-sm text-gray-400">{viewedGoal.employee?.email}</p>
              </div>
              <div className="bg-gray-900/30 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <h3 className="text-sm font-medium text-gray-300">Due Date</h3>
                </div>
                <p className="text-white font-medium">
                  {new Date(viewedGoal.dueDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setIsViewModalOpen(false);
                  handleEdit(viewedGoal);
                }}
                className="bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                <BsPencil className="h-4 w-4 mr-2" />
                Edit Goal
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setIsViewModalOpen(false);
                  handleDelete(viewedGoal.id);
                }}
                className="bg-red-900/20 text-red-400 hover:bg-red-900/40"
              >
                <BsTrash className="h-4 w-4 mr-2" />
                Delete Goal
              </Button>
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && selectedGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-[#1E2028] rounded-lg p-6 w-full max-w-2xl mx-4 border border-gray-800">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Edit Goal</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <BsX className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                  Goal Title
                </label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter goal title"
                  required
                  className="bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your goal in detail"
                  rows={4}
                  required
                  className="bg-gray-900/50 border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">
                    Category
                  </label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger className="bg-gray-900/50 border-gray-700 text-white">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1E2028] border-gray-700">
                      {CATEGORIES.map(category => (
                        <SelectItem key={category.value} value={category.value} className="text-gray-300">
                          <div className="flex items-center gap-2">
                            {category.value === 'PROFESSIONAL' && <BsRocket className="h-4 w-4 text-blue-400" />}
                            {category.value === 'TECHNICAL' && <BsLightbulb className="h-4 w-4 text-amber-400" />}
                            {category.value === 'LEADERSHIP' && <BsAward className="h-4 w-4 text-purple-400" />}
                            {category.value === 'PERSONAL' && <BsGraphUp className="h-4 w-4 text-emerald-400" />}
                            {category.value === 'TRAINING' && <BsBriefcase className="h-4 w-4 text-rose-400" />}
                            {category.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label htmlFor="dueDate" className="block text-sm font-medium text-gray-300 mb-2">
                    Due Date
                  </label>
                  <Input
                    type="date"
                    id="dueDate"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    required
                    className="bg-gray-900/50 border-gray-700 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Assign to
                </label>
                <Tabs defaultValue="employees" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-gray-900/50">
                    <TabsTrigger value="employees" className="data-[state=active]:bg-gray-800">
                      <BsPeople className="h-4 w-4 mr-2" />
                      Employees
                    </TabsTrigger>
                    <TabsTrigger value="managers" className="data-[state=active]:bg-gray-800">
                      <BsStars className="h-4 w-4 mr-2" />
                      Managers
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="employees">
                    <Select
                      value={formData.employeeId}
                      onValueChange={(value) => setFormData({ ...formData, employeeId: value })}
                    >
                      <SelectTrigger className="bg-gray-900/50 border-gray-700 text-white">
                        <SelectValue placeholder="Select an employee" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1E2028] border-gray-700">
                        {filteredUsers('EMPLOYEE').map((user) => (
                          <SelectItem key={user.id} value={user.id} className="text-gray-300">
                            {user.name} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TabsContent>
                  <TabsContent value="managers">
                    <Select
                      value={formData.employeeId}
                      onValueChange={(value) => setFormData({ ...formData, employeeId: value })}
                    >
                      <SelectTrigger className="bg-gray-900/50 border-gray-700 text-white">
                        <SelectValue placeholder="Select a manager" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1E2028] border-gray-700">
                        {filteredUsers('MANAGER').map((user) => (
                          <SelectItem key={user.id} value={user.id} className="text-gray-300">
                            {user.name} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TabsContent>
                </Tabs>
              </div>

              <div className="flex justify-end space-x-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={loading}
                  className="bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-indigo-600 text-white hover:bg-indigo-700 flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <BsCheckCircle className="h-4 w-4 mr-2" />
                      <span>Update Goal</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminGoalSettingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardLayout type="admin">
        <AdminGoalSettingPageContent />
      </DashboardLayout>
    </Suspense>
  );
} 
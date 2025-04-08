'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
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
  BsBriefcase
} from 'react-icons/bs';

interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  dueDate: string;
  status: string;
  createdAt: string;
  managerComments?: string;
}

const CATEGORIES = [
  { value: 'PROFESSIONAL', label: 'Professional Development' },
  { value: 'TECHNICAL', label: 'Technical Skills' },
  { value: 'LEADERSHIP', label: 'Leadership' },
  { value: 'PERSONAL', label: 'Personal Growth' },
  { value: 'TRAINING', label: 'Training' }
];

const STATUSES = [
  { value: 'all', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' }
];

const GOAL_TEMPLATES = [
  {
    id: 'project-completion',
    title: 'Project Milestone',
    category: 'PROFESSIONAL',
    icon: <BsRocket className="w-6 h-6 text-blue-400" />,
    description: 'Complete [Project Name] milestone by [Date] achieving [Specific Metrics]',
    subtitle: 'Project Excellence',
    bgGradient: 'from-blue-500/10 to-transparent'
  },
  {
    id: 'skill-mastery',
    title: 'Skill Mastery',
    category: 'TECHNICAL',
    icon: <BsLightbulb className="w-6 h-6 text-amber-400" />,
    description: 'Master [Technology/Skill] through [Training/Project] by [Date]',
    subtitle: 'Technical Growth',
    bgGradient: 'from-amber-500/10 to-transparent'
  },
  {
    id: 'leadership-initiative',
    title: 'Leadership Initiative',
    category: 'LEADERSHIP',
    icon: <BsAward className="w-6 h-6 text-purple-400" />,
    description: 'Lead [Team/Project] to achieve [Specific Outcome] by [Date]',
    subtitle: 'Leadership Development',
    bgGradient: 'from-purple-500/10 to-transparent'
  },
  {
    id: 'career-growth',
    title: 'Career Development',
    category: 'PERSONAL',
    icon: <BsGraphUp className="w-6 h-6 text-emerald-400" />,
    description: 'Achieve [Career Milestone] through [Actions] by [Date]',
    subtitle: 'Professional Growth',
    bgGradient: 'from-emerald-500/10 to-transparent'
  },
  {
    id: 'innovation-project',
    title: 'Innovation Project',
    category: 'PROFESSIONAL',
    icon: <BsStars className="w-6 h-6 text-indigo-400" />,
    description: 'Develop innovative solution for [Problem] achieving [Metrics]',
    subtitle: 'Innovation & Creativity',
    bgGradient: 'from-indigo-500/10 to-transparent'
  },
  {
    id: 'certification-goal',
    title: 'Certification Goal',
    category: 'TRAINING',
    icon: <BsBriefcase className="w-6 h-6 text-rose-400" />,
    description: 'Obtain [Certification Name] certification by [Date]',
    subtitle: 'Professional Certification',
    bgGradient: 'from-rose-500/10 to-transparent'
  }
];

export default function GoalsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');
  const [isTimelineView, setIsTimelineView] = useState(searchParams?.get('view') === 'timeline');
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    category: 'PROFESSIONAL',
    dueDate: ''
  });
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const response = await fetch('/api/goals');
      if (response.ok) {
        const data = await response.json();
        setGoals(data);
      }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newGoal)
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
        dueDate: ''
      });
    } catch (error) {
      console.error('Error creating goal:', error);
      showNotificationWithTimeout('Failed to create goal. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredGoals = goals.filter(goal => {
    const matchesSearch = goal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         goal.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || goal.status === selectedStatus;
    const matchesCategory = selectedCategory === 'all' || goal.category === selectedCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'text-green-500';
      case 'PENDING': return 'text-yellow-500';
      case 'REJECTED': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED': return <BsCheckCircle className="w-5 h-5" />;
      case 'PENDING': return <BsClock className="w-5 h-5" />;
      case 'REJECTED': return <BsXCircle className="w-5 h-5" />;
      default: return null;
    }
  };

  const handleGoalClick = (goal: Goal) => {
    setSelectedGoal(goal);
    setShowDetailsModal(true);
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-500';
      case 'PENDING': return 'bg-yellow-500';
      case 'REJECTED': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <DashboardLayout type="employee">
      <div className="space-y-6">
        {/* Notification Toast */}
        {showNotification && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center gap-2 ${
            notificationType === 'success' ? 'bg-emerald-500' : 'bg-rose-500'
          } text-white`}>
            {notificationType === 'success' ? 
              <BsCheckCircle className="w-5 h-5" /> : 
              <BsXCircle className="w-5 h-5" />
            }
            {notificationMessage}
          </div>
        )}

        {/* Header Section */}
        <div className="bg-[#1E2028] rounded-xl p-6 border border-gray-800 shadow-lg">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => router.back()}
              className="bg-[#252832] p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#2d2f36] transition-colors"
            >
              <BsArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                Create New Goal
                <span className="bg-indigo-500/10 p-1 rounded text-indigo-400 text-sm font-normal">
                  Employee Portal
                </span>
              </h1>
              <p className="text-gray-400 mt-1">Define your performance goals and track your progress</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="bg-[#252832] rounded-lg p-4 border border-gray-800 hover:border-indigo-500/50 transition-all group cursor-pointer"
                 onClick={() => setIsCreateModalOpen(true)}>
              <div className="flex items-center gap-3">
                <div className="bg-indigo-500/10 p-2 rounded-lg group-hover:scale-110 transition-transform">
                  <BsLightningCharge className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-white font-medium">Quick Create</h3>
                  <p className="text-sm text-gray-400">Start from scratch</p>
                </div>
              </div>
            </div>

            <div className="bg-[#252832] rounded-lg p-4 border border-gray-800 hover:border-purple-500/50 transition-all group cursor-pointer"
                 onClick={() => setIsTimelineView(!isTimelineView)}>
              <div className="flex items-center gap-3">
                <div className="bg-purple-500/10 p-2 rounded-lg group-hover:scale-110 transition-transform">
                  <BsBarChartLine className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-white font-medium">Timeline View</h3>
                  <p className="text-sm text-gray-400">Visualize your goals</p>
                </div>
              </div>
            </div>

            <div className="bg-[#252832] rounded-lg p-4 border border-gray-800 hover:border-emerald-500/50 transition-all group cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500/10 p-2 rounded-lg group-hover:scale-110 transition-transform">
                  <BsBook className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-white font-medium">Goal Guide</h3>
                  <p className="text-sm text-gray-400">Learn best practices</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Templates Section - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#1E2028] rounded-xl p-6 border border-gray-800">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-500/10 p-2 rounded-lg">
                    <BsLightbulb className="w-5 h-5 text-amber-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">Goal Templates</h2>
                </div>
                <button className="text-gray-400 hover:text-white transition-colors">
                  <BsThreeDotsVertical className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {GOAL_TEMPLATES.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => {
                      setNewGoal({
                        ...newGoal,
                        title: template.title,
                        description: template.description,
                        category: template.category
                      });
                      setIsCreateModalOpen(true);
                    }}
                    className={`group bg-gradient-to-br ${template.bgGradient} bg-[#252832] hover:bg-[#2d2f36] border border-gray-800 hover:border-indigo-500 rounded-lg p-4 cursor-pointer transition-all duration-200`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-lg bg-[#1E2028] border border-gray-700 group-hover:border-gray-600 transition-colors">
                        {template.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-medium group-hover:text-indigo-400 transition-colors flex items-center gap-2">
                          {template.title}
                          <BsArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </h4>
                        <p className="text-sm text-gray-400 mt-1">{template.subtitle}</p>
                        <p className="text-xs text-gray-500 mt-2 line-clamp-2">{template.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Goals Section */}
            <div className="bg-[#1E2028] rounded-xl p-6 border border-gray-800">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-500/10 p-2 rounded-lg">
                    <BsClock className="w-5 h-5 text-purple-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">Recent Goals</h2>
                </div>
              </div>

              {goals.length > 0 ? (
                <div className="space-y-4">
                  {goals.slice(0, 3).map((goal) => (
                    <div
                      key={goal.id}
                      className="bg-[#252832] rounded-lg p-4 border border-gray-800 hover:border-indigo-500/50 transition-all group cursor-pointer"
                      onClick={() => handleGoalClick(goal)}
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-white font-medium group-hover:text-indigo-400 transition-colors">
                          {goal.title}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(goal.status)} bg-opacity-20`}>
                          {goal.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mt-2 line-clamp-2">{goal.description}</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <BsCalendar className="w-4 h-4" />
                          <span>{formatDate(goal.dueDate)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BsTag className="w-4 h-4" />
                          <span>{goal.category}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#252832] mb-4">
                    <BsListTask className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">No goals yet</h3>
                  <p className="text-gray-400">Create your first goal to get started</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Stats and Tips */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-[#1E2028] rounded-xl p-6 border border-gray-800">
              <h3 className="text-lg font-semibold text-white mb-4">Goal Statistics</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-[#252832] rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-500/10 p-2 rounded-lg">
                      <BsCheckCircle className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="text-gray-400">Completed</span>
                  </div>
                  <span className="text-white font-medium">{goals.filter(g => g.status === 'APPROVED').length}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#252832] rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="bg-amber-500/10 p-2 rounded-lg">
                      <BsClock className="w-4 h-4 text-amber-400" />
                    </div>
                    <span className="text-gray-400">In Progress</span>
                  </div>
                  <span className="text-white font-medium">{goals.filter(g => g.status === 'PENDING').length}</span>
                </div>
              </div>
            </div>

            {/* Tips Section */}
            <div className="bg-[#1E2028] rounded-xl p-6 border border-gray-800">
              <h3 className="text-lg font-semibold text-white mb-4">Goal Setting Tips</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-500/10 p-2 rounded-lg">
                    <BsLightbulb className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Be Specific</h4>
                    <p className="text-sm text-gray-400">Define clear, measurable objectives</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-purple-500/10 p-2 rounded-lg">
                    <BsCalendar className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Set Deadlines</h4>
                    <p className="text-sm text-gray-400">Include realistic timeframes</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-emerald-500/10 p-2 rounded-lg">
                    <BsGraphUp className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Track Progress</h4>
                    <p className="text-sm text-gray-400">Regularly update your goals</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Goal Details Modal */}
        {showDetailsModal && selectedGoal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-[#1a1c23] rounded-lg p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(selectedGoal.status)} bg-opacity-20`}>
                      {selectedGoal.status}
                    </span>
                    <span className="text-gray-400">
                      Created on {formatDate(selectedGoal.createdAt)}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-white">{selectedGoal.title}</h2>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">Description</h3>
                  <p className="text-gray-400">{selectedGoal.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-white mb-2">Category</h3>
                    <div className="flex items-center gap-2 text-gray-400">
                      <BsTag />
                      <span>{selectedGoal.category}</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white mb-2">Due Date</h3>
                    <div className="flex items-center gap-2 text-gray-400">
                      <BsCalendar />
                      <span>{formatDate(selectedGoal.dueDate)}</span>
                    </div>
                  </div>
                </div>

                {selectedGoal.managerComments && (
                  <div>
                    <h3 className="text-lg font-medium text-white mb-2">Manager Comments</h3>
                    <div className="bg-[#2d2f36] rounded-lg p-4 text-gray-300">
                      {selectedGoal.managerComments}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-medium text-white mb-2">Progress</h3>
                  <div className="w-full h-2 bg-gray-700 rounded-full">
                    <div 
                      className={`h-full rounded-full ${getProgressColor(selectedGoal.status)}`}
                      style={{ 
                        width: selectedGoal.status === 'APPROVED' ? '100%' : 
                               selectedGoal.status === 'PENDING' ? '50%' : '0%' 
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-sm text-gray-400">
                    <span>Start</span>
                    <span>In Progress</span>
                    <span>Completed</span>
                  </div>
                </div>

                <div className="flex justify-end pt-6">
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Goal Modal */}
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

              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1c23] to-transparent h-8 -top-8"></div>
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
                        value={newGoal.title}
                        onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
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
                      value={newGoal.description}
                      onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
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
                          value={newGoal.category}
                          onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })}
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
                          value={newGoal.dueDate}
                          onChange={(e) => setNewGoal({ ...newGoal, dueDate: e.target.value })}
                          className="w-full pl-10 pr-4 py-2 bg-[#2d2f36] text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4 pt-6">
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(false)}
                      className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
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
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 
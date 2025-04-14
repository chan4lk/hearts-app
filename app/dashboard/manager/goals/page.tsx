'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import {
  BsStarFill,
  BsCheckCircle,
  BsClipboardData,
  BsBarChart,
  BsCalendar,
  BsFilter,
  BsGrid,
  BsList,
  BsStar,
  BsPlus,
  BsListTask,
  BsTag,
  BsRocket,
  BsLightbulb,
  BsAward,
  BsGraphUp,
  BsStars,
  BsBriefcase,
  BsClock,
  BsXCircle
} from 'react-icons/bs';

interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  dueDate: string;
  status: string;
  createdAt: string;
  rating?: {
    id: string;
    score: number;
    comments: string;
    updatedAt?: Date;
  };
}

const CATEGORIES = [
  { value: 'PROFESSIONAL', label: 'Professional Development' },
  { value: 'TECHNICAL', label: 'Technical Skills' },
  { value: 'LEADERSHIP', label: 'Leadership' },
  { value: 'PERSONAL', label: 'Personal Growth' },
  { value: 'TRAINING', label: 'Training' }
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

const RATING_COLORS = {
  1: 'bg-red-500/20 text-red-400',
  2: 'bg-orange-500/20 text-orange-400',
  3: 'bg-yellow-500/20 text-yellow-400',
  4: 'bg-green-500/20 text-green-400',
  5: 'bg-blue-500/20 text-blue-400'
};

const RATING_LABELS = {
  1: 'Needs Improvement',
  2: 'Below Expectations',
  3: 'Meets Expectations',
  4: 'Exceeds Expectations',
  5: 'Outstanding'
};

export default function ManagerGoalsPage() {
  const { data: session } = useSession();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGoal, setNewGoal] = useState({
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
      setLoading(true);
      const response = await fetch('/api/goals');
      if (!response.ok) throw new Error('Failed to fetch goals');
      const data = await response.json();
      setGoals(data.goals || []);
    } catch (error) {
      console.error('Error fetching goals:', error);
      toast.error('Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGoal)
      });

      if (!response.ok) throw new Error('Failed to create goal');

      const createdGoal = await response.json();
      setGoals([createdGoal, ...goals]);
      setShowCreateModal(false);
      setNewGoal({
        title: '',
        description: '',
        category: 'PROFESSIONAL',
        dueDate: new Date().toISOString().split('T')[0]
      });
      toast.success('Goal created successfully');
    } catch (error) {
      console.error('Error creating goal:', error);
      toast.error('Failed to create goal');
    }
  };

  const handleSelfRating = async (goalId: string, score: number) => {
    try {
      const response = await fetch(`/api/goals/${goalId}/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score })
      });

      if (!response.ok) throw new Error('Failed to submit rating');

      const updatedGoal = await response.json();
      setGoals(goals.map(goal => 
        goal.id === goalId 
          ? { ...goal, rating: updatedGoal }
          : goal
      ));
      toast.success('Rating submitted successfully');
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error('Failed to submit rating');
    }
  };

  return (
    <DashboardLayout type="manager">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="bg-[#1E2028] rounded-xl p-6 border border-gray-800 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                Manager Goals
                <span className="bg-indigo-500/10 p-1 rounded text-indigo-400 text-sm font-normal">
                  Manager Portal
                </span>
              </h1>
              <p className="text-gray-400 mt-1">Create and manage your performance goals</p>
            </div>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <BsPlus className="w-5 h-5" />
              Quick Create
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Templates Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#1E2028] rounded-xl p-6 border border-gray-800">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-500/10 p-2 rounded-lg">
                    <BsLightbulb className="w-5 h-5 text-amber-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">Goal Templates</h2>
                </div>
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
                      setShowCreateModal(true);
                    }}
                    className={`group bg-gradient-to-br ${template.bgGradient} bg-[#252832] hover:bg-[#2d2f36] border border-gray-800 hover:border-indigo-500 rounded-lg p-4 cursor-pointer transition-all duration-200`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-white/5">
                        {template.icon}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white group-hover:text-indigo-400 transition-colors">
                          {template.title}
                        </h3>
                        <p className="text-sm text-gray-400 mt-1">{template.description}</p>
                        <span className="text-xs text-indigo-400 mt-2 block">{template.subtitle}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Goals List */}
          <div className="space-y-6">
            <div className="bg-[#1E2028] rounded-xl p-6 border border-gray-800">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-500/10 p-2 rounded-lg">
                    <BsListTask className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-white">Your Goals</h2>
                </div>
              </div>

              <div className="space-y-4">
                {goals.map((goal) => (
                  <Card key={goal.id} className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700">
                    <CardHeader className="p-6 pb-3">
                      <div className="flex items-start justify-between mb-4">
                        <div className="space-y-1">
                          <h4 className="text-lg font-semibold text-white">{goal.title}</h4>
                          <p className="text-sm text-gray-400">{goal.description}</p>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <BsCalendar className="w-4 h-4" />
                          <span className="text-sm">
                            {new Date(goal.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 pt-3">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium text-gray-300">Self Rating</Label>
                          {goal.rating?.score && (
                            <span className={`text-sm font-medium px-3 py-1 rounded-full ${RATING_COLORS[goal.rating.score as keyof typeof RATING_COLORS]}`}>
                              {RATING_LABELS[goal.rating.score as keyof typeof RATING_LABELS]}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <Button
                              key={rating}
                              variant="outline"
                              size="icon"
                              onClick={() => handleSelfRating(goal.id, rating)}
                              className={`w-12 h-12 ${
                                goal.rating?.score === rating
                                  ? RATING_COLORS[rating as keyof typeof RATING_COLORS]
                                  : 'bg-gray-800/50 text-gray-400 border-gray-700 hover:bg-gray-700/50'
                              }`}
                            >
                              <div className="flex flex-col items-center">
                                <span className="text-xs mb-0.5">{rating}</span>
                                <BsStarFill className="w-4 h-4" />
                              </div>
                            </Button>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Create Goal Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-[#1a1c23] rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Create New Goal</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1c23] to-transparent h-8 -top-8"></div>
                <form onSubmit={handleCreateGoal} className="space-y-6">
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
                      onClick={() => setShowCreateModal(false)}
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
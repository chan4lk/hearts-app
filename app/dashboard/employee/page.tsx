'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { BsSearch, BsListUl, BsCalendar, BsFlag, BsX, BsCheckCircle, BsXCircle, BsClock } from 'react-icons/bs';

interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  dueDate: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  feedback?: string;
  progress: number;
  submittedDate?: string;
  employeeName: string;
  employeeEmail: string;
}

export default function EmployeeDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    category: '',
    dueDate: '',
  });

  // Load goals from localStorage on component mount
  useEffect(() => {
    const loadGoals = () => {
      try {
        const savedGoals = localStorage.getItem('employee_goals');
        if (savedGoals) {
          const parsedGoals = JSON.parse(savedGoals);
          // Filter goals for the current employee (in a real app, this would use actual user data)
          const currentUserEmail = 'current.user@example.com'; // This would come from auth
          setGoals(parsedGoals.filter((goal: Goal) => goal.employeeEmail === currentUserEmail));
        }
      } catch (error) {
        console.error('Error loading goals:', error);
      } finally {
        setLoading(false);
      }
    };

    loadGoals();
  }, []);

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real app, these would come from the authenticated user's profile
    const employeeName = 'Current User';
    const employeeEmail = 'current.user@example.com';

    const goal: Goal = {
      id: Math.random().toString(36).substr(2, 9),
      ...newGoal,
      status: 'draft',
      progress: 0,
      employeeName,
      employeeEmail,
    };

    // Update state
    const updatedGoals = [goal, ...goals];
    setGoals(updatedGoals);

    // Save to localStorage
    try {
      const existingGoals = localStorage.getItem('employee_goals');
      const allGoals = existingGoals ? JSON.parse(existingGoals) : [];
      const filteredGoals = allGoals.filter((g: Goal) => g.employeeEmail !== employeeEmail);
      localStorage.setItem('employee_goals', JSON.stringify([...filteredGoals, ...updatedGoals]));
    } catch (error) {
      console.error('Error saving goal:', error);
    }

    setNewGoal({ title: '', description: '', category: '', dueDate: '' });
    setIsModalOpen(false);
  };

  const handleSubmitForApproval = (goalId: string) => {
    const updatedGoals = goals.map(goal => 
      goal.id === goalId ? { 
        ...goal, 
        status: 'pending' as const,
        submittedDate: new Date().toISOString()
      } : goal
    );

    // Update state
    setGoals(updatedGoals);

    // Update localStorage
    try {
      const existingGoals = localStorage.getItem('employee_goals');
      const allGoals = existingGoals ? JSON.parse(existingGoals) : [];
      const filteredGoals = allGoals.filter((g: Goal) => g.employeeEmail !== updatedGoals[0].employeeEmail);
      localStorage.setItem('employee_goals', JSON.stringify([...filteredGoals, ...updatedGoals]));
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  const filteredGoals = goals.filter(goal => {
    const matchesSearch = goal.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <DashboardLayout type="employee">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Loading goals...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type="employee">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">Goal Setting</h2>
            <p className="text-gray-400">Set and track your performance goals</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setViewMode('list')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'list' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-[#2d2f36] text-gray-400 hover:text-white'
              }`}
            >
              <BsListUl className="text-xl" />
              <span className="hidden sm:inline">Timeline View</span>
            </button>
            
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span>+ New Goal</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <BsSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search goals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#2d2f36] text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <select className="px-4 py-2 bg-[#2d2f36] text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="pending">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          
          <select className="px-4 py-2 bg-[#2d2f36] text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Categories</option>
            <option value="professional">Professional</option>
            <option value="personal">Personal</option>
            <option value="technical">Technical</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.length > 0 ? (
            goals.map((goal) => (
              <div key={goal.id} className="bg-[#1a1c23] rounded-lg p-6 hover:bg-[#2d2f36] transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-medium text-white">{goal.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    goal.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                    goal.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                    goal.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
                  </span>
                </div>
                <p className="text-gray-400 text-sm mb-4">{goal.description}</p>
                <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                  <div className="flex items-center space-x-2">
                    <BsCalendar />
                    <span>{new Date(goal.dueDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <BsFlag />
                    <span>{goal.category}</span>
                  </div>
                </div>

                {goal.feedback && (
                  <div className="mb-4 p-3 bg-[#2d2f36] rounded-lg">
                    <p className="text-sm text-gray-400">
                      <strong>Feedback:</strong> {goal.feedback}
                    </p>
                  </div>
                )}

                <div className="mb-4">
                  <div className="w-full bg-[#2d2f36] rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                </div>

                {goal.status === 'draft' && (
                  <button
                    onClick={() => handleSubmitForApproval(goal.id)}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <span>Submit for Approval</span>
                  </button>
                )}

                {goal.status === 'pending' && (
                  <div className="flex items-center justify-center px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg">
                    <BsClock className="mr-2" />
                    <span>Waiting for approval</span>
                  </div>
                )}

                {goal.status === 'approved' && (
                  <div className="flex items-center justify-center px-4 py-2 bg-green-500/20 text-green-400 rounded-lg">
                    <BsCheckCircle className="mr-2" />
                    <span>Goal Approved</span>
                  </div>
                )}

                {goal.status === 'rejected' && (
                  <div className="flex items-center justify-center px-4 py-2 bg-red-500/20 text-red-400 rounded-lg">
                    <BsXCircle className="mr-2" />
                    <span>Goal Rejected</span>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="col-span-full bg-[#1a1c23] rounded-lg p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#2d2f36] mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-white mb-2">No goals found</h3>
              <p className="text-gray-400 mb-6">
                You haven't created any goals yet. Click the 'New Goal' button to get started.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create your first goal
              </button>
            </div>
          )}
        </div>

        {/* New Goal Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#1a1c23] rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Create New Goal</h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <BsX className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleCreateGoal} className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                    Goal Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={newGoal.title}
                    onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                    className="w-full px-4 py-2 bg-[#2d2f36] text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={newGoal.description}
                    onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
                    className="w-full px-4 py-2 bg-[#2d2f36] text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    id="category"
                    value={newGoal.category}
                    onChange={(e) => setNewGoal({...newGoal, category: e.target.value})}
                    className="w-full px-4 py-2 bg-[#2d2f36] text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a category</option>
                    <option value="professional">Professional</option>
                    <option value="personal">Personal</option>
                    <option value="technical">Technical</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="dueDate" className="block text-sm font-medium text-gray-300 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    id="dueDate"
                    value={newGoal.dueDate}
                    onChange={(e) => setNewGoal({...newGoal, dueDate: e.target.value})}
                    className="w-full px-4 py-2 bg-[#2d2f36] text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-gray-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Create Goal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
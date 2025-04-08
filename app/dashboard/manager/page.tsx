'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { 
  BsSearch, 
  BsCheckCircle, 
  BsXCircle, 
  BsClock, 
  BsPerson, 
  BsCalendar,
  BsFilter,
  BsLightningCharge,
  BsArrowRight,
  BsChat,
  BsShield,
  BsStars
} from 'react-icons/bs';

interface Goal {
  id: string;
  employeeName: string;
  employeeEmail: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedDate: string;
  feedback?: string;
}

const STATUS_STYLES = {
  APPROVED: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    icon: <BsShield className="w-4 h-4" />,
    gradient: 'from-emerald-500/10'
  },
  PENDING: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    icon: <BsClock className="w-4 h-4" />,
    gradient: 'from-amber-500/10'
  },
  REJECTED: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    icon: <BsXCircle className="w-4 h-4" />,
    gradient: 'from-rose-500/10'
  }
};

export default function ManagerDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);

  // Load goals from the database
  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const response = await fetch('/api/goals');
        if (!response.ok) {
          throw new Error('Failed to fetch goals');
        }
        const data = await response.json();
        console.log('Fetched goals:', data); // Debug log
        setGoals(data);
      } catch (error) {
        console.error('Error fetching goals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGoals();
  }, []);

  const handleApprove = async (goalId: string) => {
    try {
      const response = await fetch(`/api/goals/${goalId}/approve`, {
        method: 'PUT'
      });

      if (!response.ok) {
        throw new Error('Failed to approve goal');
      }

      const updatedGoal = await response.json();
      setGoals(goals.map(goal => 
        goal.id === goalId ? updatedGoal : goal
      ));
    } catch (error) {
      console.error('Error approving goal:', error);
    }
  };

  const handleReject = (goalId: string) => {
    setSelectedGoal(goalId);
    setShowFeedbackModal(true);
  };

  const submitRejection = async () => {
    if (!selectedGoal) return;

    try {
      const response = await fetch(`/api/goals/${selectedGoal}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ feedback })
      });

      if (!response.ok) {
        throw new Error('Failed to reject goal');
      }

      const updatedGoal = await response.json();
      setGoals(goals.map(goal => 
        goal.id === selectedGoal ? updatedGoal : goal
      ));

      setFeedback('');
      setSelectedGoal(null);
      setShowFeedbackModal(false);
    } catch (error) {
      console.error('Error rejecting goal:', error);
    }
  };

  const filteredGoals = goals.filter(goal => {
    const matchesSearch = goal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      goal.employeeName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !selectedStatus || goal.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <DashboardLayout type="manager">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Loading goals...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type="manager">
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-[#1E2028] p-6 rounded-xl shadow-lg">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <BsStars className="w-8 h-8 text-indigo-400" />
              Employee Goals
            </h1>
            <p className="text-gray-400 mt-1">Review and manage employee goals</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <BsSearch className="text-gray-400 group-hover:text-indigo-400 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search by goal title or employee name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#1E2028] text-white rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all hover:bg-[#252832] hover:border-gray-600"
              />
            </div>
          </div>
          
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <BsFilter className="text-gray-400 group-hover:text-indigo-400 transition-colors" />
            </div>
            <select 
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="pl-10 pr-4 py-3 bg-[#1E2028] text-white rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:bg-[#252832] hover:border-gray-600 transition-all appearance-none cursor-pointer min-w-[180px]"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredGoals.length > 0 ? (
            filteredGoals.map((goal) => (
              <div 
                key={goal.id} 
                className={`bg-gradient-to-br ${STATUS_STYLES[goal.status].gradient} bg-[#1E2028] rounded-xl p-6 hover:shadow-xl transition-all duration-300 border border-gray-800 hover:border-gray-700 group`}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-medium text-white group-hover:text-indigo-400 transition-colors flex items-center gap-2">
                    <BsLightningCharge className="w-5 h-5 text-indigo-400" />
                    {goal.title}
                  </h3>
                  <span className={`px-3 py-1.5 rounded-full text-xs flex items-center gap-2 ${STATUS_STYLES[goal.status].bg} ${STATUS_STYLES[goal.status].text}`}>
                    {STATUS_STYLES[goal.status].icon}
                    {goal.status.charAt(0) + goal.status.slice(1).toLowerCase()}
                  </span>
                </div>

                <div className="flex items-center space-x-2 mb-4 text-gray-300">
                  <div className="bg-[#252832] p-1.5 rounded-lg">
                    <BsPerson className="w-4 h-4" />
                  </div>
                  <span className="group-hover:text-indigo-400 transition-colors">{goal.employeeName}</span>
                </div>

                <p className="text-gray-400 text-sm mb-4 line-clamp-2 group-hover:text-gray-300 transition-colors">{goal.description}</p>

                <div className="flex items-center justify-between text-sm text-gray-400 mb-6">
                  <div className="flex items-center space-x-2 bg-[#252832] px-3 py-1.5 rounded-lg">
                    <BsCalendar className="w-4 h-4" />
                    <span>Due: {new Date(goal.dueDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-[#252832] px-3 py-1.5 rounded-lg">
                    <BsClock className="w-4 h-4" />
                    <span>Submitted: {new Date(goal.submittedDate).toLocaleDateString()}</span>
                  </div>
                </div>

                {goal.status === 'PENDING' && (
                  <div className="flex space-x-4">
                    <button
                      onClick={() => handleApprove(goal.id)}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-all duration-300 group"
                    >
                      <BsCheckCircle className="w-5 h-5 transform group-hover:scale-110 transition-transform" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleReject(goal.id)}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-500 transition-all duration-300 group"
                    >
                      <BsXCircle className="w-5 h-5 transform group-hover:scale-110 transition-transform" />
                      <span>Reject</span>
                    </button>
                  </div>
                )}

                {goal.feedback && (
                  <div className="mt-4 p-4 bg-[#252832] rounded-lg border border-gray-700">
                    <div className="flex items-center gap-2 text-gray-300 mb-2">
                      <BsChat className="w-4 h-4" />
                      <span className="font-medium">Feedback</span>
                    </div>
                    <p className="text-sm text-gray-400">
                      {goal.feedback}
                    </p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="col-span-full bg-[#1E2028] rounded-xl p-12 text-center border border-gray-800">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#252832] mb-4 border border-gray-700">
                <BsCheckCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">No goals found</h3>
              <p className="text-gray-400">
                {selectedStatus 
                  ? `No goals with status "${selectedStatus.toLowerCase()}" found.`
                  : 'There are no employee goals to review at this time.'}
              </p>
            </div>
          )}
        </div>

        {/* Feedback Modal */}
        {showFeedbackModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-[#1E2028] rounded-xl p-6 w-full max-w-md mx-4 border border-gray-800 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                <BsChat className="w-6 h-6 text-rose-400" />
                Provide Feedback
              </h3>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Enter feedback for rejection..."
                className="w-full px-4 py-3 bg-[#252832] text-white rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-rose-500 mb-4 placeholder-gray-500"
                rows={4}
                required
              />
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowFeedbackModal(false);
                    setSelectedGoal(null);
                    setFeedback('');
                  }}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                >
                  Cancel
                </button>
                <button
                  onClick={submitRejection}
                  className="px-6 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-500 transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!feedback.trim()}
                >
                  Submit
                  <BsArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { BsSearch, BsCheckCircle, BsXCircle, BsClock, BsPerson, BsCalendar } from 'react-icons/bs';

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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Employee Goals</h1>
            <p className="text-gray-400">Review and manage employee goals</p>
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
                placeholder="Search by goal title or employee name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#2d2f36] text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <select 
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 bg-[#2d2f36] text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredGoals.length > 0 ? (
            filteredGoals.map((goal) => (
              <div key={goal.id} className="bg-[#1a1c23] rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-medium text-white">{goal.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    goal.status === 'APPROVED' ? 'bg-green-500/20 text-green-400' :
                    goal.status === 'REJECTED' ? 'bg-red-500/20 text-red-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {goal.status.charAt(0) + goal.status.slice(1).toLowerCase()}
                  </span>
                </div>

                <div className="flex items-center space-x-2 mb-4">
                  <BsPerson className="text-gray-400" />
                  <span className="text-gray-400">{goal.employeeName}</span>
                </div>

                <p className="text-gray-400 text-sm mb-4">{goal.description}</p>

                <div className="flex items-center justify-between text-sm text-gray-400 mb-6">
                  <div className="flex items-center space-x-2">
                    <BsCalendar />
                    <span>Due: {new Date(goal.dueDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <BsClock />
                    <span>Submitted: {new Date(goal.submittedDate).toLocaleDateString()}</span>
                  </div>
                </div>

                {goal.status === 'PENDING' && (
                  <div className="flex space-x-4">
                    <button
                      onClick={() => handleApprove(goal.id)}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <BsCheckCircle />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleReject(goal.id)}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <BsXCircle />
                      <span>Reject</span>
                    </button>
                  </div>
                )}

                {goal.feedback && (
                  <div className="mt-4 p-3 bg-[#2d2f36] rounded-lg">
                    <p className="text-sm text-gray-400">
                      <strong>Feedback:</strong> {goal.feedback}
                    </p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="col-span-full bg-[#1a1c23] rounded-lg p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#2d2f36] mb-4">
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
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#1a1c23] rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-xl font-bold text-white mb-4">Provide Feedback</h3>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Enter feedback for rejection..."
                className="w-full px-4 py-2 bg-[#2d2f36] text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
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
                  className="px-4 py-2 text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={submitRejection}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  disabled={!feedback.trim()}
                >
                  Submit Rejection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 
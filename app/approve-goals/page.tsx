'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { toast } from 'react-toastify';

interface Goal {
  id: string;
  title: string;
  description: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'MODIFIED';
  createdAt: string;
  dueDate: string;
  managerComments?: string;
  User_Goal_employeeIdToUser: {
    name: string;
    email: string;
  };
}

export default function ApproveGoalsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!session) {
      router.push('/login');
      return;
    }

    if (session.user?.role !== 'MANAGER') {
      router.push('/dashboard');
      return;
    }

    fetchGoals();
  }, [session, router]);

  const fetchGoals = async () => {
    try {
      const response = await fetch('/api/goals/pending');
      if (!response.ok) throw new Error('Failed to fetch goals');
      const data = await response.json();
      setGoals(data);
    } catch (err) {
      setError('Failed to load goals');
    } finally {
      setIsLoading(false);
    }
  };

  const openActionModal = (goal: Goal, action: 'approve' | 'reject') => {
    setSelectedGoal(goal);
    setComment(goal.managerComments || '');
  };

  const closeActionModal = () => {
    setSelectedGoal(null);
    setComment('');
  };

  const handleApprove = async () => {
    if (!selectedGoal) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/goals/${selectedGoal.id}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ managerComments: comment }),
      });

      if (!response.ok) throw new Error('Failed to approve goal');

      toast.success('Goal approved successfully');
      fetchGoals();
      closeActionModal();
    } catch (err) {
      toast.error('Failed to approve goal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedGoal) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/goals/${selectedGoal.id}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ managerComments: comment }),
      });

      if (!response.ok) throw new Error('Failed to reject goal');

      toast.success('Goal rejected successfully');
      fetchGoals();
      closeActionModal();
    } catch (err) {
      toast.error('Failed to reject goal');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Approve Goals</h1>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {goals.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <p className="text-gray-500">No pending goals to approve.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {goals.map((goal) => (
                <div key={goal.id} className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-xl font-semibold mb-2">{goal.title}</h2>
                  <p className="text-gray-600 mb-4">{goal.description}</p>
                  
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Employee:</span> {goal.User_Goal_employeeIdToUser.name} ({goal.User_Goal_employeeIdToUser.email})
                    </p>
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Due Date:</span> {new Date(goal.dueDate).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Submitted:</span> {new Date(goal.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  
                  {goal.managerComments && (
                    <div className="mb-4 p-3 bg-gray-50 rounded">
                      <p className="text-sm font-medium text-gray-700">Previous Comments:</p>
                      <p className="text-sm text-gray-600">{goal.managerComments}</p>
                    </div>
                  )}
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openActionModal(goal, 'approve')}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => openActionModal(goal, 'reject')}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Action Modal */}
          {selectedGoal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <h2 className="text-xl font-semibold mb-4">
                  {selectedGoal.title}
                </h2>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Comments
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2"
                    rows={4}
                    placeholder="Add your comments here..."
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={closeActionModal}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApprove}
                    className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Approving...' : 'Approve'}
                  </button>
                  <button
                    onClick={handleReject}
                    className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Rejecting...' : 'Reject'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 
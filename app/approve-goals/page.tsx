'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Goal {
  id: string;
  title: string;
  description: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'MODIFIED';
  createdAt: string;
  employee: {
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

  const handleApprove = async (goalId: string) => {
    try {
      const response = await fetch(`/api/goals/${goalId}/approve`, {
        method: 'PUT',
      });

      if (!response.ok) throw new Error('Failed to approve goal');

      fetchGoals();
    } catch (err) {
      setError('Failed to approve goal');
    }
  };

  const handleReject = async (goalId: string) => {
    try {
      const response = await fetch(`/api/goals/${goalId}/reject`, {
        method: 'PUT',
      });

      if (!response.ok) throw new Error('Failed to reject goal');

      fetchGoals();
    } catch (err) {
      setError('Failed to reject goal');
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
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Approve Employee Goals</h2>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <div className="space-y-6">
              {goals.length === 0 ? (
                <p className="text-gray-500">No pending goals to review.</p>
              ) : (
                goals.map((goal) => (
                  <div
                    key={goal.id}
                    className="border rounded-lg p-6 hover:shadow-md transition-shadow duration-300"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{goal.title}</h3>
                        <p className="mt-1 text-sm text-gray-500">{goal.description}</p>
                        <div className="mt-2 text-sm text-gray-500">
                          <p>Employee: {goal.employee.name}</p>
                          <p>Email: {goal.employee.email}</p>
                          <p>Submitted: {new Date(goal.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApprove(goal.id)}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(goal.id)}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Goal {
  id: string;
  title: string;
  description: string;
  status: string;
  dueDate: string;
  comments?: string;
  user?: {
    name: string;
    email: string;
  };
  manager?: {
    name: string;
    email: string;
  };
}

export default function GoalList() {
  const { data: session } = useSession();
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const response = await fetch('/api/goals');
      if (!response.ok) {
        throw new Error('Failed to fetch goals');
      }
      const data = await response.json();
      setGoals(data);
    } catch (error) {
      setError('Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (goalId: string, status: string, comments?: string) => {
    try {
      const response = await fetch('/api/goals', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ goalId, status, comments }),
      });

      if (!response.ok) {
        throw new Error('Failed to update goal');
      }

      await fetchGoals();
      router.refresh();
    } catch (error) {
      setError('Failed to update goal status');
    }
  };

  if (loading) {
    return <div>Loading goals...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'NEEDS_MODIFICATION':
        return 'bg-red-100 text-red-800';
      case 'MODIFIED':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      {goals.map((goal) => (
        <div key={goal.id} className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-semibold">{goal.title}</h3>
              {session?.user.role === 'MANAGER' && (
                <p className="text-sm text-gray-600">
                  Submitted by: {goal.user?.name} ({goal.user?.email})
                </p>
              )}
              {session?.user.role !== 'MANAGER' && goal.manager && (
                <p className="text-sm text-gray-600">
                  Manager: {goal.manager.name} ({goal.manager.email})
                </p>
              )}
            </div>
            <span className={`px-3 py-1 rounded-full text-sm ${getStatusBadgeColor(goal.status)}`}>
              {goal.status.replace(/_/g, ' ')}
            </span>
          </div>

          <p className="text-gray-600 mb-4">{goal.description}</p>
          <p className="text-sm text-gray-500 mb-4">
            Due Date: {new Date(goal.dueDate).toLocaleDateString()}
          </p>

          {goal.comments && (
            <div className="bg-gray-50 p-4 rounded mb-4">
              <h4 className="font-semibold mb-2">Manager Comments:</h4>
              <p>{goal.comments}</p>
            </div>
          )}

          {session?.user.role === 'MANAGER' && goal.status === 'PENDING' && (
            <div className="space-y-4">
              <textarea
                className="w-full p-2 border rounded"
                placeholder="Add comments (optional)"
                id={`comments-${goal.id}`}
              />
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    const comments = (document.getElementById(`comments-${goal.id}`) as HTMLTextAreaElement)?.value;
                    handleStatusUpdate(goal.id, 'APPROVED', comments);
                  }}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  Approve
                </button>
                <button
                  onClick={() => {
                    const comments = (document.getElementById(`comments-${goal.id}`) as HTMLTextAreaElement)?.value;
                    handleStatusUpdate(goal.id, 'NEEDS_MODIFICATION', comments);
                  }}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  Request Changes
                </button>
              </div>
            </div>
          )}

          {session?.user.role !== 'MANAGER' && goal.status === 'NEEDS_MODIFICATION' && (
            <div className="mt-4">
              <button
                onClick={() => handleStatusUpdate(goal.id, 'MODIFIED')}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Submit Modified Goal
              </button>
            </div>
          )}
        </div>
      ))}

      {goals.length === 0 && (
        <div className="text-center text-gray-500">
          {session?.user.role === 'MANAGER'
            ? 'No goals pending review'
            : 'No goals created yet. Create your first goal above!'}
        </div>
      )}
    </div>
  );
} 
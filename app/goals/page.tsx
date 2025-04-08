'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import { toast } from 'react-toastify';
import { BsSearch, BsCalendar, BsClock, BsCheckCircle, BsXCircle } from 'react-icons/bs';

interface Goal {
  id: string;
  title: string;
  description: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  dueDate: string;
  submittedDate: string;
  managerComments?: string;
}

export default function GoalsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    fetchGoals();
  }, [status, router]);

  const fetchGoals = async () => {
    try {
      const response = await fetch('/api/goals/employee');
      if (!response.ok) throw new Error('Failed to fetch goals');
      const data = await response.json();
      setGoals(data);
    } catch (error) {
      toast.error('Failed to load goals');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredGoals = goals.filter(goal => {
    const matchesSearch = goal.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !selectedStatus || goal.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  if (status === 'loading' || isLoading) {
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
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">My Goals</h1>
            <button
              onClick={() => router.push('/dashboard/goals/create')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Create Goal
            </button>
          </div>

          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
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
                  className="w-full pl-10 pr-4 py-2 bg-white text-gray-900 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <select 
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 bg-white text-gray-900 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredGoals.map((goal) => (
              <div key={goal.id} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">{goal.title}</h3>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        goal.status === 'APPROVED'
                          ? 'bg-green-100 text-green-800'
                          : goal.status === 'REJECTED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {goal.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">{goal.description}</p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center space-x-2">
                      <BsCalendar />
                      <span>Due: {new Date(goal.dueDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <BsClock />
                      <span>Submitted: {new Date(goal.submittedDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {goal.status === 'REJECTED' && goal.managerComments && (
                    <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                      <h4 className="text-sm font-medium text-red-800 mb-2">Manager Feedback:</h4>
                      <p className="text-sm text-red-600">{goal.managerComments}</p>
                    </div>
                  )}

                  {goal.status === 'APPROVED' && (
                    <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center space-x-2">
                        <BsCheckCircle className="text-green-600" />
                        <span className="text-sm text-green-800">Goal Approved</span>
                      </div>
                    </div>
                  )}

                  {goal.status === 'PENDING' && (
                    <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center space-x-2">
                        <BsClock className="text-yellow-600" />
                        <span className="text-sm text-yellow-800">Waiting for approval</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
} 
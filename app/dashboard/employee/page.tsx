'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { BsSearch, BsListUl, BsCalendar, BsFlag, BsX, BsCheckCircle, BsXCircle, BsClock, BsPlus } from 'react-icons/bs';

interface Goal {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedDate: string;
  managerComments?: string;
}

export default function EmployeeDashboard() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  // Load goals from the database
  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const response = await fetch('/api/goals/employee');
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

  const filteredGoals = goals.filter(goal => {
    const matchesSearch = goal.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !selectedStatus || goal.status === selectedStatus;
    return matchesSearch && matchesStatus;
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
            <h1 className="text-2xl font-bold text-white">My Goals</h1>
            <p className="text-gray-400">Track and manage your performance goals</p>
          </div>
          <button
            onClick={() => router.push('/dashboard/goals/create')}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <BsPlus className="text-xl" />
            <span>Create Goal</span>
          </button>
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

                <p className="text-gray-400 text-sm mb-4">{goal.description}</p>

                <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
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
                  <div className="mt-4 p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                    <h4 className="text-sm font-medium text-red-400 mb-2">Manager Feedback:</h4>
                    <p className="text-sm text-gray-400">{goal.managerComments}</p>
                  </div>
                )}

                {goal.status === 'APPROVED' && (
                  <div className="mt-4 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                    <div className="flex items-center space-x-2">
                      <BsCheckCircle className="text-green-400" />
                      <span className="text-sm text-green-400">Goal Approved</span>
                    </div>
                  </div>
                )}

                {goal.status === 'PENDING' && (
                  <div className="mt-4 p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                    <div className="flex items-center space-x-2">
                      <BsClock className="text-yellow-400" />
                      <span className="text-sm text-yellow-400">Waiting for approval</span>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="col-span-full bg-[#1a1c23] rounded-lg p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#2d2f36] mb-4">
                <BsFlag className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">No goals found</h3>
              <p className="text-gray-400 mb-6">
                {selectedStatus 
                  ? `No goals with status "${selectedStatus.toLowerCase()}" found.`
                  : "You haven't created any goals yet."}
              </p>
              <button
                onClick={() => router.push('/dashboard/goals/create')}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <BsPlus className="text-xl" />
                <span>Create your first goal</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
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

interface EmployeeStats {
  id: string;
  name: string;
  email: string;
  goalsCount: number;
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
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<EmployeeStats[]>([]);
  const [selectedGoalDetails, setSelectedGoalDetails] = useState<Goal | null>(null);

  // Calculate statistics
  const stats = {
    total: goals.length,
    pending: goals.filter(g => g.status === 'PENDING').length,
    approved: goals.filter(g => g.status === 'APPROVED').length,
    rejected: goals.filter(g => g.status === 'REJECTED').length,
    employeeCount: new Set(goals.map(g => g.employeeEmail)).size
  };

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
        setGoals(data.goals || []);

        // Process employee statistics
        const employeeMap = new Map<string, EmployeeStats>();
        (data.goals || []).forEach((goal: Goal) => {
          const existing = employeeMap.get(goal.employeeEmail) || {
            id: goal.employeeEmail,
            name: goal.employeeName,
            email: goal.employeeEmail,
            goalsCount: 0
          };
          existing.goalsCount++;
          employeeMap.set(goal.employeeEmail, existing);
        });
        setEmployees(Array.from(employeeMap.values()));
      } catch (error) {
        console.error('Error fetching goals:', error);
        setGoals([]);
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGoals();
  }, []);

  const filteredGoals = goals.filter(goal => {
    const matchesSearch = goal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      goal.employeeName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !selectedStatus || goal.status === selectedStatus;
    const matchesEmployee = selectedEmployee === 'all' || goal.employeeEmail === selectedEmployee;
    return matchesSearch && matchesStatus && matchesEmployee;
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
        <div className="bg-[#1E2028] p-6 rounded-xl shadow-lg space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <BsStars className="w-8 h-8 text-indigo-400" />
              Employee Goals Overview
            </h1>
            <p className="text-gray-400 mt-1">View and track employee goals progress</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-[#252832] p-4 rounded-xl border border-gray-800">
              <div className="text-sm text-gray-400 mb-1">Total Goals</div>
              <div className="text-2xl font-bold text-white">{stats.total}</div>
            </div>
            <div className="bg-[#252832] p-4 rounded-xl border border-gray-800">
              <div className="text-sm text-amber-400 mb-1">Pending</div>
              <div className="text-2xl font-bold text-white">{stats.pending}</div>
            </div>
            <div className="bg-[#252832] p-4 rounded-xl border border-gray-800">
              <div className="text-sm text-emerald-400 mb-1">Approved</div>
              <div className="text-2xl font-bold text-white">{stats.approved}</div>
            </div>
            <div className="bg-[#252832] p-4 rounded-xl border border-gray-800">
              <div className="text-sm text-rose-400 mb-1">Rejected</div>
              <div className="text-2xl font-bold text-white">{stats.rejected}</div>
            </div>
            <div className="bg-[#252832] p-4 rounded-xl border border-gray-800">
              <div className="text-sm text-indigo-400 mb-1">Employees</div>
              <div className="text-2xl font-bold text-white">{stats.employeeCount}</div>
            </div>
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

          <div className="relative group">
            
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredGoals.length > 0 ? (
            filteredGoals.map((goal) => (
              <div 
                key={goal.id} 
                onClick={() => setSelectedGoalDetails(goal)}
                className={`bg-gradient-to-br ${STATUS_STYLES[goal.status].gradient} bg-[#1E2028] rounded-xl p-6 hover:shadow-xl transition-all duration-300 border border-gray-800 hover:border-gray-700 group cursor-pointer transform hover:scale-[1.02]`}
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

        {/* Goal Details Modal */}
        {selectedGoalDetails && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1E2028] rounded-xl w-full max-w-3xl border border-gray-800 shadow-2xl overflow-hidden">
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-800 bg-[#252832]">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-3">
                      <BsLightningCharge className="w-6 h-6 text-indigo-400" />
                      {selectedGoalDetails.title}
                    </h2>
                    <p className="text-gray-400 mt-1 flex items-center gap-2">
                      <BsPerson className="w-4 h-4" />
                      {selectedGoalDetails.employeeName}
                    </p>
                  </div>
                  <span className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 ${STATUS_STYLES[selectedGoalDetails.status].bg} ${STATUS_STYLES[selectedGoalDetails.status].text}`}>
                    {STATUS_STYLES[selectedGoalDetails.status].icon}
                    {selectedGoalDetails.status.charAt(0) + selectedGoalDetails.status.slice(1).toLowerCase()}
                  </span>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Description Section */}
                <div>
                  <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-500/10 rounded-lg">
                      <BsLightningCharge className="w-4 h-4 text-indigo-400" />
                    </div>
                    Description
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {selectedGoalDetails.description}
                  </p>
                </div>

                {/* Dates Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#252832] p-4 rounded-xl border border-gray-800">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-1.5 bg-amber-500/10 rounded-lg">
                        <BsCalendar className="w-4 h-4 text-amber-400" />
                      </div>
                      <h4 className="text-sm font-medium text-white">Due Date</h4>
                    </div>
                    <p className="text-gray-400">
                      {new Date(selectedGoalDetails.dueDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="bg-[#252832] p-4 rounded-xl border border-gray-800">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                        <BsClock className="w-4 h-4 text-emerald-400" />
                      </div>
                      <h4 className="text-sm font-medium text-white">Submission Date</h4>
                    </div>
                    <p className="text-gray-400">
                      {new Date(selectedGoalDetails.submittedDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                {/* Feedback Section */}
                {selectedGoalDetails.feedback && (
                  <div className="bg-[#252832] p-4 rounded-xl border border-gray-800">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-1.5 bg-rose-500/10 rounded-lg">
                        <BsChat className="w-4 h-4 text-rose-400" />
                      </div>
                      <h4 className="text-sm font-medium text-white">Feedback</h4>
                    </div>
                    <p className="text-gray-300 leading-relaxed">
                      {selectedGoalDetails.feedback}
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-800 bg-[#252832] flex justify-end">
                <button
                  onClick={() => setSelectedGoalDetails(null)}
                  className="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 
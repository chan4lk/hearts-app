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
import { useSession } from 'next-auth/react';

type GoalStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'MODIFIED' | 'COMPLETED' | 'DELETED';

interface Goal {
  id: string;
  employee: {
    id: string;
    name: string;
    email: string;
  };
  manager?: {
    id: string;
    name: string;
    email: string;
  };
  title: string;
  description: string;
  dueDate: string;
  status: GoalStatus;
  category: string;
  createdAt: string;
  updatedAt: string;
  managerComments?: string;
  employeeComment?: string;
}

interface EmployeeStats {
  id: string;
  name: string;
  email: string;
  goalsCount: number;
}

interface StatusStyle {
  bg: string;
  text: string;
  icon: JSX.Element;
  gradient?: string;
}

const STATUS_STYLES: Record<Exclude<GoalStatus, 'DELETED'>, StatusStyle> = {
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
  },
  MODIFIED: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    icon: <BsArrowRight className="w-4 h-4" />,
    gradient: 'from-blue-500/10'
  },
  COMPLETED: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    icon: <BsCheckCircle className="w-4 h-4" />,
    gradient: 'from-purple-500/10'
  },
  DRAFT: {
    bg: 'bg-gray-500/10',
    text: 'text-gray-400',
    icon: <BsChat className="w-4 h-4" />,
    gradient: 'from-gray-500/10'
  }
};

const getStatusStyle = (status: GoalStatus): StatusStyle => {
  if (status === 'DELETED') {
    return {
      bg: 'bg-gray-500/10',
      text: 'text-gray-400',
      icon: <BsXCircle className="w-4 h-4" />,
      gradient: 'from-gray-500/10'
    };
  }
  return STATUS_STYLES[status as keyof typeof STATUS_STYLES];
};

export default function ManagerDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<EmployeeStats[]>([]);
  const [employeeCounts, setEmployeeCounts] = useState({ total: 0, active: 0 });
  const [selectedGoalDetails, setSelectedGoalDetails] = useState<Goal | null>(null);
  const [activeTab, setActiveTab] = useState<'employee' | 'personal'>('employee');
  const { data: session } = useSession();

  // Calculate statistics for both employee goals and personal goals
  const stats = {
    employeeGoals: {
      total: goals.filter(g => g.employee.email !== session?.user?.email).length,
      draft: goals.filter(g => g.employee.email !== session?.user?.email && g.status === 'DRAFT').length,
      pending: goals.filter(g => g.employee.email !== session?.user?.email && g.status === 'PENDING').length,
      approved: goals.filter(g => g.employee.email !== session?.user?.email && g.status === 'APPROVED').length,
      rejected: goals.filter(g => g.employee.email !== session?.user?.email && g.status === 'REJECTED').length,
      modified: goals.filter(g => g.employee.email !== session?.user?.email && g.status === 'MODIFIED').length,
      completed: goals.filter(g => g.employee.email !== session?.user?.email && g.status === 'COMPLETED').length,
    },
    personalGoals: {
      total: goals.filter(g => g.employee.email === session?.user?.email).length,
      draft: goals.filter(g => g.employee.email === session?.user?.email && g.status === 'DRAFT').length,
      pending: goals.filter(g => g.employee.email === session?.user?.email && g.status === 'PENDING').length,
      approved: goals.filter(g => g.employee.email === session?.user?.email && g.status === 'APPROVED').length,
      rejected: goals.filter(g => g.employee.email === session?.user?.email && g.status === 'REJECTED').length,
      modified: goals.filter(g => g.employee.email === session?.user?.email && g.status === 'MODIFIED').length,
      completed: goals.filter(g => g.employee.email === session?.user?.email && g.status === 'COMPLETED').length,
    },
    employeeCount: employeeCounts.total,
    activeEmployees: employeeCounts.active
  };

  // Load goals and employees from the database
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch employees first
        const empResponse = await fetch('/api/employees');
        if (!empResponse.ok) {
          throw new Error('Failed to fetch employees');
        }
        const empData = await empResponse.json();
        setEmployees(empData.employees || []);
        setEmployeeCounts({
          total: empData.totalCount || 0,
          active: empData.activeCount || 0
        });

        // Then fetch goals
        const goalResponse = await fetch('/api/goals/managed');
        if (!goalResponse.ok) {
          throw new Error('Failed to fetch goals');
        }
        const goalData = await goalResponse.json();
        
        // Map employee names to goals if they're missing
        const goalsWithEmployeeNames = goalData.goals.map((goal: Goal) => {
          // If the goal already has an employee name, keep it
          if (goal.employee.name) {
            return goal;
          }
          
          // Otherwise, try to find the employee by email and add the name
          const employee = empData.employees.find((emp: EmployeeStats) => emp.email === goal.employee.email);
          if (employee) {
            return {
              ...goal,
              employee: {
                ...goal.employee,
                name: employee.name
              }
            };
          }
          
          return goal;
        });
        
        setGoals(goalsWithEmployeeNames || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        setGoals([]);
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session?.user?.email]);

  const filteredGoals = goals.filter(goal => {
    const query = searchQuery.toLowerCase().trim();
    const titleMatch = goal.title.toLowerCase().includes(query);
    const employeeNameMatch = goal.employee?.name 
      ? goal.employee.name.toLowerCase().includes(query)
      : false;
    const employeeEmailMatch = goal.employee?.email
      ? goal.employee.email.toLowerCase().includes(query)
      : false;
    const matchesSearch = titleMatch || employeeNameMatch || employeeEmailMatch;
    const matchesStatus = !selectedStatus || goal.status === selectedStatus;
    const matchesEmployee = selectedEmployee === 'all' || goal.employee?.email === selectedEmployee;
    const matchesTab = activeTab === 'employee' 
      ? goal.employee.email !== session?.user?.email 
      : goal.employee.email === session?.user?.email;
    
    return matchesSearch && matchesStatus && matchesEmployee && matchesTab;
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
        {/* Header Section */}
        <div className="bg-[#1E2028] p-6 rounded-xl shadow-lg space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <BsStars className="w-8 h-8 text-indigo-400" />
              Goals Dashboard
            </h1>
            <p className="text-gray-400 mt-1">Manage your goals and track employee progress</p>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-4 border-b border-gray-700">
            <button
              onClick={() => setActiveTab('employee')}
              className={`pb-4 px-4 font-medium transition-colors ${
                activeTab === 'employee'
                  ? 'text-indigo-400 border-b-2 border-indigo-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Employee Goals
            </button>
            <button
              onClick={() => setActiveTab('personal')}
              className={`pb-4 px-4 font-medium transition-colors ${
                activeTab === 'personal'
                  ? 'text-indigo-400 border-b-2 border-indigo-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              My Goals
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {activeTab === 'employee' ? (
              <>
                <div className="bg-[#252832] p-4 rounded-xl border border-gray-800">
                  <div className="text-sm text-gray-400 mb-1">Total Employee Goals</div>
                  <div className="text-2xl font-bold text-white">{stats.employeeGoals.total}</div>
                </div>
                <div className="bg-[#252832] p-4 rounded-xl border border-gray-800">
                  <div className="text-sm text-amber-400 mb-1">Pending</div>
                  <div className="text-2xl font-bold text-white">{stats.employeeGoals.pending}</div>
                </div>
                <div className="bg-[#252832] p-4 rounded-xl border border-gray-800">
                  <div className="text-sm text-emerald-400 mb-1">Approved</div>
                  <div className="text-2xl font-bold text-white">{stats.employeeGoals.approved}</div>
                </div>
                <div className="bg-[#252832] p-4 rounded-xl border border-gray-800">
                  <div className="text-sm text-rose-400 mb-1">Rejected</div>
                  <div className="text-2xl font-bold text-white">{stats.employeeGoals.rejected}</div>
                </div>
                <div className="bg-[#252832] p-4 rounded-xl border border-gray-800">
                  <div className="text-sm text-indigo-400 mb-1">Total Employees</div>
                  <div className="text-2xl font-bold text-white">{stats.employeeCount}</div>
                </div>
                <div className="bg-[#252832] p-4 rounded-xl border border-gray-800">
                  <div className="text-sm text-emerald-400 mb-1">Active Employees</div>
                  <div className="text-2xl font-bold text-white">{stats.activeEmployees}</div>
                </div>
              </>
            ) : (
              <>
                <div className="bg-[#252832] p-4 rounded-xl border border-gray-800">
                  <div className="text-sm text-gray-400 mb-1">My Total Goals</div>
                  <div className="text-2xl font-bold text-white">{stats.personalGoals.total}</div>
                </div>
                <div className="bg-[#252832] p-4 rounded-xl border border-gray-800">
                  <div className="text-sm text-amber-400 mb-1">Pending</div>
                  <div className="text-2xl font-bold text-white">{stats.personalGoals.pending}</div>
                </div>
                <div className="bg-[#252832] p-4 rounded-xl border border-gray-800">
                  <div className="text-sm text-emerald-400 mb-1">Approved</div>
                  <div className="text-2xl font-bold text-white">{stats.personalGoals.approved}</div>
                </div>
                <div className="bg-[#252832] p-4 rounded-xl border border-gray-800">
                  <div className="text-sm text-rose-400 mb-1">Rejected</div>
                  <div className="text-2xl font-bold text-white">{stats.personalGoals.rejected}</div>
                </div>
                <div className="bg-[#252832] p-4 rounded-xl border border-gray-800 col-span-2">
                  <div className="text-sm text-indigo-400 mb-1">Completion Rate</div>
                  <div className="text-2xl font-bold text-white">
                    {stats.personalGoals.total > 0
                      ? `${Math.round((stats.personalGoals.approved / stats.personalGoals.total) * 100)}%`
                      : '0%'}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Filters Section */}
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <BsSearch className="text-gray-400 group-hover:text-indigo-400 transition-colors" />
              </div>
              <input
                type="text"
                placeholder={`Search ${activeTab === 'employee' ? 'employee' : 'personal'} goals...`}
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
              <option value="DRAFT">Draft</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="MODIFIED">Modified</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          {activeTab === 'employee' && (
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <BsPerson className="text-gray-400 group-hover:text-indigo-400 transition-colors" />
              </div>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="pl-10 pr-4 py-3 bg-[#1E2028] text-white rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:bg-[#252832] hover:border-gray-600 transition-all appearance-none cursor-pointer min-w-[180px]"
              >
                <option value="all">All Employees</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.email}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Goals Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredGoals.length > 0 ? (
            filteredGoals.map((goal) => (
              <div 
                key={goal.id} 
                onClick={() => setSelectedGoalDetails(goal)}
                className="bg-[#1E2028] rounded-xl p-6 hover:shadow-xl transition-all duration-300 border border-gray-800 hover:border-gray-700 cursor-pointer"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <BsLightningCharge className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-lg font-medium text-indigo-400">
                      {goal.title}
                    </h3>
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-sm ${
                    getStatusStyle(goal.status).bg
                  } ${getStatusStyle(goal.status).text}`}>
                    {getStatusStyle(goal.status).icon}
                    <span className="ml-1">
                      {goal.status.charAt(0) + goal.status.slice(1).toLowerCase()}
                    </span>
                  </span>
                </div>

                {activeTab === 'employee' && (
                  <div className="mb-4">
                    <div className="bg-[#252832] p-1.5 rounded-lg flex items-center gap-2">
                      <BsPerson className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300">
                        {goal.employee?.name}
                      </span>
                    </div>
                  </div>
                )}

                <p className="text-gray-400 mb-4">
                  {goal.description}
                </p>

                <div className="flex items-center justify-between text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <BsCalendar className="w-4 h-4" />
                    <span>Due: {goal.dueDate ? new Date(goal.dueDate).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-[#252832] px-3 py-1.5 rounded-lg">
                    <BsClock className="w-4 h-4" />
                    <span>Submitted: {goal.createdAt ? new Date(goal.createdAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
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
                  ? `No ${activeTab === 'employee' ? 'employee' : 'personal'} goals with status "${selectedStatus.toLowerCase()}" found.`
                  : `There are no ${activeTab === 'employee' ? 'employee' : 'personal'} goals to review at this time.`}
              </p>
            </div>
          )}
        </div>

        {/* Goal Details Modal */}
        {selectedGoalDetails && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#1E2028] rounded-xl w-full max-w-2xl border border-gray-800 shadow-2xl">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <BsLightningCharge className="w-6 h-6 text-indigo-400" />
                      <h2 className="text-xl font-medium text-indigo-400">
                        {selectedGoalDetails.title}
                      </h2>
                    </div>
                    {activeTab === 'employee' && (
                      <div className="flex items-center gap-2">
                        <BsPerson className="w-5 h-5 text-indigo-400" />
                        <span className="text-indigo-400 text-lg">
                          {selectedGoalDetails.employee?.name}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-sm ${
                    getStatusStyle(selectedGoalDetails.status).bg
                  } ${getStatusStyle(selectedGoalDetails.status).text}`}>
                    {getStatusStyle(selectedGoalDetails.status).icon}
                    <span className="ml-1">
                      {selectedGoalDetails.status.charAt(0) + selectedGoalDetails.status.slice(1).toLowerCase()}
                    </span>
                  </span>
                </div>

                <p className="text-gray-400 mb-6">
                  {selectedGoalDetails.description || 'No description provided'}
                </p>

                <div className="flex items-center justify-between text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <BsCalendar className="w-4 h-4" />
                    <span>Due: {selectedGoalDetails.dueDate ? new Date(selectedGoalDetails.dueDate).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BsClock className="w-4 h-4" />
                    <span>Submitted: {selectedGoalDetails.createdAt ? new Date(selectedGoalDetails.createdAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setSelectedGoalDetails(null)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 
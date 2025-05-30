'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  BsSearch, 
  BsCheckCircle, 
  BsXCircle, 
  BsClock, 
  BsPerson, 
  BsCalendar,
  BsFilter,
  BsLightningCharge,
  BsStars,
  BsExclamationCircle,
  BsPersonLinesFill
} from 'react-icons/bs';

const STATUS_STYLES = {
  PENDING: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    icon: <BsClock className="w-4 h-4" />,
    gradient: 'from-amber-500/10'
  },
  MODIFIED: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    icon: <BsExclamationCircle className="w-4 h-4" />,
    gradient: 'from-blue-500/10'
  },
  APPROVED: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    icon: <BsCheckCircle className="w-4 h-4" />,
    gradient: 'from-emerald-500/10'
  },
  REJECTED: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    icon: <BsXCircle className="w-4 h-4" />,
    gradient: 'from-rose-500/10'
  }
} as const;

interface Goal {
  id: string;
  title: string;
  description: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'MODIFIED';
  createdAt: string;
  dueDate: string;
  managerComments?: string;
  employee: {
    id: string;
    name: string;
    email: string;
  };
}

interface EmployeeStats {
  id: string;
  name: string;
  email: string;
  pendingGoals: number;
}

export default function ApproveGoalsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [selectedGoalDetails, setSelectedGoalDetails] = useState<Goal | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [employeeStats, setEmployeeStats] = useState<EmployeeStats[]>([]);
  const [showAlert, setShowAlert] = useState(false);
  const [alertType, setAlertType] = useState<'success' | 'error'>('success');
  const [alertMessage, setAlertMessage] = useState('');

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
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/goals/pending');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch goals');
      }
      
      const data = await response.json();
      console.log('Fetched goals:', data); // Debug log
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format: expected an array of goals');
      }
      
      setGoals(data);
      
      // Calculate employee statistics
      const statsMap = new Map<string, EmployeeStats>();
      data.forEach((goal: Goal) => {
        const { id, name, email } = goal.employee;
        const currentStats = statsMap.get(id) || {
          id,
          name,
          email,
          pendingGoals: 0,
        };
        currentStats.pendingGoals++;
        statsMap.set(id, currentStats);
      });
      setEmployeeStats(Array.from(statsMap.values()));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load goals';
      console.error('Error fetching goals:', err);
      setError(errorMessage);
      toast.error(errorMessage);
      setGoals([]);
      setEmployeeStats([]);
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

      setAlertType('success');
      setAlertMessage('Goal approved successfully!');
      setShowAlert(true);
      fetchGoals();
      closeActionModal();
      
      setTimeout(() => {
        setShowAlert(false);
      }, 3000);
    } catch (err) {
      console.error('Error approving goal:', err);
      setAlertType('error');
      setAlertMessage('Failed to approve goal');
      setShowAlert(true);
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

      setAlertType('success');
      setAlertMessage('Goal rejected successfully!');
      setShowAlert(true);
      fetchGoals();
      closeActionModal();
      
      setTimeout(() => {
        setShowAlert(false);
      }, 3000);
    } catch (err) {
      console.error('Error rejecting goal:', err);
      setAlertType('error');
      setAlertMessage('Failed to reject goal');
      setShowAlert(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredGoals = goals.filter(goal => 
    selectedEmployee === 'all' || goal.employee.id === selectedEmployee
  );

  if (isLoading) {
    return (
      <DashboardLayout type="manager">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type="manager">
      <div className="container mx-auto py-4 sm:py-8 px-4">
        <div className="space-y-6 sm:space-y-8">
          {/* Header Section */}
          <div className="bg-[#1E2028] p-4 sm:p-6 rounded-xl shadow-lg space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-500/10 rounded-xl">
                  <BsStars className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-400" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">Approve Goals</h1>
                  <p className="text-gray-300">Review and manage pending employee goals</p>
                </div>
              </div>
              <div className="relative group w-full sm:min-w-[280px]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <BsFilter className="w-5 h-5 text-gray-300 group-hover:text-indigo-400 transition-colors" />
                </div>
                <Select
                  value={selectedEmployee}
                  onValueChange={setSelectedEmployee}
                >
                  <SelectTrigger className="pl-10 pr-4 py-3 bg-[#252832] text-white rounded-xl border border-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:border-gray-700 transition-all w-full">
                    <div className="flex items-center gap-2">
                      <BsPerson className="w-4 h-4 text-gray-300" />
                      <SelectValue placeholder="Filter by employee..." />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-[#1E2028] border-gray-800 text-white">
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <BsPersonLinesFill className="w-4 h-4 text-gray-300" />
                        <span className="text-gray-200">All Employees</span>
                      </div>
                    </SelectItem>
                    {employeeStats.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>
                        <div className="flex items-center justify-between w-full gap-3">
                          <div className="flex items-center gap-2">
                            <BsPerson className="w-4 h-4 text-gray-300" />
                            <span className="text-gray-200">{emp.name}</span>
                          </div>
                          <span className="text-xs bg-amber-500/10 text-amber-300 px-2 py-1 rounded-full">
                            {emp.pendingGoals} pending
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="flex items-start justify-between gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 flex-1">
                <div className="bg-[#252832] p-4 rounded-xl border border-gray-800">
                  <div className="text-sm text-amber-300 mb-1">Pending Goals</div>
                  <div className="text-xl sm:text-2xl font-bold text-white">{goals.length}</div>
                </div>
                <div className="bg-[#252832] p-4 rounded-xl border border-gray-800">
                  <div className="text-sm text-indigo-300 mb-1">Employees</div>
                  <div className="text-xl sm:text-2xl font-bold text-white">{employeeStats.length}</div>
                </div>
                <div className="bg-[#252832] p-4 rounded-xl border border-gray-800">
                  <div className="text-sm text-emerald-300 mb-1">Avg. Goals/Employee</div>
                  <div className="text-xl sm:text-2xl font-bold text-white">
                    {employeeStats.length > 0 ? (goals.length / employeeStats.length).toFixed(1) : '0.0'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Goals Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
            </div>
          ) : filteredGoals.length === 0 ? (
            <div className="bg-[#1E2028] rounded-xl p-8 sm:p-12 text-center border border-gray-800">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#252832] mb-4">
                <BsPersonLinesFill className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">No pending goals found</h3>
              <p className="text-gray-300">
                {selectedEmployee !== 'all'
                  ? "This employee has no pending goals"
                  : "There are no goals waiting for approval"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredGoals.map(goal => (
                <div
                  key={goal.id}
                  onClick={() => setSelectedGoalDetails(goal)}
                  className="group relative bg-[#1E2028] rounded-xl border border-gray-800 hover:border-gray-700 transition-all duration-300 overflow-hidden cursor-pointer transform hover:scale-[1.02]"
                >
                  {/* Status Badge */}
                  <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs flex items-center gap-1 ${STATUS_STYLES[goal.status]?.bg || 'bg-gray-500/10'} ${STATUS_STYLES[goal.status]?.text || 'text-gray-300'}`}>
                    {STATUS_STYLES[goal.status]?.icon || <BsClock className="w-3 h-3" />}
                    <span className="hidden sm:inline">{goal.status.charAt(0) + goal.status.slice(1).toLowerCase()}</span>
                    <span className="inline sm:hidden">{goal.status.charAt(0)}</span>
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-3">
                    {/* Title and Employee */}
                    <div className="mb-3">
                      <h3 className="text-base font-semibold text-white group-hover:text-indigo-400 transition-colors mb-1 line-clamp-1">
                        {goal.title}
                      </h3>
                      <div className="flex items-center gap-1 text-gray-300 text-xs">
                        <BsPerson className="w-3 h-3" />
                        <span className="line-clamp-1">{goal.employee.name}</span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-gray-400 text-xs mb-3 line-clamp-2">
                      {goal.description}
                    </p>

                    {/* Dates */}
                    <div className="space-y-1 mb-4">
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <BsCalendar className="w-3 h-3 text-amber-400" />
                        <span>Due: {new Date(goal.dueDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <BsClock className="w-3 h-3 text-emerald-400" />
                        <span>Submitted: {new Date(goal.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openActionModal(goal, 'approve');
                        }}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-emerald-500/10 text-emerald-300 rounded-md hover:bg-emerald-500 hover:text-white transition-all group text-xs"
                      >
                        <BsCheckCircle className="w-3 h-3 transform group-hover:scale-110 transition-transform" />
                        Approve
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openActionModal(goal, 'reject');
                        }}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-rose-500/10 text-rose-300 rounded-md hover:bg-rose-500 hover:text-white transition-all group text-xs"
                      >
                        <BsXCircle className="w-3 h-3 transform group-hover:scale-110 transition-transform" />
                        Reject
                      </button>
                    </div>
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              ))}
            </div>
          )}

          {/* Goal Details Modal */}
          {selectedGoalDetails && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-[#1E2028] rounded-xl w-full max-w-3xl border border-gray-800 shadow-2xl overflow-hidden">
                {/* Modal Header */}
                <div className="p-6 border-b border-gray-800 bg-[#252832]">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <BsLightningCharge className="w-6 h-6 text-indigo-400" />
                        {selectedGoalDetails.title}
                      </h2>
                      <div className="flex items-center gap-2 text-gray-300 text-sm sm:text-base">
                        <BsPerson className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>{selectedGoalDetails.employee.name}</span>
                      </div>
                    </div>
                    <span className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm flex items-center gap-2 ${STATUS_STYLES[selectedGoalDetails.status]?.bg || 'bg-gray-500/10'} ${STATUS_STYLES[selectedGoalDetails.status]?.text || 'text-gray-300'}`}>
                      {STATUS_STYLES[selectedGoalDetails.status]?.icon || <BsClock className="w-4 h-4" />}
                      {selectedGoalDetails.status.charAt(0) + selectedGoalDetails.status.slice(1).toLowerCase()}
                    </span>
                  </div>
                </div>

                {/* Modal Content */}
                <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
                  {/* Description Section */}
                  <div className="bg-[#252832] rounded-xl p-6 border border-gray-800">
                    <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                      <div className="p-1.5 bg-indigo-500/10 rounded-lg">
                        <BsLightningCharge className="w-4 h-4 text-indigo-400" />
                      </div>
                      Description
                    </h3>
                    <p className="text-gray-200 leading-relaxed text-sm sm:text-base">
                      {selectedGoalDetails.description}
                    </p>
                  </div>

                  {/* Dates Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#252832] p-6 rounded-xl border border-gray-800">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-amber-500/10 rounded-lg">
                          <BsCalendar className="w-5 h-5 text-amber-300" />
                        </div>
                        <h4 className="text-base font-medium text-white">Due Date</h4>
                      </div>
                      <p className="text-gray-300 text-sm sm:text-base">
                        {new Date(selectedGoalDetails.dueDate).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="bg-[#252832] p-6 rounded-xl border border-gray-800">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                          <BsClock className="w-5 h-5 text-emerald-300" />
                        </div>
                        <h4 className="text-base font-medium text-white">Submission Date</h4>
                      </div>
                      <p className="text-gray-300 text-sm sm:text-base">
                        {new Date(selectedGoalDetails.createdAt).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <button
                      onClick={() => {
                        setSelectedGoalDetails(null);
                        openActionModal(selectedGoalDetails, 'approve');
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500/10 text-emerald-300 rounded-lg hover:bg-emerald-500 hover:text-white transition-all group text-sm sm:text-base"
                    >
                      <BsCheckCircle className="w-5 h-5 transform group-hover:scale-110 transition-transform" />
                      Approve Goal
                    </button>
                    <button
                      onClick={() => {
                        setSelectedGoalDetails(null);
                        openActionModal(selectedGoalDetails, 'reject');
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-rose-500/10 text-rose-300 rounded-lg hover:bg-rose-500 hover:text-white transition-all group text-sm sm:text-base"
                    >
                      <BsXCircle className="w-5 h-5 transform group-hover:scale-110 transition-transform" />
                      Reject Goal
                    </button>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="p-6 border-t border-gray-800 bg-[#252832] flex justify-end">
                  <button
                    onClick={() => setSelectedGoalDetails(null)}
                    className="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2 text-sm sm:text-base"
                  >
                    Close Details
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Action Modal */}
          {selectedGoal && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-[#1E2028] rounded-xl w-full max-w-lg border border-gray-800 shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-gray-800 bg-[#252832]">
                  <h2 className="text-xl font-bold text-white flex items-center gap-3">
                    {selectedGoal ? 'Approve' : 'Reject'} Goal
                  </h2>
                  <p className="text-gray-300 mt-1 text-sm sm:text-base">{selectedGoal.title}</p>
                </div>

                <div className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-gray-200 text-sm sm:text-base">Feedback Comments</Label>
                    <Textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Add your feedback comments here..."
                      className="bg-[#252832] border-gray-700 text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base"
                      rows={4}
                    />
                  </div>
                  
                  <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={closeActionModal}
                      disabled={isSubmitting}
                      className="bg-gray-700 hover:bg-gray-600 border-gray-600 text-gray-200 text-sm sm:text-base"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleApprove}
                      disabled={isSubmitting}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm sm:text-base"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                          Processing...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <BsCheckCircle className="w-4 h-4" />
                          Approve
                        </div>
                      )}
                    </Button>
                    <Button
                      onClick={handleReject}
                      disabled={isSubmitting}
                      className="bg-rose-500 hover:bg-rose-600 text-white text-sm sm:text-base"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                          Processing...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <BsXCircle className="w-4 h-4" />
                          Reject
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Alert Message */}
          {showAlert && (
            <div className="fixed inset-0 flex items-center justify-center z-50">
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
              <div className={`relative p-6 rounded-xl ${
                alertType === 'success' 
                  ? 'bg-green-500/90 border border-green-400' 
                  : 'bg-red-500/90 border border-red-400'
              } backdrop-blur-sm transform transition-all duration-300`}>
                <div className="flex items-center space-x-3">
                  {alertType === 'success' ? (
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  <p className="text-white font-medium">{alertMessage}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
} 
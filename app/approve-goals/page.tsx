'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  BsArrowRight,
  BsChat,
  BsShield,
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
  User_Goal_employeeIdToUser: {
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
        const { id, name, email } = goal.User_Goal_employeeIdToUser;
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

  const filteredGoals = goals.filter(goal => 
    selectedEmployee === 'all' || goal.User_Goal_employeeIdToUser.id === selectedEmployee
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
      <div className="container mx-auto py-8 px-4">
        <div className="space-y-8">
          {/* Header Section */}
          <div className="bg-[#1E2028] p-6 rounded-xl shadow-lg space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-500/10 rounded-xl">
                  <BsStars className="w-8 h-8 text-indigo-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white mb-1">Approve Goals</h1>
                  <p className="text-gray-400">Review and manage pending employee goals</p>
                </div>
              </div>
              <div className="relative group min-w-[280px]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <BsFilter className="w-5 h-5 text-gray-400 group-hover:text-indigo-400 transition-colors" />
                </div>
                <Select
                  value={selectedEmployee}
                  onValueChange={setSelectedEmployee}
                >
                  <SelectTrigger className="pl-10 pr-4 py-3 bg-[#252832] text-white rounded-xl border border-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:border-gray-700 transition-all">
                    <div className="flex items-center gap-2">
                      <BsPerson className="w-4 h-4 text-gray-400" />
                      <SelectValue placeholder="Filter by employee..." />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <BsPersonLinesFill className="w-4 h-4" />
                        <span>All Employees</span>
                      </div>
                    </SelectItem>
                    {employeeStats.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>
                        <div className="flex items-center justify-between w-full gap-3">
                          <div className="flex items-center gap-2">
                            <BsPerson className="w-4 h-4" />
                            <span>{emp.name}</span>
                          </div>
                          <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-1 rounded-full">
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                <div className="bg-[#252832] p-4 rounded-xl border border-gray-800">
                  <div className="text-sm text-amber-400 mb-1">Pending Goals</div>
                  <div className="text-2xl font-bold text-white">{goals.length}</div>
                </div>
                <div className="bg-[#252832] p-4 rounded-xl border border-gray-800">
                  <div className="text-sm text-indigo-400 mb-1">Employees</div>
                  <div className="text-2xl font-bold text-white">{employeeStats.length}</div>
                </div>
                <div className="bg-[#252832] p-4 rounded-xl border border-gray-800">
                  <div className="text-sm text-emerald-400 mb-1">Avg. Goals/Employee</div>
                  <div className="text-2xl font-bold text-white">
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
            <div className="bg-[#1E2028] rounded-xl p-12 text-center border border-gray-800">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#252832] mb-4">
                <BsPersonLinesFill className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">No pending goals found</h3>
              <p className="text-gray-400">
                {selectedEmployee !== 'all'
                  ? "This employee has no pending goals"
                  : "There are no goals waiting for approval"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredGoals.map(goal => (
                <div
                  key={goal.id}
                  onClick={() => setSelectedGoalDetails(goal)}
                  className={`bg-gradient-to-br ${STATUS_STYLES[goal.status]?.gradient || 'from-gray-500/10'} bg-[#1E2028] rounded-xl p-6 hover:shadow-xl transition-all duration-300 border border-gray-800 hover:border-gray-700 group cursor-pointer transform hover:scale-[1.02]`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-medium text-white group-hover:text-indigo-400 transition-colors flex items-center gap-2">
                      <BsLightningCharge className="w-5 h-5 text-indigo-400" />
                      {goal.title}
                    </h3>
                    <span className={`px-3 py-1.5 rounded-full text-xs flex items-center gap-2 ${STATUS_STYLES[goal.status]?.bg || 'bg-gray-500/10'} ${STATUS_STYLES[goal.status]?.text || 'text-gray-400'}`}>
                      {STATUS_STYLES[goal.status]?.icon || <BsClock className="w-4 h-4" />}
                      {goal.status.charAt(0) + goal.status.slice(1).toLowerCase()}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 mb-4 text-gray-300">
                    <div className="bg-[#252832] p-1.5 rounded-lg">
                      <BsPerson className="w-4 h-4" />
                    </div>
                    <span className="group-hover:text-indigo-400 transition-colors">
                      {goal.User_Goal_employeeIdToUser.name}
                    </span>
                  </div>

                  <p className="text-gray-400 text-sm mb-4 line-clamp-2 group-hover:text-gray-300 transition-colors">
                    {goal.description}
                  </p>

                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <div className="flex items-center space-x-2 bg-[#252832] px-3 py-1.5 rounded-lg">
                      <BsCalendar className="w-4 h-4" />
                      <span>Due: {new Date(goal.dueDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-2 bg-[#252832] px-3 py-1.5 rounded-lg">
                      <BsClock className="w-4 h-4" />
                      <span>Submitted: {new Date(goal.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-6">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openActionModal(goal, 'approve');
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500 hover:text-white transition-all group"
                    >
                      <BsCheckCircle className="w-4 h-4 transform group-hover:scale-110 transition-transform" />
                      Approve
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openActionModal(goal, 'reject');
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-500/10 text-rose-400 rounded-lg hover:bg-rose-500 hover:text-white transition-all group"
                    >
                      <BsXCircle className="w-4 h-4 transform group-hover:scale-110 transition-transform" />
                      Reject
                    </button>
                  </div>
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
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-white flex items-center gap-3">
                        <BsLightningCharge className="w-6 h-6 text-indigo-400" />
                        {selectedGoalDetails.title}
                      </h2>
                      <p className="text-gray-400 mt-1 flex items-center gap-2">
                        <BsPerson className="w-4 h-4" />
                        {selectedGoalDetails.User_Goal_employeeIdToUser.name}
                      </p>
                    </div>
                    <span className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 ${STATUS_STYLES[selectedGoalDetails.status]?.bg || 'bg-gray-500/10'} ${STATUS_STYLES[selectedGoalDetails.status]?.text || 'text-gray-400'}`}>
                      {STATUS_STYLES[selectedGoalDetails.status]?.icon || <BsClock className="w-4 h-4" />}
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
                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={() => {
                        setSelectedGoalDetails(null);
                        openActionModal(selectedGoalDetails, 'approve');
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500 hover:text-white transition-all group"
                    >
                      <BsCheckCircle className="w-5 h-5 transform group-hover:scale-110 transition-transform" />
                      Approve Goal
                    </button>
                    <button
                      onClick={() => {
                        setSelectedGoalDetails(null);
                        openActionModal(selectedGoalDetails, 'reject');
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-rose-500/10 text-rose-400 rounded-lg hover:bg-rose-500 hover:text-white transition-all group"
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
                    className="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2"
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
                  <p className="text-gray-400 mt-1">{selectedGoal.title}</p>
                </div>

                <div className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Feedback Comments</Label>
                    <Textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Add your feedback comments here..."
                      className="bg-[#252832] border-gray-700 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      rows={4}
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={closeActionModal}
                      disabled={isSubmitting}
                      className="bg-gray-700 hover:bg-gray-600 border-gray-600"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleApprove}
                      disabled={isSubmitting}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white"
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
                      className="bg-rose-500 hover:bg-rose-600 text-white"
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
        </div>
      </div>
    </DashboardLayout>
  );
} 
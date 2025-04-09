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
import { BsPersonLinesFill, BsFilter, BsCheckCircle, BsXCircle } from 'react-icons/bs';

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
      const response = await fetch('/api/goals/pending');
      if (!response.ok) throw new Error('Failed to fetch goals');
      const data = await response.json();
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
      setError('Failed to load goals');
      toast.error('Failed to load goals');
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

  const content = (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-[#1E2028] to-[#252832] p-8 rounded-xl shadow-lg border border-gray-800/50">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 rounded-xl">
              <BsPersonLinesFill className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">Approve Goals</h1>
              <p className="text-gray-400">Review and approve employee goals</p>
            </div>
          </div>
        </div>

        {/* Employee Filter */}
        <div className="flex flex-wrap items-start gap-6 mb-6 pb-6 border-b border-gray-800/50">
          <div className="flex-1 min-w-[250px] space-y-2">
            <Label className="text-gray-300 font-medium flex items-center gap-2">
              <BsFilter className="w-4 h-4" />
              Filter by Employee
            </Label>
            <Select
              value={selectedEmployee}
              onValueChange={setSelectedEmployee}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose employee..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">👥 All Employees</SelectItem>
                {employeeStats.map(emp => (
                  <SelectItem key={emp.id} value={emp.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>👤 {emp.name}</span>
                      <span className="text-xs text-gray-400">
                        {emp.pendingGoals} pending
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">Select an employee to view their pending goals</p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-6">
            <Card className="bg-[#2A2F3A] border-gray-800/50 hover:border-indigo-500/50 transition-all group">
              <CardHeader className="pb-2">
                <CardTitle className="text-gray-400 text-sm">Total Pending Goals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{goals.length}</div>
              </CardContent>
            </Card>
            <Card className="bg-[#2A2F3A] border-gray-800/50 hover:border-emerald-500/50 transition-all group">
              <CardHeader className="pb-2">
                <CardTitle className="text-gray-400 text-sm">Employees with Goals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{employeeStats.length}</div>
              </CardContent>
            </Card>
            <Card className="bg-[#2A2F3A] border-gray-800/50 hover:border-yellow-500/50 transition-all group">
              <CardHeader className="pb-2">
                <CardTitle className="text-gray-400 text-sm">Average Goals per Employee</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {employeeStats.length > 0
                    ? (goals.length / employeeStats.length).toFixed(1)
                    : '0.0'}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Goals Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
        </div>
      ) : filteredGoals.length === 0 ? (
        <Card className="bg-[#2A2F3A] border-gray-800/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="p-4 bg-gray-800/30 rounded-full mb-4">
              <BsPersonLinesFill className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No pending goals found</h3>
            <p className="text-gray-400">
              {selectedEmployee !== 'all'
                ? "This employee has no pending goals"
                : "There are no pending goals to approve"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGoals.map(goal => (
            <Card key={goal.id} className="bg-[#2A2F3A] border-gray-800/50 hover:border-indigo-500/50 transition-all">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-lg">
                      <BsPersonLinesFill className="w-5 h-5 text-indigo-400" />
                    </div>
                    <span className="text-white">{goal.User_Goal_employeeIdToUser.name}</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">{goal.title}</h3>
                  <p className="text-gray-400">{goal.description}</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Due Date</span>
                    <span className="text-gray-400">{new Date(goal.dueDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Submitted</span>
                    <span className="text-gray-400">{new Date(goal.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {goal.managerComments && (
                  <div className="p-3 bg-gray-800/30 rounded-lg">
                    <p className="text-sm text-gray-400">{goal.managerComments}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => openActionModal(goal, 'approve')}
                    className="flex-1 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white"
                  >
                    <BsCheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => openActionModal(goal, 'reject')}
                    className="flex-1 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white"
                  >
                    <BsXCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Action Modal */}
      {selectedGoal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="bg-[#2A2F3A] border-gray-800/50 w-full max-w-lg">
            <CardHeader>
              <CardTitle className="text-white">{selectedGoal.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Comments</Label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add your comments here..."
                  className="bg-gray-800/30 border-gray-700 text-white"
                  rows={4}
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={closeActionModal}
                  disabled={isSubmitting}
                  className="bg-gray-800/30 hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={isSubmitting}
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  {isSubmitting ? 'Processing...' : 'Approve'}
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={isSubmitting}
                  className="bg-red-500 hover:bg-red-600"
                >
                  {isSubmitting ? 'Processing...' : 'Reject'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );

  return (
    <DashboardLayout type="manager">
      <div className="container mx-auto py-8 px-4">
        {content}
      </div>
    </DashboardLayout>
  );
} 
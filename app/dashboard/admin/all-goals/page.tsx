'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import GoalsTable from '@/app/components/shared/GoalsTable';
import GoalDetailModal from '@/app/components/shared/GoalDetailModal';
import LoadingComponent from '@/app/components/LoadingScreen';
import { Goal, User as UserType } from '@/app/components/shared/types';
import { BsBullseye, BsPeople, BsArrowLeft } from 'react-icons/bs';
import Link from 'next/link';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/app/components/ui/select';
import { motion } from 'framer-motion';

export default function AllGoalsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!session) {
      router.push('/login');
      return;
    }

    if (session.user?.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }

    fetchData();
  }, [session, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [goalsRes, usersRes] = await Promise.all([
        fetch('/api/goals'),
        fetch('/api/users'),
      ]);

      if (!goalsRes.ok || !usersRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const [goalsData, usersData] = await Promise.all([
        goalsRes.json(),
        usersRes.ok ? usersRes.json() : { users: [] },
      ]);

      setGoals(goalsData.goals || []);
      setUsers(usersData.users || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredGoals = goals.filter(goal => {
    const matchesUser = selectedUser === 'all' || goal.employee?.id === selectedUser;
    const matchesStatus = selectedStatus === 'all' || goal.status === selectedStatus;
    const matchesSearch = 
      !searchQuery ||
      goal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      goal.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      goal.employee?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      goal.manager?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesUser && matchesStatus && matchesSearch;
  });

  if (loading) {
    return <LoadingComponent />;
  }

  return (
    <DashboardLayout type="admin">
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-emerald-600/20 to-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 p-4 lg:p-6 space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  href="/dashboard/admin"
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <BsArrowLeft className="w-5 h-5 text-gray-300 hover:text-white" />
                </Link>
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <BsBullseye className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">All Users Goals</h1>
                  <p className="text-sm text-gray-400">View and manage goals across all users</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">{filteredGoals.length}</div>
                <div className="text-sm text-gray-400">Total Goals</div>
              </div>
            </div>
          </motion.div>

          {/* Filters Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6 shadow-2xl"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* User Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Filter by User
                </label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger className="w-full bg-gray-800/50 border-white/10 text-white">
                    <SelectValue placeholder="Select User">
                      {selectedUser === 'all' ? (
                        <div className="flex items-center gap-2">
                          <BsPeople className="w-4 h-4" />
                          <span>All Users</span>
                        </div>
                      ) : (
                        users.find(u => u.id === selectedUser)?.name || 'Select User'
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-white/10">
                    <SelectItem value="all" className="text-white focus:bg-gray-700">
                      <div className="flex items-center gap-2">
                        <BsPeople className="w-4 h-4" />
                        <span>All Users</span>
                      </div>
                    </SelectItem>
                    {users.filter(u => u.role !== 'ADMIN').map((user) => (
                      <SelectItem key={user.id} value={user.id} className="text-white focus:bg-gray-700">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-xs text-white">
                            {user.name.charAt(0)}
                          </div>
                          <span>{user.name}</span>
                          <span className="text-xs text-gray-400">({user.role})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Filter by Status
                </label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-full bg-gray-800/50 border-white/10 text-white">
                    <SelectValue placeholder="Select Status">
                      {selectedStatus === 'all' ? 'All Statuses' : selectedStatus}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-white/10">
                    <SelectItem value="all" className="text-white focus:bg-gray-700">All Statuses</SelectItem>
                    <SelectItem value="PENDING" className="text-white focus:bg-gray-700">Pending</SelectItem>
                    <SelectItem value="APPROVED" className="text-white focus:bg-gray-700">Approved</SelectItem>
                    <SelectItem value="REJECTED" className="text-white focus:bg-gray-700">Rejected</SelectItem>
                    <SelectItem value="COMPLETED" className="text-white focus:bg-gray-700">Completed</SelectItem>
                    <SelectItem value="DRAFT" className="text-white focus:bg-gray-700">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Search Goals
                </label>
                <input
                  type="text"
                  placeholder="Search by title, description, or user..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800/50 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
            </div>
          </motion.div>

          {/* Goals Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl shadow-2xl overflow-hidden"
          >
            <GoalsTable
              goals={filteredGoals}
              searchQuery={searchQuery}
              selectedStatus={selectedStatus === 'all' ? '' : selectedStatus}
              onSearchChange={setSearchQuery}
              onStatusChange={(status) => setSelectedStatus(status === '' ? 'all' : status)}
              onGoalClick={(goal) => setSelectedGoal(goal)}
              showEmployee={true}
              showManager={true}
            />
          </motion.div>
        </div>
      </div>

      {/* Goal Detail Modal */}
      {selectedGoal && (
        <GoalDetailModal
          goal={selectedGoal}
          onClose={() => setSelectedGoal(null)}
        />
      )}
    </DashboardLayout>
  );
}


export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string | null;
  position: string | null;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  status: 'PENDING' | 'COMPLETED' | 'APPROVED' | 'REJECTED' | 'MODIFIED' | 'DRAFT';
  dueDate: string;
  category: string;
  createdAt: string;
  employee: {
    id: string;
    name: string;
    email: string;
  } | null;
  manager: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface GoalStats {
  totalGoals: number;
  completedGoals: number;
  pendingGoals: number;
  inProgressGoals: number;
  totalEmployees: number;
  totalManagers: number;
  draftGoals: number;
}

export interface StatsData {
  stats: {
    total: number;
    completed: number;
    pending: number;
    inProgress: number;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
  }>;
} 
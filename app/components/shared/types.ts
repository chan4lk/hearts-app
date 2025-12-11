import { Role } from '.prisma/client';


export interface UserManager {
  id: string;
  name: string;
  email: string;
  role: Role;
}
export interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string | null;
  position: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  manager?: UserManager | null;
  employees?: User[];
  createdAt: string;
  lastLogin?: string;
}

export type ProgressStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'ON_HOLD' | 'BLOCKED' | 'COMPLETED';

export interface Goal {
  id: string;

  title: string;
  description: string;
  status: 'PENDING' | 'COMPLETED' | 'APPROVED' | 'REJECTED' | 'MODIFIED' | 'DRAFT' | 'DELETED' | 'IN_PROGRESS' | 'NOT_STARTED' | 'ON_HOLD' | 'BLOCKED';
  dueDate: string;
  category: string;
  department: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  progress?: number;
  progressStatus?: ProgressStatus;
  progressNotes?: string | null;
  lastProgressUpdate?: string | null;
  employeeId: string;
  managerId: string;
  isApprovalProcess: boolean;
  approvalProcessId?: string;

  reviewedAt?: string;



  managerComments?: string | null;
  employeeComment?: string | null;

  employee: {
    id: string;
    name: string;
    email: string;
  } | null;
  manager?: {
    id: string;
    name: string;
    email: string;
  } | null;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  updatedBy?: {
    id: string;
    name: string;
    email: string;
  };
  rating?: Rating | null;
}
export interface EmployeeStats {
  id: string;
  name: string;
  email: string;
  role?: Role;
  totalGoals: number;
  pendingGoals: number;
  approvedGoals: number;
  ratedGoals: number;
  rejectedGoals: number;
  isActive: boolean;
}
export interface StatusStyle {
  bg: string;
  text: string;
  icon: React.ReactNode;
  gradient: string;
}

export interface DashboardStats {
  employeeGoals: {
    total: number;
    draft: number;
    pending: number;
    approved: number;
    rejected: number;
    modified: number;
    completed: number;
  };
  employeeCount: number;
  activeEmployees: number;
} 
 export interface NewGoal {
  title: string;
  description: string;
  category: string;
  dueDate: string;
  department?: string;
  priority?: string;
} 

export interface Rating {
  id: string;
  goalId: string;
  // Self rating
  selfScore?: number | null;
  selfComments?: string | null;
  selfRatedById?: string | null;
  selfRatedAt?: Date | string | null;
  // Manager rating
  managerScore?: number | null;
  managerComments?: string | null;
  managerRatedById?: string | null;
  managerRatedAt?: Date | string | null;
  // Legacy compatibility (mapped from selfScore)
  score?: number;
  comments?: string;
  updatedAt?: Date | string;
  createdAt?: Date | string;
}
export interface GoalWithRating {
  id: string;
  title: string;
  description: string;
  status: string;
  dueDate: string;
  createdAt: string;
  category: string;
  rating?: Rating | null;
}


export interface GoalStats {
  totalGoals: number;
  total: number;
  completedGoals: number;
  completed: number;
  modified: number;
  pendingGoals: number;
  pending: number;
  approved: number;
  rejected: number;
  achievementScore: number;
  inProgressGoals: number;
  totalEmployees: number;
  totalManagers: number;
  approvedGoals: number;
  rejectedGoals: number;
  draftGoals: number;
  categoryStats: {
    [key: string]: number;
  };
}

export interface GoalFormData {
  title: string;
  description: string;
  dueDate: string;
  employeeId: string;
  category: string;
  department: string;
  priority: string;
} 

export interface Stats {
  total: number;
  rated: number;
  average: string;
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

export interface FormData {
  name: string;
  email: string;
  password?: string;
  newPassword?: string;
  confirmPassword?: string;
  role: Role;
  managerId: string;
  status: 'ACTIVE' | 'INACTIVE';
}
export interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface Filters {
  role: string;
  manager: string;
  status: string;
}
export interface GoalWithRatingExtended {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  dueDate: string;
  managerId: string;
  employeeId: string;
  approvedAt?: Date | null;
  approvedBy?: string | null;
  rejectedAt?: Date | null;
  rejectedBy?: string | null;
  managerComments?: string | null;
  category: string;
  department: string;
  priority: string;
  isApprovalProcess: boolean;
  createdById?: string | null;
  deletedAt?: Date | null;
  deletedById?: string | null;
  updatedById?: string | null;
  status: 'PENDING' | 'COMPLETED' | 'APPROVED' | 'REJECTED' | 'MODIFIED' | 'DRAFT' | 'DELETED' | 'IN_PROGRESS' | 'NOT_STARTED' | 'ON_HOLD' | 'BLOCKED';
  rating?: Rating | null;
  employee: {
    id: string;
    name: string;
    email: string;
  } | null;
  manager?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export type ViewMode = 'grid' | 'list';
export type FilterStatus = 'all' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
export type RatingStatus = 'all' | 'rated' | 'unrated';
export type FilterRating = 'all' | '1' | '2' | '3' | '4' | '5'; 
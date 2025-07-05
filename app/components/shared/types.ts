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

export interface Goal {
  id: string;
  
  title: string;
  description: string;
  status: 'PENDING' | 'COMPLETED' | 'APPROVED' | 'REJECTED' | 'MODIFIED' | 'DRAFT'| 'DELETED';
  dueDate: string;
  category: string;
  department: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  progress?: number;
  employeeId: string;
  managerId: string;
  isApprovalProcess: boolean;
  approvalProcessId?: string;

  reviewedAt?: string;



  managerComments?: string;
  employeeComment?: string;

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
} 

export interface Rating {
  id: string;
  score: number;
  comments: string;
  updatedAt?: Date;
  goalId: string;
}
export interface GoalWithRating {
  id: string;
  title: string;
  description: string;
  status: string;
  dueDate: string;
  createdAt: string;
  category: string;
  rating?: {
    id: string;
    score: number;
    comments?: string;
  };
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
export interface GoalWithRating {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  dueDate: string;
  managerId?: string | null;
  employeeId: string;
  approvedAt?: Date | null;
  approvedBy?: string | null;
  rejectedAt?: Date | null;
  rejectedBy?: string | null;
  managerComments?: string | null;
  category: string;
  createdById?: string | null;
  deletedAt?: Date | null;
  deletedById?: string | null;
  updatedById?: string | null;
  status: string;
  rating?: {
    id: string;
    score: number;
    comments?: string;
  };
  employee: {
    id: string;
    name: string;
    email: string;
  };
}

export type ViewMode = 'grid' | 'list';
export type FilterStatus = 'all' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
export type RatingStatus = 'all' | 'rated' | 'unrated';
export type FilterRating = 'all' | '1' | '2' | '3' | '4' | '5'; 
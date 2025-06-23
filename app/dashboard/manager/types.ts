export type GoalStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'MODIFIED' | 'COMPLETED' | 'DELETED';

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  employee: Employee;
  title: string;
  description: string;
  dueDate: string;
  status: GoalStatus;
  createdAt: string;
  updatedAt: string;
  isApprovalProcess: boolean;
  approvalProcessId?: string;
  managerId?: string;
  managerComments?: string;
  reviewedAt?: string;
}

export interface EmployeeStats {
  id: string;
  name: string;
  email: string;
  totalGoals: number;
  pendingGoals: number;
  approvedGoals: number;
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
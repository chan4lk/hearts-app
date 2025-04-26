export type GoalStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'MODIFIED' | 'COMPLETED' | 'DELETED';

export interface Goal {
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

export interface EmployeeStats {
  id: string;
  name: string;
  email: string;
  goalsCount: number;
}

export interface StatusStyle {
  bg: string;
  text: string;
  icon: JSX.Element;
  gradient?: string;
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
  personalGoals: {
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
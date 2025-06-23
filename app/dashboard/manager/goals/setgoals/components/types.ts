export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  department?: string;
  position?: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  status: 'PENDING' | 'COMPLETED' | 'APPROVED' | 'REJECTED' | 'MODIFIED' | 'DRAFT';
  dueDate: string;
  category: string;
  createdAt: string;
  updatedAt: string;
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
  totalEmployees: number;
  totalGoals: number;
  completedGoals: number;
  pendingGoals: number;
  draftGoals: number;
  approvedGoals: number;
  rejectedGoals: number;
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
} 
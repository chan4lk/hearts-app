export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  department?: string;
  position?: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'COMPLETED' | 'REJECTED';
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  employee?: User;
  manager?: User;
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
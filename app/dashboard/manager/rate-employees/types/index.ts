export interface GoalWithRating {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  dueDate: Date;
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

export interface EmployeeStats {
  id: string;
  name: string;
  totalGoals: number;
  ratedGoals: number;
}
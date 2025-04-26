import { GoalStatus } from '@prisma/client';

export interface Goal {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: GoalStatus;
  category: string;
  createdAt: string;
  updatedAt: string;
  managerComments?: string;
  employeeComment?: string;
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
}

export interface GoalStats {
  total: number;
  completed: number;
  modified: number;
  pending: number;
  approved: number;
  rejected: number;
  achievementScore: number;
} 
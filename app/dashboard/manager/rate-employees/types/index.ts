import { Goal } from "@prisma/client";

export interface GoalWithRating extends Goal {
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
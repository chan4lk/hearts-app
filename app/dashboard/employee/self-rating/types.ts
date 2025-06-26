export interface Goal {
  id: string;
  title: string;
  description: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'MODIFIED';
  createdAt: Date;
  updatedAt: Date;
  employeeId: string;
  managerId: string;
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

export interface Stats {
  total: number;
  rated: number;
  average: string;
}

export type ViewMode = 'grid' | 'list';
export type FilterStatus = 'all' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
export type RatingStatus = 'all' | 'rated' | 'unrated';
export type FilterRating = 'all' | '1' | '2' | '3' | '4' | '5'; 
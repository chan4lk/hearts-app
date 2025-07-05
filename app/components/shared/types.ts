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

// 360-Degree Feedback Types
export interface FeedbackCycle {
  id: string;
  name: string;
  description?: string;
  type: 'QUARTERLY' | 'ANNUAL' | 'PROJECT_BASED' | 'AD_HOC';
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  isActive: boolean;
  createdByUser?: User;
  feedbacks?: Feedback360[];
  competencies?: Competency[];
}

export interface Competency {
  id: string;
  name: string;
  description?: string;
  category: 'TECHNICAL' | 'LEADERSHIP' | 'SOFT_SKILLS' | 'BUSINESS' | 'INNOVATION' | 'COLLABORATION';
  weight: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  levels?: CompetencyLevel[];
  assessments?: CompetencyAssessment[];
}

export interface CompetencyLevel {
  id: string;
  competencyId: string;
  level: number; // 1-5 scale
  name: string; // "Beginner", "Intermediate", "Advanced", "Expert", "Master"
  description: string;
  examples: string[];
  createdAt: string;
  updatedAt: string;
  competency?: Competency;
}

export interface Feedback360 {
  id: string;
  cycleId: string;
  employeeId: string;
  reviewerId: string;
  reviewerType: 'SELF' | 'MANAGER' | 'PEER' | 'SUBORDINATE' | 'CLIENT' | 'STAKEHOLDER';
  isAnonymous: boolean;
  isCompleted: boolean;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
  cycle?: FeedbackCycle;
  employee?: User;
  reviewer?: User;
  competencyAssessments?: CompetencyAssessment[];
  comments?: FeedbackComment[];
}

export interface CompetencyAssessment {
  id: string;
  feedbackId: string;
  competencyId: string;
  levelId: string;
  rating: number; // 1-5 scale
  comments?: string;
  createdAt: string;
  updatedAt: string;
  feedback?: Feedback360;
  competency?: Competency;
  level?: CompetencyLevel;
}

export interface FeedbackComment {
  id: string;
  feedbackId: string;
  section: string; // "strengths", "improvements", "overall"
  content: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
  feedback?: Feedback360;
}

export interface Feedback360Summary {
  employeeId: string;
  cycleId: string;
  employee?: User;
  cycle?: FeedbackCycle;
  totalReviews: number;
  completedReviews: number;
  averageRating: number;
  competencyBreakdown: {
    competencyId: string;
    competencyName: string;
    averageRating: number;
    totalAssessments: number;
  }[];
  reviewerTypeBreakdown: {
    reviewerType: string;
    count: number;
    averageRating: number;
  }[];
  strengths: string[];
  improvements: string[];
  overallComments: string[];
}

export interface Feedback360FormData {
  cycleId: string;
  employeeId: string;
  reviewerId: string;
  reviewerType: 'SELF' | 'MANAGER' | 'PEER' | 'SUBORDINATE' | 'CLIENT' | 'STAKEHOLDER';
  isAnonymous: boolean;
  competencyAssessments: {
    competencyId: string;
    levelId: string;
    rating: number;
    comments?: string;
  }[];
  comments: {
    section: string;
    content: string;
    isPrivate: boolean;
  }[];
}

export interface Feedback360Stats {
  totalCycles: number;
  activeCycles: number;
  completedCycles: number;
  totalFeedbacks: number;
  completedFeedbacks: number;
  averageCompletionRate: number;
  averageRating: number;
  topCompetencies: {
    competencyId: string;
    competencyName: string;
    averageRating: number;
  }[];
  reviewerTypeDistribution: {
    reviewerType: string;
    count: number;
    percentage: number;
  }[];
}

// 360-Degree Feedback Results for Employee
export interface FeedbackResults {
  cycle: FeedbackCycle;
  feedbacks: Array<{
    id: string;
    cycleId: string;
    reviewerType: string;
    reviewer: {
      id: string;
      name: string;
      position?: string;
    } | null;
    competencyAssessments: Array<{
      competency: {
        id: string;
        name: string;
        category: string;
      };
      level: {
        id: string;
        name: string;
        level: number;
      };
      rating: number;
      comments?: string;
    }>;
    comments: Array<{
      section: string;
      content: string;
      isPrivate: boolean;
    }>;
    isAnonymous: boolean;
    submittedAt: string;
  }>;
}

// Manager Review Interface
export interface ManagerFeedbackReview {
  teamMember: {
    id: string;
    name: string;
    position?: string;
  };
  feedbacks: FeedbackResults['feedbacks'];
}

// Admin Cycle Management
export interface AdminCycleManagement {
  cycles: FeedbackCycle[];
} 
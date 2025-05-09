export interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  dueDate: string;
  status: 'PENDING' | 'COMPLETED' | 'APPROVED' | 'REJECTED' | 'MODIFIED' | 'DRAFT';
  createdAt: string;
  managerComments?: string;
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

export interface GoalFormData {
  title: string;
  description: string;
  dueDate: string;
  category: string;
}

export interface GoalTemplate {
  id: string;
  title: string;
  category: string;
  icon: string;
  description: string;
  subtitle: string;
  bgGradient: string;
}

export interface Category {
  value: string;
  label: string;
}

export interface Status {
  value: string;
  label: string;
} 
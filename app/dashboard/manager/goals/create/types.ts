export interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  dueDate: string;
  status: string;
  createdAt: string;
  managerComments?: string;
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
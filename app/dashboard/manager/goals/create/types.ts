import { ReactNode } from 'react';

export interface User {
  id: string;
  name: string;
  position: string;
  department: string;
}

export interface Category {
  value: string;
  label: string;
  icon: React.ElementType;
}

export interface GoalFormData {
  title: string;
  description: string;
  dueDate: string;
  employeeId: string;
  category: string;
}

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

export interface GoalTemplate {
  id: string;
  title: string;
  category: string;
  icon: string;
  description: string;
  subtitle: string;
  bgGradient: string;
}

export interface Status {
  value: string;
  label: string;
} 
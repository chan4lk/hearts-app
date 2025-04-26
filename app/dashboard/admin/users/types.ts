export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  manager?: {
    id: string;
    name: string;
    email: string;
  } | null;
  createdAt: string;
  lastLogin?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export const ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  EMPLOYEE: 'EMPLOYEE',
} as const;

export type Role = keyof typeof ROLES;

export interface FormData {
  name: string;
  email: string;
  password: string;
  newPassword: string;
  confirmPassword: string;
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
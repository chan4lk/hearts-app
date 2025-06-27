import { Role } from '@prisma/client';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: 'ACTIVE' | 'INACTIVE';
  manager?: User | null;
  employees?: User[];
  createdAt: string;
  lastLogin?: string;
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
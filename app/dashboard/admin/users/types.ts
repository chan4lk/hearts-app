import { Role } from '@prisma/client';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  manager?: {
    id: string;
    name: string;
    email: string;
  } | null;
  employees?: {
    id: string;
    name: string;
    email: string;
  }[];
  createdAt: string;
  lastLogin?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

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
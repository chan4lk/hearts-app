export interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  status: 'PENDING' | 'MODIFIED' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  dueDate: string;
  managerComments?: string;
  isApprovalProcess: boolean;
  approvalProcessId?: string;
  managerId?: string;
  employee: Employee;
  category: string;
  employeeComments?: string;
}

export interface EmployeeStats {
  id: string;
  name: string;
  email: string;
  totalGoals: number;
  pendingGoals: number;
  approvedGoals: number;
  rejectedGoals: number;
  isActive: boolean;
}
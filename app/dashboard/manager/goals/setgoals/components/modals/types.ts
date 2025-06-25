export interface Employee {
  id: string;
  name: string;
  email: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'COMPLETED' | 'REJECTED';
  dueDate: string;
  employee?: Employee;
} 
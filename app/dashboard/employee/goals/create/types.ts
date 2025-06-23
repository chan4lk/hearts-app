export interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  progress?: number;
  managerComments?: string;
  employee?: {
    id: string;
    name: string;
    email: string;
  };
  manager?: {
    id: string;
    name: string;
    email: string;
  };
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

export interface NewGoal {
  title: string;
  description: string;
  category: string;
  dueDate: string;
} 
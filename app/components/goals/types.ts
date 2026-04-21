export interface Goal {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  status: string;
  progress: number;
  targetDate: string | null;
  ownerId: string;
  assignerId: string | null;
  owner: { id: string; name: string; department: string | null; managerId?: string | null };
  assigner: { id: string; name: string } | null;
  _count: { comments: number };
  updatedAt: string;
}

export type FlashKind = 'success' | 'error';
export type FlashFn = (type: FlashKind, msg: string) => void;

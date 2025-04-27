'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BsPeople, BsCalendar, BsEye, BsPencil, BsTrash } from 'react-icons/bs';
import { Goal } from './types';
import { CATEGORIES } from './constants';

interface GoalCardProps {
  goal: Goal;
  onView: (goal: Goal) => void;
  onEdit: (goal: Goal) => void;
  onDelete: (goalId: string) => void;
}

export function GoalCard({ goal, onView, onEdit, onDelete }: GoalCardProps) {
  return (
    <Card className="bg-[#1E2028] border-gray-800 hover:shadow-lg transition-shadow group">
      <CardHeader>
        <CardTitle className="text-white">{goal.title}</CardTitle>
        <CardDescription>
          <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 mr-2">
            {goal.category}
          </Badge>
          <Badge 
            variant={goal.status === 'DRAFT' ? 'outline' : 'default'}
            className={goal.status === 'DRAFT' ? 'bg-gray-500/10 text-gray-400 border-gray-500/20' : ''}
          >
            {goal.status}
          </Badge>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-300 mb-4">{goal.description}</p>
        <div className="space-y-2 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <BsPeople className="w-4 h-4 text-blue-400" />
            <span>{goal.employee?.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <BsCalendar className="w-4 h-4 text-amber-400" />
            <span>{new Date(goal.dueDate).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView(goal)}
            className="text-blue-400 hover:text-blue-300"
          >
            <BsEye className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(goal)}
            className="text-amber-400 hover:text-amber-300"
          >
            <BsPencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(goal.id)}
            className="text-rose-400 hover:text-rose-300"
          >
            <BsTrash className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 
import { Goal } from '../types';
import { getStatusBadge } from '../constants';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { User, Calendar } from 'lucide-react';
import { BsRocket, BsLightbulb, BsAward, BsGraphUp, BsBriefcase, BsEye, BsPencil, BsTrash } from 'react-icons/bs';

interface GoalCardProps {
  goal: Goal;
  onView: (goal: Goal) => void;
  onEdit: (goal: Goal) => void;
  onDelete: (goalId: string) => void;
}

export function GoalCard({ goal, onView, onEdit, onDelete }: GoalCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow bg-[#1E2028] border-gray-800 relative group">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
      <CardHeader className="relative">
        <CardTitle className="flex flex-col gap-2 text-white min-h-[56px]">
          <div className="flex items-start gap-3 w-full">
            <div className="flex-shrink-0 pt-1">
              {goal.category === 'PROFESSIONAL' && <BsRocket className="h-5 w-5 text-blue-400" />}
              {goal.category === 'TECHNICAL' && <BsLightbulb className="h-5 w-5 text-amber-400" />}
              {goal.category === 'LEADERSHIP' && <BsAward className="h-5 w-5 text-purple-400" />}
              {goal.category === 'PERSONAL' && <BsGraphUp className="h-5 w-5 text-emerald-400" />}
              {goal.category === 'TRAINING' && <BsBriefcase className="h-5 w-5 text-rose-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-semibold text-lg leading-tight block mb-1">{goal.title}</span>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <Badge 
                  variant="outline" 
                  className="border-gray-700 text-gray-300 bg-gray-800/50 text-xs"
                >
                  {goal.category}
                </Badge>
                <Badge 
                  variant={getStatusBadge(goal.status)} 
                  className={`text-xs ${
                    goal.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-400' :
                    goal.status === 'COMPLETED' ? 'bg-green-500/10 text-green-400' :
                    goal.status === 'APPROVED' ? 'bg-blue-500/10 text-blue-400' :
                    goal.status === 'REJECTED' ? 'bg-red-500/10 text-red-400' :
                    goal.status === 'DRAFT' ? 'bg-gray-500/10 text-gray-400 border border-gray-700' :
                    'bg-gray-500/10 text-gray-400'
                  }`}
                >
                  {goal.status}
                </Badge>
              </div>
            </div>
            <div className="flex items-start gap-2 ml-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onView(goal);
                }}
                className="text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors"
                title="View Goal"
              >
                <BsEye className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(goal);
                }}
                className="text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors"
                title="Edit Goal"
              >
                <BsPencil className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(goal.id);
                }}
                className="text-gray-400 hover:text-red-400 hover:bg-red-900/30 transition-colors"
                title="Delete Goal"
              >
                <BsTrash className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-300 line-clamp-2 mb-4 text-left">{goal.description}</p>
        <div className="space-y-2 bg-gray-900/30 p-3 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <User className="h-5 w-5 text-gray-400 flex-shrink-0" />
            <span className="truncate">Assigned to: <span className="text-white font-medium">{goal.employee?.name}</span></span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <Calendar className="h-5 w-5 text-gray-400 flex-shrink-0" />
            <span>Due: <span className="text-white font-medium">{new Date(goal.dueDate).toLocaleDateString()}</span></span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 
import { Goal } from './types';
import { getStatusBadge, CATEGORIES } from './constants';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { User, Calendar } from 'lucide-react';
import { BsEye, BsPencil, BsTrash } from 'react-icons/bs';

interface GoalCardProps {
  goal: Goal;
  onView: (goal: Goal) => void;
  onEdit: (goal: Goal) => void;
  onDelete: (goalId: string) => void;
}

export function GoalCard({ goal, onView, onEdit, onDelete }: GoalCardProps) {
  const category = CATEGORIES.find(c => c.value === goal.category);
  const IconComponent = category?.icon;

  const getStatusColor = () => {
    switch (goal.status) {
      case 'PENDING': return 'bg-yellow-500/5 border-yellow-500/20 text-yellow-400';
      case 'COMPLETED': return 'bg-green-500/5 border-green-500/20 text-green-400';
      case 'APPROVED': return 'bg-blue-500/5 border-blue-500/20 text-blue-400';
      case 'REJECTED': return 'bg-red-500/5 border-red-500/20 text-red-400';
      case 'DRAFT': return 'bg-gray-500/5 border-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/5 border-gray-500/20 text-gray-400';
    }
  };

  return (
    <Card className="group relative overflow-hidden bg-gradient-to-b from-gray-900/80 to-gray-800/80 border-gray-800/50 hover:border-gray-700/50 transition-all duration-300">
      {/* Hover Gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
      
      <div className="p-3">
        {/* Header Section */}
        <div className="flex items-start gap-2">
          <div className="flex-shrink-0 p-1.5 rounded bg-gray-800/50 border border-gray-700/30">
            {IconComponent && <IconComponent className={`h-4 w-4 ${category?.iconColor}`} />}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-200 leading-tight truncate mb-1">
              {goal.title}
            </h3>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant="outline" className={`px-1.5 py-0.5 text-[10px] font-medium ${getStatusColor()}`}>
                {goal.status}
              </Badge>
              <span className="text-[10px] text-gray-500">•</span>
              <span className="text-[10px] text-gray-400">{category?.label || goal.category}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onView(goal);
              }}
              className="h-7 w-7 text-gray-400 hover:text-white hover:bg-white/5"
            >
              <BsEye className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(goal);
              }}
              className="h-7 w-7 text-gray-400 hover:text-white hover:bg-white/5"
            >
              <BsPencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(goal.id);
              }}
              className="h-7 w-7 text-gray-400 hover:text-red-400 hover:bg-red-500/10"
            >
              <BsTrash className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-400 line-clamp-2 mt-2 mb-3">{goal.description}</p>

        {/* Footer Info */}
        <div className="flex items-center gap-3 text-[10px] text-gray-400 bg-black/20 rounded-lg p-2">
          <div className="flex items-center gap-1.5">
            <User className="h-3 w-3" />
            <span className="truncate">{goal.employee?.name}</span>
          </div>
          <div className="w-px h-3 bg-gray-700" />
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3" />
            <span>{new Date(goal.dueDate).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </Card>
  );
} 
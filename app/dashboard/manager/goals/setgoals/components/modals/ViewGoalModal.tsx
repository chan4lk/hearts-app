'use client';

import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { BsEye, BsPencil, BsCalendar, BsListTask, BsTrash } from 'react-icons/bs';
import { User, Calendar } from 'lucide-react';
import { Goal } from '../types';
import { CATEGORIES } from '@/app/components/shared/constants';
import { Dialog, DialogContent } from "@/app/components/ui/dialog";

interface ViewGoalModalProps {
  isOpen: boolean;
  onCloseAction: () => void;
  goal: Goal | null;
  onEditAction: () => void;
  onDeleteAction?: (goalId: string) => void;
}

export function ViewGoalModal({
  isOpen,
  onCloseAction: onClose,
  goal,
  onEditAction: onEdit,
  onDeleteAction: onDelete
}: ViewGoalModalProps) {
  if (!isOpen || !goal) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a1b1e] text-white border-gray-800/50 p-0 gap-0 max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800/50 bg-black/20">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 p-1.5 rounded-lg">
              <BsListTask className="w-3 h-3 text-blue-400" />
            </div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs font-medium text-white/90">Goal Details</h2>
              <Badge 
                variant="outline"
                className={`text-[10px] px-1.5 py-0.5 ${
                  goal.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                  goal.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                  goal.status === 'DRAFT' ? 'bg-gray-500/10 text-gray-400 border-gray-500/20' :
                  goal.status === 'APPROVED' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                  'bg-rose-500/10 text-rose-400 border-rose-500/20'
                }`}
              >
                {goal.status}
              </Badge>
            </div>
          </div>
        </div>

        <div className="p-3 space-y-2">
          {/* Title and Category */}
          <div className="bg-black/20 rounded-lg p-2">
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-xs font-medium text-white/90 truncate">{goal.title}</h3>
                <p className="text-[11px] text-white/50 line-clamp-2 mt-0.5 leading-relaxed">{goal.description}</p>
              </div>
              <Badge variant="outline" className="shrink-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-400 border-blue-500/20 text-[10px] px-1.5 whitespace-nowrap">
                {CATEGORIES.find(c => c.value === goal.category)?.label || goal.category}
              </Badge>
            </div>
          </div>

          {/* Meta Information */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-black/20 rounded-lg p-2">
              <div className="flex items-center gap-2">
                <div className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 p-1 rounded-md">
                  <User className="w-3 h-3 text-blue-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-white/90 truncate">{goal.employee?.name}</p>
                  <p className="text-[10px] text-white/50 truncate">{goal.employee?.email}</p>
                </div>
              </div>
            </div>

            <div className="bg-black/20 rounded-lg p-2">
              <div className="flex items-center gap-2">
                <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 p-1 rounded-md">
                  <BsCalendar className="w-3 h-3 text-amber-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-white/50">Due Date</p>
                  <p className="text-[11px] font-medium text-white/90 truncate">
                    {new Date(goal.dueDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-800/50 p-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="h-8 px-3 text-xs bg-transparent hover:bg-gray-800/50 border-gray-700/50 text-white/60 hover:text-white/90"
            >
              Cancel
            </Button>
            {onDelete && (
              <Button
                variant="outline"
                onClick={() => onDelete(goal.id)}
                className="h-8 px-3 text-xs bg-gradient-to-r from-red-500/10 to-red-600/10 hover:from-red-500/20 hover:to-red-600/20 
                  border-red-500/30 text-red-400 hover:text-red-300 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <BsTrash className="w-3 h-3 mr-1.5" />
                Delete
              </Button>
            )}
            
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 
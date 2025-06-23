'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BsEye, BsX, BsPencil, BsCalendar, BsListTask } from 'react-icons/bs';
import { User } from 'lucide-react';
import { Goal } from '../types';
import { CATEGORIES } from '../constants';

interface ViewGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: Goal | null;
  onEdit: () => void;
}

export function ViewGoalModal({
  isOpen,
  onClose,
  goal,
  onEdit
}: ViewGoalModalProps) {
  if (!isOpen || !goal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 bg-gradient-to-br from-[#1a1b1e] to-[#2a2b2e] w-full max-w-md shadow-2xl border border-gray-800/50 rounded-xl overflow-hidden">
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
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white/70 transition-colors"
          >
            <BsX className="h-4 w-4" />
          </button>
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
          <div className="flex justify-end gap-1.5 pt-2 border-t border-gray-800/50">
            <Button
              variant="outline"
              onClick={onClose}
              className="h-6 px-2 text-[10px] bg-transparent hover:bg-gray-800/50 border-gray-700/50 text-white/60 hover:text-white/90"
            >
              Close
            </Button>
            <Button
              variant="outline"
              onClick={onEdit}
              className="h-6 px-2 text-[10px] bg-gradient-to-r from-[#4c49ed]/10 to-[#6366f1]/10 hover:from-[#4c49ed]/20 hover:to-[#6366f1]/20 border-indigo-500/30 text-indigo-400"
            >
              <BsPencil className="w-2.5 h-2.5 mr-1" />
              Edit
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 
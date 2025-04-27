'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BsEye, BsX, BsPencil } from 'react-icons/bs';
import { User, Calendar } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 bg-[#1E2028] border border-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/10 p-2 rounded-lg">
              <BsEye className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-xl font-bold text-white">View Goal Details</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <BsX className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-[#2d2f36] rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-2">{goal.title}</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                {CATEGORIES.find(c => c.value === goal.category)?.label || goal.category}
              </Badge>
              <Badge 
                variant="outline"
                className={`
                  ${goal.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : ''}
                  ${goal.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : ''}
                  ${goal.status === 'DRAFT' ? 'bg-gray-500/10 text-gray-400 border-gray-500/20' : ''}
                  ${goal.status === 'APPROVED' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : ''}
                  ${goal.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : ''}
                `}
              >
                {goal.status}
              </Badge>
            </div>
          </div>

          <div className="bg-[#2d2f36] rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-400 mb-2">Description</h4>
            <p className="text-gray-300 whitespace-pre-wrap">{goal.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#2d2f36] rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Assigned To</h4>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-400" />
                <div>
                  <p className="text-gray-300">{goal.employee?.name}</p>
                  <p className="text-sm text-gray-500">{goal.employee?.email}</p>
                </div>
              </div>
            </div>

            <div className="bg-[#2d2f36] rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Due Date</h4>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                <p className="text-gray-300">
                  {new Date(goal.dueDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
            <Button
              variant="outline"
              onClick={onClose}
              className="bg-transparent hover:bg-gray-800 border-gray-700 text-gray-300"
            >
              Close
            </Button>
            <Button
              variant="outline"
              onClick={onEdit}
              className="bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30 text-blue-400"
            >
              <BsPencil className="w-4 h-4 mr-2" />
              Edit Goal
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 
import { Goal } from './types';
import { getStatusBadge } from './constants';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BsRocket, BsLightbulb, BsAward, BsGraphUp, BsBriefcase, BsListTask, BsX, BsPencil, BsTrash } from 'react-icons/bs';
import { User, Calendar } from 'lucide-react';

interface GoalModalProps {
  goal: Goal;
  onClose: () => void;
  onEdit: (goal: Goal) => void;
  onDelete: (goalId: string) => void;
}

export function GoalModal({ goal, onClose, onEdit, onDelete }: GoalModalProps) {
  return (
    <div className="bg-[#1E2028] rounded-lg p-6 w-full max-w-2xl mx-4 border border-gray-800 shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          {goal.category === 'PROFESSIONAL' && <BsRocket className="h-7 w-7 text-blue-400" />}
          {goal.category === 'TECHNICAL' && <BsLightbulb className="h-7 w-7 text-amber-400" />}
          {goal.category === 'LEADERSHIP' && <BsAward className="h-7 w-7 text-purple-400" />}
          {goal.category === 'PERSONAL' && <BsGraphUp className="h-7 w-7 text-emerald-400" />}
          {goal.category === 'TRAINING' && <BsBriefcase className="h-7 w-7 text-rose-400" />}
          <h2 className="text-2xl font-bold text-white">{goal.title}</h2>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-800 rounded-lg"
        >
          <BsX className="h-6 w-6" />
        </button>
      </div>
      
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Badge 
            variant="outline" 
            className="border-gray-700 text-gray-300 bg-gray-800/50 text-sm"
          >
            {goal.category}
          </Badge>
          <Badge 
            variant={getStatusBadge(goal.status)}
            className={`text-sm ${
              goal.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-400' :
              goal.status === 'COMPLETED' ? 'bg-green-500/10 text-green-400' :
              goal.status === 'APPROVED' ? 'bg-blue-500/10 text-blue-400' :
              goal.status === 'REJECTED' ? 'bg-red-500/10 text-red-400' :
              goal.status === 'DRAFT' ? 'bg-gray-500/10 text-gray-400' :
              'bg-gray-500/10 text-gray-400'
            }`}
          >
            {goal.status}
          </Badge>
        </div>

        <div className="bg-gray-900/30 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
            <BsListTask className="h-4 w-4 text-gray-400" />
            Description
          </h3>
          <p className="text-gray-100 leading-relaxed">{goal.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-900/30 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <User className="h-4 w-4 text-gray-400" />
              <h3 className="text-sm font-medium text-gray-300">Assigned To</h3>
            </div>
            <p className="text-white font-medium">{goal.employee?.name}</p>
            <p className="text-sm text-gray-400">{goal.employee?.email}</p>
          </div>
          <div className="bg-gray-900/30 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-gray-400" />
              <h3 className="text-sm font-medium text-gray-300">Due Date</h3>
            </div>
            <p className="text-white font-medium">
              {new Date(goal.dueDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-6">
          <Button
            variant="outline"
            onClick={() => {
              onClose();
              onEdit(goal);
            }}
            className="bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            <BsPencil className="h-4 w-4 mr-2" />
            Edit Goal
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onClose();
              onDelete(goal.id);
            }}
            className="bg-red-900/20 text-red-400 hover:bg-red-900/40"
          >
            <BsTrash className="h-4 w-4 mr-2" />
            Delete Goal
          </Button>
        </div>
      </div>
    </div>
  );
} 
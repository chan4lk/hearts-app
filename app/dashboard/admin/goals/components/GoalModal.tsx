import { Goal } from '../types';
import { getStatusBadge } from '../constants';
import { Badge } from '@/components/ui/badge';
import { BsRocket, BsLightbulb, BsAward, BsGraphUp, BsBriefcase, BsListTask, BsX, BsStars } from 'react-icons/bs';
import { User, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

interface GoalModalProps {
  goal: Goal;
  onClose: () => void;
  onEdit: (goal: Goal) => void;
  onDelete: (goalId: string) => void;
}

export function GoalModal({ goal, onClose }: GoalModalProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-[#1E2028] rounded-lg overflow-hidden w-full max-w-xl border border-gray-800/50 shadow-xl"
    >
      {/* Header */}
      <div className="bg-[#4a5681]/90 px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-[#c3935a]">
            {goal.category === 'PROFESSIONAL' && <BsRocket className="h-3 w-3 text-white" />}
            {goal.category === 'TECHNICAL' && <BsLightbulb className="h-3 w-3 text-white" />}
            {goal.category === 'LEADERSHIP' && <BsAward className="h-3 w-3 text-white" />}
            {goal.category === 'PERSONAL' && <BsGraphUp className="h-3 w-3 text-white" />}
            {goal.category === 'TRAINING' && <BsBriefcase className="h-3 w-3 text-white" />}
          </div>
          <h2 className="text-xs font-medium text-white tracking-wide truncate">{goal.title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            variant={getStatusBadge(goal.status)}
            className={`text-[10px] px-1.5 py-0.5 ${
              goal.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
              goal.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
              goal.status === 'APPROVED' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
              goal.status === 'REJECTED' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
              'bg-gray-500/10 text-gray-400 border-gray-500/20'
            }`}
          >
            <div className="flex items-center gap-1">
              <BsStars className="h-2 w-2" />
              <span>{goal.status}</span>
            </div>
          </Badge>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-800/30 rounded-md"
          >
            <BsX className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-3 space-y-2">
        {/* Description */}
        <div className="bg-[#1e1f23] rounded-md p-2">
          <div className="flex items-center gap-1.5 mb-1">
            <BsListTask className="h-2.5 w-2.5 text-gray-400" />
            <h3 className="text-[10px] font-medium text-gray-300 uppercase tracking-wide">Description</h3>
          </div>
          <p className="text-[11px] text-gray-100 leading-relaxed">{goal.description}</p>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#1e1f23] rounded-md p-2">
            <div className="flex items-center gap-1.5 mb-1">
              <User className="h-2.5 w-2.5 text-gray-400" />
              <h3 className="text-[10px] font-medium text-gray-300 uppercase tracking-wide">Assigned To</h3>
            </div>
            <div>
              <p className="text-[11px] text-white font-medium truncate">{goal.employee?.name}</p>
              <p className="text-[10px] text-gray-400 truncate">{goal.employee?.email}</p>
            </div>
          </div>
          <div className="bg-[#1e1f23] rounded-md p-2">
            <div className="flex items-center gap-1.5 mb-1">
              <Calendar className="h-2.5 w-2.5 text-gray-400" />
              <h3 className="text-[10px] font-medium text-gray-300 uppercase tracking-wide">Due Date</h3>
            </div>
            <p className="text-[11px] text-white font-medium">
              {new Date(goal.dueDate).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
} 
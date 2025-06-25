import { Goal } from '../types';
import { CATEGORIES } from '@/app/components/shared/constants';
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

  const getCategoryIcon = () => {
    const category = CATEGORIES.find(c => c.value === goal.category);
    if (!category) return null;
    const IconComponent = category.icon;
    return <IconComponent className={`h-4 w-4 ${category.iconColor}`} />;
  };

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
            {getCategoryIcon()}
          </div>
          <h2 className="text-xs font-medium text-white tracking-wide truncate">{goal.title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`px-2 py-0.5 text-xs font-medium ${getStatusColor()}`}>
            {goal.status}
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
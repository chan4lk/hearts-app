import { BsCheckCircle } from 'react-icons/bs';
import { Goal } from '@/app/components/shared/types';
import { getStatusStyle } from '../utils';
import { motion } from 'framer-motion';
import { CATEGORIES } from '@/app/components/shared/constants';

interface GoalsGridProps {
  goals: Goal[];
  onGoalClick: (goal: Goal) => void;
}

export default function GoalsGrid({ goals, onGoalClick }: GoalsGridProps) {
  if (goals.length === 0) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700/50 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gray-700/50 mb-4">
          <BsCheckCircle className="w-6 h-6 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">No goals found</h3>
        <p className="text-gray-400 text-sm">
          There are no employee goals to review at this time.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
      {goals.map((goal) => {
        const categoryConfig = CATEGORIES.find(c => c.value === goal.category) || CATEGORIES[0];
        const Icon = categoryConfig.icon;
        
        return (
          <motion.button
            key={goal.id}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onGoalClick(goal)}
            className="group relative overflow-hidden w-full text-left h-[200px]"
          >
            <div className={`relative h-full p-4 rounded-xl backdrop-blur-xl border border-white/10 transition-all duration-300
              ${categoryConfig.bgColor} ${categoryConfig.bgGradient}
              hover:shadow-2xl hover:shadow-purple-500/10`}
            >
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl transform translate-x-16 -translate-y-16" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-3xl transform -translate-x-16 translate-y-16" />
              
              <div className="relative h-full flex flex-col">
                {/* Header */}
                <div className="flex items-start gap-3 mb-2">
                  <div className={`p-2 rounded-lg ${categoryConfig.iconColor} bg-opacity-20 backdrop-blur-xl
                    ring-1 ring-white/20 shadow-lg transform transition-transform duration-300
                    group-hover:scale-110 group-hover:rotate-[10deg] flex-shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-white group-hover:text-transparent 
                      group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400
                      transition-all duration-300 truncate">{goal.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400 truncate">
                        {goal.employee?.name}
                      </span>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(goal.status).bg} ${getStatusStyle(goal.status).text} flex items-center gap-1 flex-shrink-0`}>
                    {getStatusStyle(goal.status).icon}
                    <span>{goal.status.charAt(0) + goal.status.slice(1).toLowerCase()}</span>
                  </span>
                </div>

                {/* Description */}
                <p className="text-gray-400 text-sm leading-relaxed line-clamp-2 mb-auto">{goal.description}</p>

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-white/10 mt-2">
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <span>Due: {goal.dueDate ? new Date(goal.dueDate).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <span>Created: {goal.createdAt ? new Date(goal.createdAt).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hover Effects */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500
                bg-gradient-to-t from-purple-950/30 via-transparent to-transparent" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500
                bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)]" />
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
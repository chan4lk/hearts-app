import { BsPlus, BsRocket, BsLightning } from 'react-icons/bs';
import { motion } from 'framer-motion';

interface GoalCreationSectionProps {
  onCreate: () => void;
}

export function GoalCreationSection({ onCreate }: GoalCreationSectionProps) {
  return (
    <div className="relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/5 via-purple-600/5 to-indigo-600/5" />
      <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl transform translate-x-16 -translate-y-16" />
      
      <div className="relative p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 p-2 rounded-lg bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-white/5">
            <BsRocket className="h-4 w-4 text-indigo-400" />
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-gray-200">Create New Goal</h2>
              <span className="px-1.5 py-0.5 text-[10px] font-medium bg-indigo-500/10 text-indigo-400 rounded">
                Admin
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">Set and assign goals to team members</p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onCreate}
          className="group relative flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 
            rounded-lg text-white text-xs font-medium hover:shadow-lg hover:shadow-indigo-500/20 
            transition-all duration-300 overflow-hidden"
        >
          {/* Button Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 
            translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          
          <div className="relative flex items-center gap-1.5">
            <div className="relative">
              <BsPlus className="w-4 h-4" />
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute inset-0 bg-white/30 blur-lg rounded-full"
              />
            </div>
            <span>Quick Create</span>
            <BsLightning className="w-3 h-3 text-yellow-300" />
          </div>
        </motion.button>
      </div>
    </div>
  );
} 
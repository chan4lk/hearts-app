import { BsPlus, BsSpeedometer, BsArrowRight } from 'react-icons/bs';
import { motion } from 'framer-motion';

interface GoalCreationSectionProps {
  onCreate: () => void;
}

export function GoalCreationSection({ onCreate }: GoalCreationSectionProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-lg border border-indigo-500/10"
    >
      {/* Minimal Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/5 to-purple-600/5" />
      
      <div className="relative flex items-center justify-between p-2 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="p-1.5 rounded-md bg-gradient-to-br from-indigo-500/10 to-purple-500/10">
              <BsSpeedometer className="h-3.5 w-3.5 text-indigo-400" />
            </div>
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.2, 0.1, 0.2],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-0 rounded-md border border-indigo-500/20"
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs font-medium text-gray-200 truncate">Quick Goal Creation</h2>
              <span className="shrink-0 px-1 py-px text-[10px] font-medium bg-indigo-500/10 
                text-indigo-400 rounded">
                Admin
              </span>
            </div>
            <p className="text-[10px] text-gray-400 truncate">Create and assign goals to your team</p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={onCreate}
          className="group shrink-0 flex items-center gap-1.5 px-2 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 
            rounded-md text-white text-[10px] font-medium overflow-hidden ml-2"
        >
          <div className="relative">
            <BsPlus className="w-3.5 h-3.5" />
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-0 bg-white/20 blur-[2px] rounded-full"
            />
          </div>
          <span>Create</span>
          <BsArrowRight className="w-2.5 h-2.5 transform group-hover:translate-x-0.5 transition-transform" />
        </motion.button>
      </div>
    </motion.div>
  );
} 
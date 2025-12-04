import { motion } from 'framer-motion';
import { BsPlus, BsStack } from 'react-icons/bs';

interface HeroSectionProps {
  onCreateClick: () => void;
  onBulkCreateClick: () => void;
}

export function HeroSection({ onCreateClick, onBulkCreateClick }: HeroSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-lg p-4 shadow-lg"
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Manage Team Goals
            <span className="inline-flex animate-bounce">✨</span>
          </h2>
          <p className="text-purple-100 text-xs">Create and assign goals for your team members</p>
        </div>
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onCreateClick}
            className="bg-gray-500/20 hover:bg-white/30 backdrop-blur-sm rounded-lg px-3 py-2 text-sm font-medium text-white flex items-center gap-1.5 transition-colors"
          >
            <BsPlus className="w-4 h-4" />
            Create Goal
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBulkCreateClick}
            className="bg-gray-500/20 hover:bg-white/30 backdrop-blur-sm rounded-lg px-3 py-2 text-sm font-medium text-white flex items-center gap-1.5 transition-colors"
          >
            <BsStack className="w-4 h-4" />
            Bulk Create Goals
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

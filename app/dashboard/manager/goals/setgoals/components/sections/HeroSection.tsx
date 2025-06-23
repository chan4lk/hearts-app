import { motion } from 'framer-motion';
import { BsPlus, BsBarChart, BsStars } from 'react-icons/bs';
import { colors } from '../styles/colors';

interface HeroSectionProps {
  onCreateClick: () => void;
}

export function HeroSection({ onCreateClick }: HeroSectionProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      <div className={`bg-gradient-to-br from-indigo-900/40 to-purple-900/40 backdrop-blur-xl rounded-2xl p-6 text-white shadow-lg border border-white/10 overflow-hidden`}>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl -ml-24 -mb-24" />
        
        <div className="relative z-10 flex items-center justify-between gap-6">
          {/* Left side - Title and subtitle */}
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 p-3 rounded-xl">
              <BsStars className="w-6 h-6 text-indigo-300" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
                Manage Goals
              </h1>
              <p className="text-sm text-indigo-200/80">Create and track employee objectives</p>
            </div>
          </div>

          {/* Right side - Action buttons */}
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onCreateClick}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg px-4 py-2 text-sm font-medium flex items-center gap-1.5 hover:opacity-90 transition-opacity"
            >
              <BsPlus className="text-lg" />
              Create
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white/10 rounded-lg px-4 py-2 text-sm font-medium flex items-center gap-1.5 hover:bg-white/15 transition-colors"
            >
              <BsBarChart className="text-base" />
              Stats
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
} 
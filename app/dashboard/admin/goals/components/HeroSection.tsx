'use client';

import { motion } from 'framer-motion';
import { BsBullseye, BsGear } from 'react-icons/bs';

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
      <div className="bg-gradient-to-r from-indigo-600/80 to-purple-600/80 backdrop-blur-sm rounded-xl p-4 text-white shadow-lg border border-white/10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
              <BsBullseye className="text-base text-white/90" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-semibold text-white/90">Goal Management</h1>
              <p className="text-xs text-indigo-100/70">Set, track, and manage team objectives</p>
            </div>
          </div>
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onCreateClick}
              className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 hover:bg-white/20 transition-all duration-200"
            >
              <BsBullseye className="text-sm" />
              Create Goal
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 hover:bg-white/20 transition-all duration-200"
            >
              <BsGear className="text-sm" />
              Settings
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
} 
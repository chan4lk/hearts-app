'use client';

import { motion } from 'framer-motion';
import { BsGear } from 'react-icons/bs';

export default function HeroSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 15 }}
      className="relative"
    >
      <div className="bg-gradient-to-r from-indigo-600/90 to-purple-600/90 backdrop-blur-sm rounded-lg p-3 text-white shadow-sm border border-white/10">
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-white/10 rounded-md">
              <BsGear className="text-lg" />
            </div>
            <div>
              <h1 className="text-xl font-bold mb-0.5 bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
                System Settings
              </h1>
              <p className="text-xs text-indigo-100/80">Configure your application preferences</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
} 
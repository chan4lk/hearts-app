'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface StandardCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function StandardCard({ children, className = '', hover = true }: StandardCardProps) {
  return (
    <motion.div
      whileHover={hover ? { scale: 1.02, y: -2 } : undefined}
      className={`relative bg-surface-elevated backdrop-blur-xl rounded-xl p-6 border border-theme overflow-hidden ${className}`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full -mr-16 -mt-16" />
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}



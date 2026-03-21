'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface ChartCardProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export default function ChartCard({ title, description, children }: ChartCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-surface-elevated backdrop-blur-xl rounded-xl p-6 border border-theme shadow-xl hover:shadow-2xl transition-all duration-300"
    >
      <div className="mb-5">
        <h3 className="text-xl font-bold text-primary mb-1 flex items-center gap-2">
          {title}
        </h3>
        {description && (
          <p className="text-xs text-secondary">{description}</p>
        )}
      </div>
      <div className="relative">
        {children}
      </div>
    </motion.div>
  );
}

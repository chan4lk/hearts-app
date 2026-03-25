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
      className="group relative overflow-hidden bg-surface-elevated backdrop-blur-xl rounded-2xl p-6 border border-theme shadow-theme-md hover:shadow-theme-lg transition-all duration-300"
    >
      {/* Top accent gradient line */}
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-[rgb(var(--color-accent))] via-[rgb(var(--color-info))] to-[rgb(var(--color-success))] opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="mb-5">
        <h3 className="text-lg font-bold text-primary mb-1 flex items-center gap-2 tracking-tight">
          {title}
        </h3>
        {description && (
          <p className="text-xs text-secondary leading-relaxed">{description}</p>
        )}
      </div>
      <div className="relative">
        {children}
      </div>
    </motion.div>
  );
}

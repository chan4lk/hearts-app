'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { BsInbox } from 'react-icons/bs';
import { Button } from '@/app/components/ui/button';

interface EmptyStateProps {
  icon?: ReactNode;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export default function EmptyState({
  icon,
  title = 'No data found',
  description = 'There are no items to display.',
  actionLabel,
  onAction,
  className = '',
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center py-12 px-6 ${className}`}
    >
      <div className="rounded-full bg-surface-tertiary p-4 mb-4">
        {icon || <BsInbox className="w-8 h-8 text-tertiary" />}
      </div>
      <h3 className="section-heading mb-2">{title}</h3>
      <p className="text-sm text-secondary text-center max-w-md mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="focus-ring">
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}

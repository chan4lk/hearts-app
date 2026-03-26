'use client';

import { motion } from 'framer-motion';
import { BsExclamationTriangle } from 'react-icons/bs';
import { Button } from '@/app/components/ui/button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export default function ErrorState({
  title = 'Something went wrong',
  message = 'An error occurred while loading data. Please try again.',
  onRetry,
  className = '',
}: ErrorStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center py-12 px-6 ${className}`}
    >
      <div className="rounded-full bg-error-muted p-4 mb-4">
        <BsExclamationTriangle className="w-8 h-8 text-error" />
      </div>
      <h3 className="text-lg font-semibold text-primary mb-2">{title}</h3>
      <p className="text-sm text-secondary text-center max-w-md mb-6">{message}</p>
      {onRetry && (
        <Button
          variant="outline"
          onClick={onRetry}
          className="focus-ring"
        >
          Try Again
        </Button>
      )}
    </motion.div>
  );
}

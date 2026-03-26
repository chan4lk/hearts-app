'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StatusBadge } from '@/app/components/shared/feedback';
import { BsCheckCircle } from 'react-icons/bs';

interface StatusOption {
  value: string;
  label: string;
}

interface StatusPopoverProps {
  currentStatus: string;
  options: StatusOption[];
  onStatusChange: (newStatus: string) => void;
  disabled?: boolean;
  type?: 'status' | 'priority';
}

export default function StatusPopover({
  currentStatus,
  options,
  onStatusChange,
  disabled = false,
  type = 'status',
}: StatusPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`transition-opacity ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'}`}
      >
        <StatusBadge type={type} value={currentStatus} size="sm" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full mt-1 z-50 min-w-[160px] bg-surface-elevated border border-theme rounded-xl shadow-theme-lg overflow-hidden"
          >
            {options.map((option) => {
              const isActive = option.value === currentStatus;
              return (
                <button
                  key={option.value}
                  onClick={() => {
                    if (!isActive) onStatusChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-between w-full px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? 'bg-accent-muted text-accent font-medium'
                      : 'text-primary hover:bg-surface-secondary'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <StatusBadge type={type} value={option.value} size="sm" showIcon={false} />
                  </span>
                  {isActive && <BsCheckCircle className="w-3.5 h-3.5 text-accent" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

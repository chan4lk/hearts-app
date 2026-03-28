'use client';

import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { IconType } from 'react-icons';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  icon?: ReactNode;
  maxWidth?: string;
  children: ReactNode;
}

export default function Modal({ open, onClose, title, icon, maxWidth = 'max-w-md', children }: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-backdrop"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`modal-panel ${maxWidth} max-h-[85vh] overflow-y-auto`}
          >
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-primary flex items-center gap-2">
                {icon}
                {title}
              </h2>
              <button
                onClick={onClose}
                className="text-secondary hover:text-primary focus-ring rounded-lg p-1"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

'use client';

import { Button } from '@/app/components/ui/button';
import { BsExclamationTriangle } from 'react-icons/bs';
import { motion, AnimatePresence } from 'framer-motion';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete Goal',
  message = 'Are you sure you want to delete this goal? This action cannot be undone.',
  confirmText = 'Delete',
  cancelText = 'Cancel'
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative z-10 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border border-rose-500/20 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl"
          >
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="bg-gradient-to-br from-rose-500/20 to-rose-600/20 p-3 rounded-xl border border-rose-500/30">
                <BsExclamationTriangle className="w-6 h-6 text-rose-400" />
              </div>
              
              {/* Content */}
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-primary mb-2">
                  {title}
                </h3>
                <p className="text-secondary text-sm leading-relaxed">
                  {message}
                </p>
                
                {/* Buttons */}
                <div className="flex justify-end gap-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="bg-transparent border-gray-700 hover:bg-gray-700/50 text-gray-300 hover:text-white transition-all"
                  >
                    {cancelText}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      onConfirm();
                      onClose();
                    }}
                    className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white shadow-lg shadow-rose-500/20 transition-all"
                  >
                    {confirmText}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}


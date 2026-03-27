'use client';

import { useState } from 'react';
import { BsExclamationTriangle } from 'react-icons/bs';
import { ModalShell, FORM_STYLES } from '@/app/components/ui/form-primitives';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
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
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    if (isDeleting) return; // Prevent double-clicks
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ModalShell
      open={isOpen}
      onClose={isDeleting ? () => {} : onClose}
      title={title}
      icon={<BsExclamationTriangle className="w-4 h-4" />}
      maxWidth="max-w-md"
      footer={
        <>
          <button type="button" onClick={onClose} disabled={isDeleting} className={FORM_STYLES.btnSecondary}>{cancelText}</button>
          <button type="button" onClick={handleConfirm} disabled={isDeleting} className={FORM_STYLES.btnDanger}>
            {isDeleting ? 'Deleting...' : confirmText}
          </button>
        </>
      }
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-error-muted flex items-center justify-center">
          <BsExclamationTriangle className="w-5 h-5 text-error" />
        </div>
        <p className="text-secondary text-sm leading-relaxed">{message}</p>
      </div>
    </ModalShell>
  );
}

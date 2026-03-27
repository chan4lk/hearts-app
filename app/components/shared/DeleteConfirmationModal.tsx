'use client';

import { BsExclamationTriangle } from 'react-icons/bs';
import { ModalShell, FORM_STYLES } from '@/app/components/ui/form-primitives';

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
  return (
    <ModalShell
      open={isOpen}
      onClose={onClose}
      title={title}
      icon={<BsExclamationTriangle className="w-4 h-4" />}
      maxWidth="max-w-md"
      footer={
        <>
          <button type="button" onClick={onClose} className={FORM_STYLES.btnSecondary}>{cancelText}</button>
          <button type="button" onClick={onConfirm} className={FORM_STYLES.btnDanger}>{confirmText}</button>
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

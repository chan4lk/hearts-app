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
          <button type="button" onClick={() => { onConfirm(); onClose(); }} className={FORM_STYLES.btnDanger}>{confirmText}</button>
        </>
      }
    >
      <p className="text-secondary text-[13px] leading-relaxed">{message}</p>
    </ModalShell>
  );
}

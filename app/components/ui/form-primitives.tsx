'use client';

import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BsX } from 'react-icons/bs';

// ─── Styles (single source of truth) ────────────────────────────
export const FORM_STYLES = {
  label: 'block text-[12px] font-medium text-secondary mb-1',
  input: 'w-full h-9 px-3 text-[13px] bg-surface-secondary border border-theme rounded-lg text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-colors',
  textarea: 'w-full px-3 py-2 text-[13px] bg-surface-secondary border border-theme rounded-lg text-primary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-colors resize-none',
  select: 'w-full h-9 px-3 text-[13px] bg-surface-secondary border border-theme rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-colors',
  btnPrimary: 'inline-flex items-center justify-center gap-1.5 h-9 px-4 text-[13px] font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
  btnSecondary: 'inline-flex items-center justify-center gap-1.5 h-9 px-4 text-[13px] font-medium rounded-lg bg-surface-secondary hover:bg-surface-tertiary border border-theme text-primary transition-colors cursor-pointer',
  btnDanger: 'inline-flex items-center justify-center gap-1.5 h-9 px-4 text-[13px] font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
} as const;

// ─── ModalShell ─────────────────────────────────────────────────
export function ModalShell({ open, onClose, title, icon, children, maxWidth = 'max-w-lg', footer }: {
  open: boolean;
  onClose: () => void;
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  maxWidth?: string;
  footer?: ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 modal-overlay" onClick={onClose} />

          {/* Content */}
          <motion.div
            className={`relative modal-content rounded-xl w-full ${maxWidth} shadow-2xl border border-theme flex flex-col max-h-[90vh] min-h-0`}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-theme shrink-0">
              <div className="flex items-center gap-2.5">
                {icon && (
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                    {icon}
                  </div>
                )}
                <h2 className="text-[14px] font-semibold text-primary">{title}</h2>
              </div>
              <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-tertiary hover:text-primary hover:bg-surface-secondary transition-colors cursor-pointer">
                <BsX className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-theme shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── FormField ──────────────────────────────────────────────────
export function FormField({ label, required, error, children }: {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className={FORM_STYLES.label}>
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}

// ─── FormActions ────────────────────────────────────────────────
export function FormActions({ onCancel, submitLabel = 'Save', loading, disabled, danger, formId }: {
  onCancel: () => void;
  submitLabel?: string;
  loading?: boolean;
  disabled?: boolean;
  danger?: boolean;
  formId?: string;
}) {
  return (
    <>
      <button type="button" onClick={onCancel} className={FORM_STYLES.btnSecondary}>Cancel</button>
      <button type="submit" form={formId} disabled={loading || disabled} className={danger ? FORM_STYLES.btnDanger : FORM_STYLES.btnPrimary}>
        {loading ? 'Saving...' : submitLabel}
      </button>
    </>
  );
}

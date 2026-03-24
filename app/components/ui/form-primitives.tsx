'use client';

import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BsX } from 'react-icons/bs';

// ─── Styles (single source of truth for ALL forms/modals) ────────
export const FORM_STYLES = {
  label: 'block text-xs font-semibold text-secondary mb-1.5 tracking-wide uppercase',
  input: 'w-full h-10 px-3 text-sm bg-surface-secondary border border-theme rounded-lg text-primary placeholder:text-tertiary focus-ring transition-colors',
  textarea: 'w-full px-3 py-2.5 text-sm bg-surface-secondary border border-theme rounded-lg text-primary placeholder:text-tertiary focus-ring transition-colors resize-none leading-relaxed',
  select: 'w-full h-10 px-3 text-sm bg-surface-secondary border border-theme rounded-lg text-primary focus-ring transition-colors',
  btnPrimary: 'inline-flex items-center justify-center gap-2 h-10 px-5 text-sm font-semibold rounded-lg bg-accent text-[rgb(var(--color-text-inverse))] hover:opacity-90 transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-ring',
  btnSecondary: 'inline-flex items-center justify-center gap-2 h-10 px-5 text-sm font-medium rounded-lg bg-surface-secondary hover:bg-surface-tertiary border border-theme text-primary transition-all duration-150 cursor-pointer focus-ring',
  btnDanger: 'inline-flex items-center justify-center gap-2 h-10 px-5 text-sm font-semibold rounded-lg bg-error-muted text-error hover:opacity-80 transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-ring',
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
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 modal-overlay" onClick={onClose} />

          {/* Content */}
          <motion.div
            className={`relative modal-content rounded-2xl w-full ${maxWidth} shadow-theme-xl border border-theme flex flex-col max-h-[90vh] min-h-0`}
            initial={{ scale: 0.96, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-theme shrink-0">
              <div className="flex items-center gap-3">
                {icon && (
                  <div className="w-9 h-9 rounded-xl bg-accent-muted flex items-center justify-center text-accent">
                    {icon}
                  </div>
                )}
                <h2 className="text-base font-semibold text-primary">{title}</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-tertiary hover:text-primary hover:bg-surface-secondary transition-colors cursor-pointer focus-ring"
                aria-label="Close"
              >
                <BsX className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-5 min-h-0">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-theme shrink-0 bg-surface-secondary/50">
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
    <div className="space-y-1.5">
      <label className={FORM_STYLES.label}>
        {label}{required && <span className="text-error ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-error mt-1">{error}</p>}
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
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Saving...
          </span>
        ) : submitLabel}
      </button>
    </>
  );
}

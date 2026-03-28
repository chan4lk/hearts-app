'use client';

import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react';

/* ── Label ── */
export function Label({ children, htmlFor, optional }: { children: ReactNode; htmlFor?: string; optional?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="input-label">
      {children} {optional && <span className="text-tertiary">(optional)</span>}
    </label>
  );
}

/* ── Text Input ── */
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  optional?: boolean;
  error?: string;
}

export function Input({ label, optional, error, className = '', ...props }: InputProps) {
  return (
    <div>
      {label && <Label htmlFor={props.id} optional={optional}>{label}</Label>}
      <input className={`input-base ${error ? 'border-[rgb(var(--color-error))]' : ''} ${className}`} {...props} />
      {error && <p className="text-xs text-error mt-1">{error}</p>}
    </div>
  );
}

/* ── Textarea ── */
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  optional?: boolean;
}

export function Textarea({ label, optional, className = '', ...props }: TextareaProps) {
  return (
    <div>
      {label && <Label optional={optional}>{label}</Label>}
      <textarea className={`input-textarea ${className}`} {...props} />
    </div>
  );
}

/* ── Select ── */
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  optional?: boolean;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function Select({ label, optional, options, placeholder, className = '', ...props }: SelectProps) {
  return (
    <div>
      {label && <Label optional={optional}>{label}</Label>}
      <select className={`input-select w-full ${className}`} {...props}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

/* ── Form Actions (Cancel + Submit buttons) ── */
export function FormActions({ onCancel, submitLabel = 'Save', loading = false, disabled = false }: {
  onCancel: () => void;
  submitLabel?: string;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-3 pt-2">
      <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
      <button type="submit" disabled={loading || disabled} className="btn-primary flex-1">
        {loading ? 'Saving...' : submitLabel}
      </button>
    </div>
  );
}

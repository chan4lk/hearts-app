'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BsCheckCircle, BsExclamationTriangle, BsInfoCircle, BsX } from 'react-icons/bs';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toast: {
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
    warning: (message: string) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const icons: Record<ToastType, typeof BsCheckCircle> = {
  success: BsCheckCircle,
  error: BsExclamationTriangle,
  info: BsInfoCircle,
  warning: BsExclamationTriangle,
};

const styles: Record<ToastType, string> = {
  success: 'border-l-[rgb(var(--color-success))] bg-success-muted text-success',
  error: 'border-l-[rgb(var(--color-error))] bg-error-muted text-error',
  info: 'border-l-[rgb(var(--color-info))] bg-info-muted text-info',
  warning: 'border-l-[rgb(var(--color-warning))] bg-warning-muted text-warning',
};

const durations: Record<ToastType, number> = {
  success: 3000,
  error: 6000,
  info: 4000,
  warning: 5000,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).slice(2);
    const duration = durations[type];
    setToasts(prev => [...prev.slice(-4), { id, type, message, duration }]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = {
    success: (msg: string) => addToast('success', msg),
    error: (msg: string) => addToast('error', msg),
    info: (msg: string) => addToast('info', msg),
    warning: (msg: string) => addToast('warning', msg),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => {
            const Icon = icons[t.type];
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 100, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className={`flex items-start gap-3 px-4 py-3 rounded-xl border-l-4 shadow-theme-lg pointer-events-auto ${styles[t.type]}`}
              >
                <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium flex-1 text-primary">{t.message}</p>
                <button
                  onClick={() => removeToast(t.id)}
                  className="text-secondary hover:text-primary flex-shrink-0"
                  aria-label="Dismiss"
                >
                  <BsX className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context.toast;
}

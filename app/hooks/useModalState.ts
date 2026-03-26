import { useState, useCallback } from 'react';

interface UseModalStateReturn<T = undefined> {
  isOpen: boolean;
  data: T | null;
  open: (data?: T) => void;
  close: () => void;
  toggle: () => void;
}

/**
 * Reusable modal state hook.
 * Manages open/close state + optional associated data (e.g., the item being edited/viewed).
 *
 * Usage:
 *   const deleteModal = useModalState<Goal>();
 *   deleteModal.open(selectedGoal);  // opens with data
 *   deleteModal.close();             // closes and clears data
 *   deleteModal.isOpen               // boolean
 *   deleteModal.data                 // Goal | null
 */
export function useModalState<T = undefined>(): UseModalStateReturn<T> {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<T | null>(null);

  const open = useCallback((modalData?: T) => {
    setData(modalData ?? null);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setData(null);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen(prev => {
      if (prev) setData(null);
      return !prev;
    });
  }, []);

  return { isOpen, data, open, close, toggle };
}

'use client';

import { useTheme } from '@/app/providers';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BsSun, BsMoon, BsLaptop } from 'react-icons/bs';

const options = [
  { value: 'light' as const, label: 'Light', icon: BsSun },
  { value: 'dark' as const, label: 'Dark', icon: BsMoon },
  { value: 'system' as const, label: 'System', icon: BsLaptop },
];

export default function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const CurrentIcon = resolvedTheme === 'dark' ? BsMoon : BsSun;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-surface-secondary hover:bg-surface-tertiary border border-theme transition-all duration-200 group"
        aria-label="Toggle theme"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={resolvedTheme}
            initial={{ scale: 0.5, opacity: 0, rotate: -90 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.5, opacity: 0, rotate: 90 }}
            transition={{ duration: 0.2 }}
          >
            <CurrentIcon className="w-4 h-4 text-secondary group-hover:text-primary transition-colors" />
          </motion.div>
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-36 rounded-xl bg-surface-elevated border border-theme shadow-theme-lg overflow-hidden z-50"
          >
            {options.map(({ value, label, icon: Icon }) => {
              const isActive = theme === value;
              return (
                <button
                  key={value}
                  onClick={() => {
                    setTheme(value);
                    setOpen(false);
                  }}
                  className={`flex items-center gap-2.5 w-full px-3 py-2.5 text-sm transition-colors duration-150 ${
                    isActive
                      ? 'text-accent bg-[rgba(var(--color-accent),0.08)] font-medium'
                      : 'text-secondary hover:text-primary hover:bg-surface-secondary'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent" />
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

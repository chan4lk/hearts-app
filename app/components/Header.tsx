'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/app/components/ui/ThemeToggle';
import { motion, AnimatePresence } from 'framer-motion';

const Header = ({ userName }: { userName?: string }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target;
      if (mobileMenuOpen && target instanceof HTMLElement && !target.closest('#mobile-menu') && !target.closest('#menu-button')) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileMenuOpen]);

  const navItems = ['Features', 'Integration', 'Security'];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-surface-header/70 backdrop-blur-2xl shadow-theme-sm border-b border-theme'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <div className="flex justify-between items-center h-16 sm:h-18">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <img
                src="/logo.png"
                alt="Bistec Global Logo"
                className="h-9 sm:h-10 w-auto object-contain transition-all duration-300 group-hover:scale-105"
              />
              <div className="absolute -inset-1 bg-accent/10 rounded-lg blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-bold text-primary tracking-tight leading-tight">
                AspireHub
              </span>
              <span className="text-2xs font-semibold text-accent tracking-widest uppercase leading-tight">
                Bistec Global
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {navItems.map((navItem) => (
              <a
                key={navItem}
                href={`#${navItem.toLowerCase()}`}
                className="relative px-4 py-2 text-xs font-medium text-secondary hover:text-primary transition-colors duration-200 rounded-lg group"
              >
                {navItem}
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-accent rounded-full group-hover:w-4 transition-all duration-300" />
              </a>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-[rgb(var(--color-text-inverse))] bg-accent rounded-xl shadow-sm shadow-[rgb(var(--color-accent))]/25 hover:shadow-lg hover:shadow-[rgb(var(--color-accent))]/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
            >
              <span>Sign in</span>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>

            {/* Mobile menu button */}
            <button
              id="menu-button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-2 rounded-lg text-secondary hover:text-primary hover:bg-surface-secondary transition-colors focus-ring"
              aria-label="Menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              id="mobile-menu"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="sm:hidden overflow-hidden"
            >
              <div className="pb-4 pt-2 border-t border-theme mt-1 space-y-1">
                {navItems.map((navItem) => (
                  <a
                    key={navItem}
                    href={`#${navItem.toLowerCase()}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2.5 text-sm font-medium text-secondary hover:text-primary rounded-lg hover:bg-surface-secondary transition-colors"
                  >
                    {navItem}
                  </a>
                ))}
                <div className="pt-2 mt-2 border-t border-theme">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full text-center px-4 py-2.5 text-sm font-semibold text-[rgb(var(--color-text-inverse))] bg-accent rounded-xl shadow-sm"
                  >
                    Sign in
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

export default Header;

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/app/components/ui/ThemeToggle';

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

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-surface-header/80 backdrop-blur-xl shadow-theme-sm border-b border-theme'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <img
              src="/logo.png"
              alt="Bistec Global Logo"
              className="h-9 sm:h-10 w-auto object-contain transition-all duration-300 group-hover:scale-105"
            />
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-bold text-primary tracking-tight leading-tight">
                AspireHub
              </span>
              <span className="text-2xs font-medium text-accent tracking-wide leading-tight">
                Bistec Global
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {['Features', 'Integration', 'Security'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="px-3.5 py-2 text-xs font-medium text-secondary hover:text-primary transition-colors duration-200 rounded-lg hover:bg-surface-secondary"
              >
                {item}
              </a>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 rounded-lg shadow-sm shadow-indigo-500/20 hover:shadow-md hover:shadow-indigo-500/25 transition-all duration-200"
            >
              Sign in
            </Link>

            {/* Mobile menu button */}
            <button
              id="menu-button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-2 rounded-lg text-secondary hover:text-primary hover:bg-surface-secondary transition-colors"
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
        {mobileMenuOpen && (
          <div id="mobile-menu" className="sm:hidden pb-4 pt-2 border-t border-theme mt-1 space-y-1">
            {['Features', 'Integration', 'Security'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 text-sm font-medium text-secondary hover:text-primary rounded-lg hover:bg-surface-secondary transition-colors"
              >
                {item}
              </a>
            ))}
            <div className="pt-2 mt-2 border-t border-theme">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-lg shadow-sm"
              >
                Sign in
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

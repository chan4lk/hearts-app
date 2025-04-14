'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

interface HeaderProps {
  userName?: string;
  children?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({ userName, children }) => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);
  
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (mobileMenuOpen && !target.closest('#mobile-menu') && !target.closest('#menu-button')) {
        setMobileMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileMenuOpen]);
  
  return (
    <header className="fixed top-0 left-0 right-0 bg-[#0f172a]/50 backdrop-blur-sm border-b border-indigo-500/20 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="group transform hover:scale-105 transition-transform duration-300">
              <Image 
                src="/logo.png" 
                alt="Bistec Logo" 
                width={120} 
                height={40}
                className="h-12 w-auto object-contain"
              />
            </Link>
            <Link href="/" className="group hidden sm:block">
              <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 group-hover:from-indigo-300 group-hover:via-purple-300 group-hover:to-pink-300 transition-all duration-300">
                Performance Management
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              href="/login"
              className="text-white bg-indigo-500 hover:bg-indigo-600 text-sm px-4 py-2 rounded-md transition-colors duration-300 flex items-center space-x-2"
            >
              <span>Log in</span>
              
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              id="menu-button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-400 hover:text-indigo-400 transition-colors duration-300 p-2 rounded-lg hover:bg-indigo-500/10"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div id="mobile-menu" className="md:hidden py-4 border-t border-indigo-500/20 absolute right-0 left-0 bg-[#0f172a]/90 backdrop-blur-sm">
            <nav className="flex flex-col space-y-4 px-4">
              {[
                { href: '/', label: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
                { href: '/login', label: 'Sign in', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' }
              ].map((link, index) => (
                <Link
                  key={index}
                  href={link.href}
                  className="text-gray-400 hover:text-indigo-400 transition-colors duration-300 flex items-center group px-4 py-2 rounded-lg hover:bg-indigo-500/10"
                >
                  <svg className="h-5 w-5 mr-3 text-indigo-400 group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={link.icon} />
                  </svg>
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
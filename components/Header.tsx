'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
    <>
      <div className="h-20"></div>
      <header className={`bg-[#1a1f2f] fixed top-0 left-0 right-0 w-full z-50 transition-all duration-300 ${
        scrolled ? 'py-2 shadow-lg' : 'py-4'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <div className="flex items-center">
              <Link href="/">
                <img
                  src="/logo.png"
                  alt="Bistec Logo"
                  className="h-12 w-auto object-contain"
                />
              </Link>
              <Link href="/" className="ml-3 group cursor-pointer">
                <span className="text-2xl font-bold text-white group-hover:text-[#4f46e5] transition-all duration-300">
                  Performance Management
                </span>
              </Link>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              href="/" 
              className={`flex items-center text-gray-300 hover:text-white transition-colors ${
                pathname === '/' ? 'text-white font-medium' : ''
              }`}
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="text-base">Home</span>
            </Link>
            <Link 
              href="/dashboard" 
              className={`flex items-center text-gray-300 hover:text-white transition-colors ${
                pathname?.includes('/dashboard') ? 'text-white font-medium' : ''
              }`}
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="text-base">Dashboard</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link 
                href="/profile" 
                className={`flex items-center text-gray-300 hover:text-white transition-colors ${
                  pathname?.includes('/profile') ? 'text-white font-medium' : ''
                }`}
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-base">{userName || 'Profile'}</span>
              </Link>
              {children}
            </div>
          </nav>
          
          <button
            id="menu-button"
            className="md:hidden p-2 rounded-lg text-gray-300 hover:text-white focus:outline-none"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
        
        <div 
          id="mobile-menu"
          className={`md:hidden bg-[#1e293b] shadow-lg ${mobileMenuOpen ? 'block' : 'hidden'}`}
        >
          <div className="px-4 pt-2 pb-3 space-y-1 sm:px-3">
            <Link 
              href="/" 
              className={`block py-2 px-3 rounded-md ${
                pathname === '/' ? 'bg-[#4f46e5] text-white' : 'text-gray-300 hover:bg-[#4f46e5] hover:text-white'
              }`}
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="text-base">Home</span>
              </div>
            </Link>
            <Link 
              href="/dashboard" 
              className={`block py-2 px-3 rounded-md ${
                pathname?.includes('/dashboard') ? 'bg-[#4f46e5] text-white' : 'text-gray-300 hover:bg-[#4f46e5] hover:text-white'
              }`}
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="text-base">Dashboard</span>
              </div>
            </Link>
            <div className="flex items-center py-2 px-3 rounded-md">
              <Link 
                href="/profile" 
                className={`flex items-center ${
                  pathname?.includes('/profile') ? 'bg-[#4f46e5] text-white' : 'text-gray-300 hover:bg-[#4f46e5] hover:text-white'
                }`}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-base">{userName || 'Profile'}</span>
              </Link>
              {children && <div className="ml-2">{children}</div>}
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
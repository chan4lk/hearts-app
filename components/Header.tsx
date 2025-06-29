'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Azure Logo with hover effect
const AzureLogo = ({ className = "" }) => (
  <div className={`relative ${className}`}>
    <svg 
      width="24" 
      height="24" 
      viewBox="0 0 20 20" 
      fill="currentColor" 
      xmlns="http://www.w3.org/2000/svg" 
      className="transform transition-transform duration-300 group-hover:scale-110"
    >
      <path d="M11.25 0.762695L5.86406 10.4354H14.1359L11.25 0.762695Z" />
      <path d="M5.42188 10.4354L0 19.2373H7.8125L12.9688 10.4354H5.42188Z" />
      <path d="M8.4375 19.2373H13.5938L11.25 14.881L8.4375 19.2373Z" />
      <path d="M14.0625 19.2373H20L13.2812 10.4354L11.25 14.881L14.0625 19.2373Z" />
    </svg>
    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 opacity-0 group-hover:opacity-20 rounded-full blur-lg transition-opacity duration-300"></div>
  </div>
);


const Header = ({ userName }: { userName?: string }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target;
      if (
        mobileMenuOpen &&
        target instanceof HTMLElement &&
        !target.closest('#mobile-menu') &&
        !target.closest('#menu-button')
      ) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileMenuOpen]);

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out 
        ${scrolled 
          ? 'bg-slate-900/90 backdrop-blur-xl shadow-2xl shadow-indigo-500/10 border-b border-indigo-500/30' 
          : 'bg-slate-900/60 backdrop-blur-md border-b border-white/10'
        }`}
      >
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(99, 102, 241, 0.1), transparent 40%)`
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <Link href="/" className="group relative flex items-center gap-2 sm:gap-3 transform hover:scale-105 transition-all duration-300">
              <div className="relative">
                <div className="absolute -inset-2 bg-gradient-to-r from-purple-600/20 via-indigo-600/20 to-pink-600/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:duration-200"></div>
                <div className="relative flex items-center">
                  <img
                    src="/logo.png"
                    alt="AspireHub Logo"
                    className="h-8 sm:h-10 w-auto object-contain transition-all duration-300"
                  />
                  {/* Decorative dot */}
                  <div className="absolute -right-1 -top-1 w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 animate-pulse"></div>
                </div>
              </div>
              <div className="flex flex-col relative">
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white group-hover:from-indigo-400 group-hover:via-purple-400 group-hover:to-pink-400 transition-all duration-300">
                    AspireHub
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-medium text-indigo-400/80 tracking-wider whitespace-nowrap py-0.5 px-1.5 rounded-full bg-indigo-500/5 border border-indigo-500/10">
                    Performance & Goals
                  </span>
                </div>
              </div>
            </Link>

            {/* Azure Login or User */}
            <div className="hidden md:flex items-center space-x-4">
              <Button 
                className="
                  group relative overflow-hidden
                  bg-gradient-to-r from-indigo-600 to-purple-600 
                  text-white font-medium px-6 py-2.5 rounded-full
                  transform hover:scale-105 transition-all duration-300
                  shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40
                "
              >
                <span className="relative z-10 flex items-center space-x-2">
                  <AzureLogo className="group" />
                  <Link href="/login"><span>Login with Azure</span></Link>
                </span>
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                id="menu-button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 sm:p-3 rounded-xl bg-white/10 backdrop-blur-sm text-gray-300 hover:text-white hover:bg-white/20 transition-all duration-300 group"
              >
                <div className="w-5 sm:w-6 h-5 sm:h-6 flex flex-col justify-center items-center">
                  <span className={`block h-0.5 w-5 sm:w-6 bg-current transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-0.5' : ''}`}></span>
                  <span className={`block h-0.5 w-5 sm:w-6 bg-current transition-all duration-300 mt-1 ${mobileMenuOpen ? 'opacity-0' : ''}`}></span>
                  <span className={`block h-0.5 w-5 sm:w-6 bg-current transition-all duration-300 mt-1 ${mobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
                </div>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div
              id="mobile-menu"
              className="md:hidden absolute top-full left-0 right-0 mt-1 mx-2 sm:mx-4 bg-slate-900/95 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/10 shadow-2xl shadow-indigo-500/10 overflow-hidden"
            >
              <div className="p-4 sm:p-6">
                <Button 
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium py-2.5 sm:py-3 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="flex items-center justify-center space-x-2">
                    <AzureLogo />
                    <Link href="/login"><span>Login with Azure</span></Link>
                  </span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  );
};

export default Header;

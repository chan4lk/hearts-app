import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#0f172a]/80 backdrop-blur-sm border-t border-indigo-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6 md:py-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
              <Link
                href="https://bistecglobal.com/privacy-policy"
                className="text-sm text-gray-400 hover:text-indigo-400 transition-all duration-300 hover:scale-105"
              >
                Privacy Policy
              </Link>
              <span className="text-gray-400 hidden md:inline">•</span>
              <Link
                href="https://bistecglobal.com/terms-of-service"
                className="text-sm text-gray-400 hover:text-indigo-400 transition-all duration-300 hover:scale-105"
              >
                Terms of Service
              </Link>
            </div>
            <p className="text-sm text-gray-400 text-center">
              © {new Date().getFullYear()} Performance Management System. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}


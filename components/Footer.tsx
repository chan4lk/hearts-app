import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#0f172a]/80 backdrop-blur-sm border-t border-indigo-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-2">
          <div className="flex flex-col items-center justify-center space-y-1">
            <div className="flex items-center space-x-4">
              <Link
                href="href: 'https://bistecglobal.com/privacy-policy"
                className="text-xs text-gray-400 hover:text-indigo-400 transition-colors duration-300"
              >
                Privacy Policy
              </Link>
              <span className="text-xs text-gray-400">•</span>
              <Link
                href="href: 'https://bistecglobal.com/privacy-policy"
                className="text-xs text-gray-400 hover:text-indigo-400 transition-colors duration-300"
              >
                Terms of Service
              </Link>
            </div>
            <p className="text-xs text-gray-400">
              © {new Date().getFullYear()} Performance Management System. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}


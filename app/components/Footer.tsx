import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-surface-primary border-t border-theme">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <img src="/logo.png" alt="Bistec Global" className="h-8 w-auto object-contain" />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-primary leading-tight">AspireHub</span>
                <span className="text-2xs font-medium text-accent leading-tight">Bistec Global</span>
              </div>
            </Link>
            <p className="text-xs text-secondary leading-relaxed max-w-[200px]">
              Performance management built for modern teams.
            </p>
          </div>

          {/* Links */}
          {[
            { title: 'Product', links: ['Features', 'Integration', 'Security', 'Changelog'] },
            { title: 'Company', links: ['About', 'Careers', 'Blog', 'Contact'] },
            { title: 'Legal', links: ['Privacy', 'Terms', 'Cookies'] },
          ].map(({ title, links }) => (
            <div key={title}>
              <h4 className="text-xs font-semibold text-tertiary uppercase tracking-wider mb-3">{title}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <Link href="#" className="text-xs text-secondary hover:text-primary transition-colors duration-200">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-6 border-t border-theme flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-tertiary">
            &copy; {new Date().getFullYear()} AspireHub by Bistec Global. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {['Twitter', 'LinkedIn', 'GitHub'].map((social) => (
              <a key={social} href="#" className="text-xs text-tertiary hover:text-secondary transition-colors duration-200">
                {social}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

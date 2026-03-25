import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-surface-primary border-t border-theme">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-14 sm:py-20">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-5 group">
              <img src="/logo.png" alt="Bistec Global" className="h-9 w-auto object-contain" />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-primary leading-tight">AspireHub</span>
                <span className="text-2xs font-semibold text-accent tracking-widest uppercase leading-tight">Bistec Global</span>
              </div>
            </Link>
            <p className="text-xs text-secondary leading-relaxed max-w-[220px] mb-5">
              Performance management built for modern teams that aspire to grow.
            </p>
            {/* Social links */}
            <div className="flex items-center gap-3">
              {['Twitter', 'LinkedIn', 'GitHub'].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="w-8 h-8 rounded-lg bg-surface-secondary hover:bg-surface-tertiary flex items-center justify-center text-tertiary hover:text-primary transition-all duration-200"
                >
                  <span className="text-2xs font-semibold">{social.charAt(0)}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {[
            { title: 'Product', links: ['Features', 'Integration', 'Security', 'Changelog'] },
            { title: 'Company', links: ['About', 'Careers', 'Blog', 'Contact'] },
            { title: 'Legal', links: ['Privacy', 'Terms', 'Cookies'] },
          ].map(({ title, links }) => (
            <div key={title}>
              <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <Link href="#" className="text-sm text-secondary hover:text-accent transition-colors duration-200">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-6 border-t border-theme flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-tertiary">
            &copy; {new Date().getFullYear()} AspireHub by Bistec Global. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--color-success))]" />
            <span className="text-2xs text-tertiary">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

function Footer() {
  return (
    <footer className="bg-[#0f172a]/50 backdrop-blur-sm border-t border-indigo-500/20 relative z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Company Info */}
          <div className="space-y-8">
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
              <Link href="/" className="group">
                <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 group-hover:from-indigo-300 group-hover:via-purple-300 group-hover:to-pink-300 transition-all duration-300">
                  Performance Management
                </span>
              </Link>
            </div>
            <p className="text-gray-400 text-base leading-relaxed">
              Streamline your performance management process with our comprehensive solution.
            </p>
            <div className="flex flex-wrap gap-6">
              {[
                { href: 'https://www.facebook.com/bistecglobal', icon: 'facebook' },
                { href: 'https://www.linkedin.com/company/bistecglobal', icon: 'linkedin' },
                { href: 'https://twitter.com/bistecglobal', icon: 'twitter' },
                { href: 'https://www.instagram.com/bistecglobal', icon: 'instagram' },
                { href: 'https://www.youtube.com/bistecglobal', icon: 'youtube' },
                { href: 'https://www.tiktok.com/@bistecglobal', icon: 'tiktok' }
              ].map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-indigo-400 transition-all duration-300 transform hover:scale-110 hover:rotate-6"
                >
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    {social.icon === 'facebook' && (
                      <path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2m13 2h-2.5A3.5 3.5 0 0 0 12 8.5V11h-2v3h2v7h3v-7h3v-3h-3V9a1 1 0 0 1 1-1h2V5z" />
                    )}
                    {social.icon === 'linkedin' && (
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    )}
                    {social.icon === 'twitter' && (
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                    )}
                    {social.icon === 'instagram' && (
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.012-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    )}
                    {social.icon === 'youtube' && (
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    )}
                    {social.icon === 'tiktok' && (
                      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                    )}
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-semibold mb-8 text-white border-b border-indigo-500/50 pb-2 inline-block">
              Quick Links
            </h3>
            <ul className="space-y-4">
              {[
                { href: '/dashboard', label: 'Dashboard' },
                { href: '/goals', label: 'Goals' },
                { href: '/feedback', label: 'Feedback' }
              ].map((link, index) => (
                <li key={index}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-indigo-400 transition-colors duration-300 text-base flex items-center group"
                  >
                    <span className="w-1.5 h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mr-3 transform group-hover:scale-150 transition-transform duration-300"></span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-xl font-semibold mb-8 text-white border-b border-indigo-500/50 pb-2 inline-block">
              Support
            </h3>
            <ul className="space-y-4">
              {[
                { href: 'https://bistecglobal.com/services/', label: 'Services' },
                { href: 'https://bistecglobalhelpdesk.freshservice.com/support/home', label: 'IT Support' },
                { href: 'https://bistecglobal.com/disclaimer/', label: 'Disclaimer' },
                { href: 'https://bistecglobal.com/privacy-policy/', label: 'Privacy Policy' }
              ].map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-indigo-400 transition-colors duration-300 text-base flex items-center group"
                  >
                    <span className="w-1.5 h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mr-3 transform group-hover:scale-150 transition-transform duration-300"></span>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-xl font-semibold mb-8 text-white border-b border-indigo-500/50 pb-2 inline-block">
              Contact Us
            </h3>
            <ul className="space-y-6 text-gray-400">
              <li className="flex items-start group hover:text-indigo-400 transition-colors duration-300">
                <svg className="h-6 w-6 mr-4 mt-1 flex-shrink-0 text-indigo-400 group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div className="text-base">
                  <p className="font-medium text-white group-hover:text-indigo-400 transition-colors duration-300">Colombo Office</p>
                  <p>No: 14, Sir Baron Jayathilake Mawatha,</p>
                  <p>Colombo 01, Sri Lanka</p>
                </div>
              </li>
              <li className="flex items-start group hover:text-indigo-400 transition-colors duration-300">
                <svg className="h-6 w-6 mr-4 mt-1 flex-shrink-0 text-indigo-400 group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-base">info@bistecglobal.com</span>
              </li>
              <li className="flex items-start group hover:text-indigo-400 transition-colors duration-300">
                <svg className="h-6 w-6 mr-4 mt-1 flex-shrink-0 text-indigo-400 group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="text-base">+94 74 064 5569</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-16 pt-8 border-t border-indigo-500/20">
          <p className="text-center text-gray-400 text-base">
            © {new Date().getFullYear()} Performance Management System. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
import React from 'react';
import Link from 'next/link';
import { Goal, Twitter, Linkedin, Github, Mail, ArrowUpRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="relative bg-gradient-to-b from-[#0B1120] via-[#132145] to-[#1E1B4B] overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:radial-gradient(ellipse_at_center,white,transparent)] opacity-10"></div>
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent"></div>
      
      <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 relative z-10">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12">
          {/* Brand Section */}
          <div className="md:col-span-1 text-center sm:text-left">
            <Link href="/" className="inline-flex sm:flex items-center gap-2 mb-4 group">
              <div className="relative transform group-hover:scale-105 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-sm group-hover:blur-md transition-all duration-300"></div>
                <div className="relative">
                  <img
                    src="/logo.png"
                    alt="AspireHub Logo"
                    className="h-12 w-auto object-contain transition-all duration-300"
                  />
                </div>
              </div>
              <span className="text-xl sm:text-2xl font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 transition-all duration-300">
                AspireHub
              </span>
            </Link>
            <p className="text-gray-400 text-sm max-w-xs mx-auto sm:mx-0">
              Elevating team performance through seamless goal management and innovative solutions.
            </p>
            
            {/* Social Links */}
            <div className="flex justify-center sm:justify-start items-center gap-3 mt-6">
              {[
                { icon: Twitter, color: "from-blue-400 to-blue-600" },
                { icon: Linkedin, color: "from-blue-500 to-blue-700" },
                { icon: Github, color: "from-gray-600 to-gray-800" },
                { icon: Mail, color: "from-purple-400 to-pink-500" }
              ].map(({ icon: Icon, color }, index) => (
                <a
                  key={index}
                  href="#"
                  className="group relative flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 transition-all duration-300 overflow-hidden"
                >
                  {/* Gradient Border */}
                  <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Animated Background */}
                  <div className={`absolute inset-[1px] rounded-full bg-gradient-to-br ${color} opacity-0 group-hover:opacity-100 transition-all duration-300 scale-0 group-hover:scale-100`}></div>
                  
                  {/* Icon Container */}
                  <div className="relative z-10 p-2.5">
                    <Icon className="w-full h-full text-gray-400 group-hover:text-white transition-colors duration-300" />
                  </div>
                  
                  {/* Glow Effect */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${color} blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-300 scale-150`}></div>
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links Sections */}
          <div className="text-center sm:text-left">
            <h3 className="font-semibold text-white mb-4 flex items-center justify-center sm:justify-start gap-2">
              Product
              <ArrowUpRight className="w-4 h-4 text-indigo-400" />
            </h3>
            <ul className="space-y-2">
              {['Features', 'Workflow', 'Integrations'].map((item) => (
                <li key={item}>
                  <Link 
                    href={`#${item.toLowerCase()}`} 
                    className="text-sm text-gray-400 hover:text-white transition-colors duration-300 inline-flex items-center gap-1 group"
                  >
                    {item}
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="text-center sm:text-left">
            <h3 className="font-semibold text-white mb-4 flex items-center justify-center sm:justify-start gap-2">
              Company
              <ArrowUpRight className="w-4 h-4 text-indigo-400" />
            </h3>
            <ul className="space-y-2">
              {['About Us', 'Careers', 'Contact'].map((item) => (
                <li key={item}>
                  <Link 
                    href="#" 
                    className="text-sm text-gray-400 hover:text-white transition-colors duration-300 inline-flex items-center gap-1 group"
                  >
                    {item}
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="text-center sm:text-left">
            <h3 className="font-semibold text-white mb-4 flex items-center justify-center sm:justify-start gap-2">
              Legal
              <ArrowUpRight className="w-4 h-4 text-indigo-400" />
            </h3>
            <ul className="space-y-2">
              {['Privacy Policy', 'Terms of Service'].map((item) => (
                <li key={item}>
                  <Link 
                    href="#" 
                    className="text-sm text-gray-400 hover:text-white transition-colors duration-300 inline-flex items-center gap-1 group"
                  >
                    {item}
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400 text-center sm:text-left">
              &copy; {new Date().getFullYear()} AspireHub by Bistecglobal. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link href="#" className="text-xs text-gray-400 hover:text-white transition-colors duration-300">
                Cookie Settings
              </Link>
              <Link href="#" className="text-xs text-gray-400 hover:text-white transition-colors duration-300">
                Sitemap
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}


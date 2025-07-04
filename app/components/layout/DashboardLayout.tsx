'use client';

import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { IconType } from 'react-icons';
import { hasAccess, getNavItemsByRole } from '@/app/utils/roleAccess';

import { 
  BsGrid1X2Fill as BsGrid, 
  BsBullseye,
  BsStar,
  BsChatDots as BsChat,
  BsBarChartLine as BsBarChart,
  BsPerson,
  BsGear,
  BsShieldFill as BsShield,
  BsGraphUpArrow as BsGraphUp,
  BsClipboardData,
  BsBell,
  BsPeople,
  BsChevronDown,
  BsBoxArrowRight,
  BsBuilding,
  BsSun,
  BsMoon,
  BsSearch,
  BsList,
  BsX
} from 'react-icons/bs';
import dynamic from 'next/dynamic';
import { useSettings } from '@/app/providers';

interface DashboardLayoutProps {
  children: ReactNode;
  type: 'employee' | 'manager' | 'admin';
}

interface Settings {
  systemName: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
}

interface NavItem {
  href: string;
  icon: IconType;
  label: string;
}

type Role = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

export default function DashboardLayout({ children, type }: DashboardLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname() || '';
  const { settings } = useSettings();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isPageTransitioning, setIsPageTransitioning] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Reset page transition state when pathname changes
  useEffect(() => {
    setIsPageTransitioning(false);
  }, [pathname]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getNavItems = (): NavItem[] => {
    const userRole = session?.user?.role;
    const currentContext = type; // Use the current dashboard type

    // Define navigation items for each role
    const adminItems: NavItem[] = [
      { href: '/dashboard/admin', label: 'Overview', icon: BsShield },
      { href: '/dashboard/admin/users', label: 'Manage Users', icon: BsPeople },
      { href: '/dashboard/admin/goals', label: 'Goal Settings', icon: BsGear },
    ];

    const managerItems: NavItem[] = [
      { href: '/dashboard/manager', label: 'Overview', icon: BsGraphUp },
      { href: '/dashboard/manager/goals/approve-goals', label: 'Goal Approvals', icon: BsClipboardData },
      { href: '/dashboard/manager/goals/setgoals', label: 'Set Team Goals', icon: BsBullseye },
      { href: '/dashboard/manager/rate-employees', label: 'Rate Team', icon: BsStar },
    ];

    const employeeItems: NavItem[] = [
      { href: '/dashboard/employee', label: 'Overview', icon: BsPerson },
      { href: '/dashboard/employee/goals/create', label: 'My Goals', icon: BsBullseye },
      { href: '/dashboard/employee/self-rating', label: 'Self Rating', icon: BsStar },
    ];

    // Return items based on current dashboard type
    switch (currentContext) {
      case 'admin':
        return adminItems;
      case 'manager':
        return managerItems;
      case 'employee':
        return employeeItems;
      default:
        return employeeItems;
    }
  };

  const hasAccessToDashboard = (): boolean => {
    const userRole = session?.user?.role as Role | undefined;
    const currentPath = pathname || '';
    // Admin has access to all dashboards
    if (userRole === 'ADMIN') {
      return true;
    }
    if (!userRole) return false;
    return hasAccess(userRole, currentPath);
  };

  // Update the useEffect to handle path changes
  useEffect(() => {
    if (status === 'authenticated' && !hasAccessToDashboard()) {
      const userRole = session?.user?.role;
      
      // For admin users, don't redirect at all
      if (userRole === 'ADMIN') {
        return;
      }
      
      // For other roles, redirect to their default dashboard if they don't have access
      let redirectPath = '/dashboard/employee';
      if (userRole === 'MANAGER') {
        redirectPath = '/dashboard/manager';
      }
      
      router.push(redirectPath);
    }
  }, [status, pathname, session]);

  const navItems = getNavItems();
  const portalTitle = type.charAt(0).toUpperCase() + type.slice(1) + ' Portal';

  // Function to check if current path matches exactly
  const isPathActive = (href: string) => {
    // Remove trailing slashes for consistent comparison
    const cleanPath = pathname.replace(/\/$/, '');
    const cleanHref = href.replace(/\/$/, '');
    // Only return true if paths match exactly
    return cleanPath === cleanHref;
  };

  const handleSignOut = async () => {
    try {
      await signOut({
        callbackUrl: '/login',
        redirect: true
      });
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1117]">
      {/* Sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            ref={sidebarRef}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed left-0 top-0 h-full w-64 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 z-30 md:hidden"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-14 h-14 rounded-full  flex items-center justify-center">
                  <Link href="/" className="group transform hover:scale-105 transition-transform duration-300">
              <Image 
                src="/logo.png" 
                alt="Bistec Logo" 
                width={120} 
                height={40}
                className="h-12 w-auto object-contain"
              />
            </Link>                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-white">
                      {settings.systemName}
                    </h1>
                    <p className="text-xs text-gray-400">{portalTitle}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-gray-400 hover:text-white"
                  aria-label="Close menu"
                >
                  <BsX className="w-6 h-6" />
                </button>
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const isActive = isPathActive(item.href);
                  return (
                    <motion.div
                      key={item.href}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Link
                        href={item.href}
                        onClick={() => {
                          setIsPageTransitioning(true);
                          // Add a small delay for visual feedback
                          setTimeout(() => {
                            setIsPageTransitioning(false);
                          }, 300);
                        }}
                        className={`group flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 relative overflow-hidden ${
                          isActive
                            ? 'bg-gradient-to-r from-purple-800 to-purple-900 text-white shadow-lg shadow-purple-900/30'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <span className="flex items-center space-x-3 relative z-10 w-full">
                          {/* Animated background hover effect */}
                          {!isActive && (
                            <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-900 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg transform group-hover:scale-105" />
                          )}
                          
                          {/* Active indicator with glow */}
                          {isActive && (
                            <>
                              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-purple-400 rounded-full shadow-[0_0_8px_rgba(167,139,250,0.5)]" />
                              <div className="absolute inset-0 bg-purple-500/5 rounded-lg backdrop-blur-sm" />
                            </>
                          )}
                          
                          {/* Icon with enhanced hover effect */}
                          <span className="relative z-10 transition-all duration-300 group-hover:scale-110 group-hover:translate-x-1">
                            <item.icon className={`text-xl ${
                              isActive 
                                ? 'transform rotate-0 drop-shadow-[0_0_3px_rgba(167,139,250,0.5)]' 
                                : 'group-hover:rotate-6 group-hover:text-purple-400'
                            } transition-all duration-300`} />
                          </span>
                          
                          {/* Label with enhanced slide and glow effect */}
                          <span className={`relative z-10 transform transition-all duration-300 group-hover:translate-x-1 ${
                            isActive 
                              ? 'font-medium drop-shadow-[0_0_2px_rgba(167,139,250,0.3)]' 
                              : 'group-hover:text-purple-400'
                          }`}>
                            {item.label}
                          </span>
                          
                          {/* Decorative elements */}
                          {isActive && (
                            <>
                              <div className="absolute top-1 right-2 w-1.5 h-1.5 bg-purple-400 rounded-full opacity-30 animate-pulse" />
                              <div className="absolute bottom-1 right-4 w-1 h-1 bg-purple-400 rounded-full opacity-20 animate-pulse delay-100" />
                            </>
                          )}
                        </span>
                      </Link>
                    </motion.div>
                  );
                })}

                {/* Sign Out Button with enhanced hover effect */}
                <div className="pt-6 mt-6 border-t border-gray-800">
                  <button
                    onClick={handleSignOut}
                    className="group flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 text-red-400 hover:text-red-500 w-full relative overflow-hidden"
                  >
                    {/* Gradient background on hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-red-500/5 opacity-0 group-hover:opacity-100 transition-all duration-300" />
                    
                    {/* Icon with rotation and slide effect */}
                    <div className="relative z-10 transition-transform duration-300 group-hover:scale-110">
                      <BsBoxArrowRight className="text-xl transform group-hover:translate-x-1 group-hover:rotate-6 transition-all duration-300" />
                    </div>
                    
                    {/* Label with slide effect */}
                    <span className="relative z-10 font-medium transform transition-transform duration-300 group-hover:translate-x-1">Sign Out</span>
                    
                    {/* Decorative elements */}
                    <div className="absolute top-1 right-1 w-1 h-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
                    <div className="absolute bottom-1 right-2 w-1 h-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                  </button>
                </div>
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 hidden md:block z-30 mt-2o">
        <div className="p-2">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-14 h-14 rounded-full  flex items-center justify-center">
            <Link href="/" className="group transform hover:scale-105 transition-transform duration-300">
              <Image 
                src="/logo.png" 
                alt="Bistec Logo" 
                width={120} 
                height={40}
                className="h-12 w-auto object-contain"
              />
            </Link>                   </div>
            <div>
              <h1 className="text-lg font-bold text-white">
              AspireHub
              </h1>
              <p className="text-xs text-gray-400">{portalTitle}</p>
            </div>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = isPathActive(item.href);
              return (
                <motion.div
                  key={item.href}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link
                    href={item.href}
                                          onClick={() => {
                        setIsPageTransitioning(true);
                        // Add a small delay for visual feedback
                        setTimeout(() => {
                          setIsPageTransitioning(false);
                        }, 300);
                      }}
                    className={`group flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 relative overflow-hidden ${
                      isActive
                        ? 'bg-gradient-to-r from-purple-800 to-purple-900 text-white shadow-lg shadow-purple-900/30'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center space-x-3 relative z-10 w-full">
                      {/* Animated background hover effect */}
                      {!isActive && (
                        <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-900 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg transform group-hover:scale-105" />
                      )}
                      
                      {/* Active indicator with glow */}
                      {isActive && (
                        <>
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-purple-400 rounded-full shadow-[0_0_8px_rgba(167,139,250,0.5)]" />
                          <div className="absolute inset-0 bg-purple-500/5 rounded-lg backdrop-blur-sm" />
                        </>
                      )}
                      
                      {/* Icon with enhanced hover effect */}
                      <span className="relative z-10 transition-all duration-300 group-hover:scale-110 group-hover:translate-x-1">
                        <item.icon className={`text-xl ${
                          isActive 
                            ? 'transform rotate-0 drop-shadow-[0_0_3px_rgba(167,139,250,0.5)]' 
                            : 'group-hover:rotate-6 group-hover:text-purple-400'
                        } transition-all duration-300`} />
                      </span>
                      
                      {/* Label with enhanced slide and glow effect */}
                      <span className={`relative z-10 transform transition-all duration-300 group-hover:translate-x-1 ${
                        isActive 
                          ? 'font-medium drop-shadow-[0_0_2px_rgba(167,139,250,0.3)]' 
                          : 'group-hover:text-purple-400'
                      }`}>
                        {item.label}
                      </span>
                      
                      {/* Decorative elements */}
                      {isActive && (
                        <>
                          <div className="absolute top-1 right-2 w-1.5 h-1.5 bg-purple-400 rounded-full opacity-30 animate-pulse" />
                          <div className="absolute bottom-1 right-4 w-1 h-1 bg-purple-400 rounded-full opacity-20 animate-pulse delay-100" />
                        </>
                      )}
                    </span>
                  </Link>
                </motion.div>
              );
            })}

            {/* Sign Out Button with enhanced hover effect */}
            <div className="pt-6 mt-6 border-t border-gray-800">
              <button
                onClick={handleSignOut}
                className="group flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 text-red-400 hover:text-red-500 w-full relative overflow-hidden"
              >
                {/* Gradient background on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-red-500/5 opacity-0 group-hover:opacity-100 transition-all duration-300" />
                
                {/* Icon with rotation and slide effect */}
                <div className="relative z-10 transition-transform duration-300 group-hover:scale-110">
                  <BsBoxArrowRight className="text-xl transform group-hover:translate-x-1 group-hover:rotate-6 transition-all duration-300" />
                </div>
                
                {/* Label with slide effect */}
                <span className="relative z-10 font-medium transform transition-transform duration-300 group-hover:translate-x-1">Sign Out</span>
                
                {/* Decorative elements */}
                <div className="absolute top-1 right-1 w-1 h-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
                <div className="absolute bottom-1 right-2 w-1 h-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
              </button>
            </div>
          </nav>
        </div>
      </div>

      {/* Header */}
      <header className="fixed top-0 right-0 left-0 h-16 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 md:pl-64 z-20">
        <div className="flex items-center justify-between h-full px-4">
          {/* Left side: Mobile menu, Logo, and System Name */}
          <div className="flex items-center space-x-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-400 hover:text-white md:hidden"
              aria-label="Open menu"
            >
              <BsList className="w-6 h-6" />
            </button>
            {/* Logo and System Name - Only visible on mobile */}
            <div className="flex items-center space-x-2 md:hidden">
            <Link href="/" className="group transform hover:scale-105 transition-transform duration-300">
              <Image 
                src="/logo.png" 
                alt="Bistec Logo" 
                width={120} 
                height={40}
                className="h-12 w-auto object-contain"
              />
            </Link>       
              {/* System Name */}
              <div className="flex flex-col">
                <h1 className="text-lg font-semibold text-gray-300">
                AspireHub
                </h1>
                <span className="text-xs text-gray-400"></span>
              </div>
            </div>
          </div>
          {/* Right side: User Menu - Visible on both mobile and desktop */}
          <div className="flex items-center space-x-4">
            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button 
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center justify-center text-gray-400 hover:text-white focus:outline-none transition-all duration-300 hover:scale-105"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-indigo-500 p-[1.5px] transition-all duration-300 hover:from-fuchsia-500 hover:via-indigo-500 hover:to-violet-500">
                  <div className="w-full h-full rounded-full bg-gray-900/90 dark:bg-gray-900 flex items-center justify-center backdrop-blur-xl">
                    <svg className="w-4 h-4 text-white/90" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M6 21V19C6 17.9391 6.42143 16.9217 7.17157 16.1716C7.92172 15.4214 8.93913 15 10 15H14C15.0609 15 16.0783 15.4214 16.8284 16.1716C17.5786 16.9217 18 17.9391 18 19V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  {/* Online indicator */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5">
                    <span className="absolute inset-0 inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 ring-1.5 ring-gray-900 dark:ring-gray-900"></span>
                  </div>
                </div>
              </button>
              
              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute right-0 mt-1.5 w-64 backdrop-blur-xl bg-white/10 dark:bg-gray-800/40 rounded-xl shadow-2xl z-50 border border-white/20 dark:border-gray-700/30 overflow-hidden"
                >
                  {/* Decorative top bar */}
                  <div className="h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500"></div>
                  
                  <div className="px-3 py-2 relative">
                    {/* Background decoration */}
                    <div className="absolute inset-0 bg-gradient-to-b from-violet-500/5 to-transparent pointer-events-none"></div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="relative group">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 via-fuchsia-500 to-indigo-500 p-[1px] transition-all duration-300 group-hover:from-fuchsia-500 group-hover:via-indigo-500 group-hover:to-violet-500">
                          <div className="w-full h-full rounded-lg bg-gray-900/90 dark:bg-gray-900 flex items-center justify-center backdrop-blur-xl">
                            <svg className="w-4 h-4 text-white/90" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M6 21V19C6 17.9391 6.42143 16.9217 7.17157 16.1716C7.92172 15.4214 8.93913 15 10 15H14C15.0609 15 16.0783 15.4214 16.8284 16.1716C17.5786 16.9217 18 17.9391 18 19V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3">
                            <span className="absolute inset-0 inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 ring-1 ring-white dark:ring-gray-900"></span>
                          </div>
                        </div>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-violet-400 transition-colors">
                          {session?.user?.email}
                        </p>
                        <div className="flex items-center mt-0.5 space-x-1.5">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-violet-500/10 text-violet-500 dark:bg-violet-500/20 dark:text-violet-300 border border-violet-500/20">
                            {/* Role-based icon */}
                            {session?.user?.role === 'ADMIN' && <BsShield className="mr-1 text-purple-500" />}
                            {session?.user?.role === 'MANAGER' && <BsGraphUp className="mr-1 text-blue-500" />}
                            {session?.user?.role === 'EMPLOYEE' && <BsPerson className="mr-1 text-green-500" />}
                            {session?.user?.role}
                          </span>
                          <span className="inline-flex items-center text-[10px] text-emerald-500 dark:text-emerald-400">
                            ● Online
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                 
                  {/* Admin: Admin, Manager, and Employee Dashboard Links */}
                  {session?.user?.role === 'ADMIN' && (
                    <div className="flex flex-col gap-2 mt-3">
                      <Link
                        href="/dashboard/admin"
                        className={`flex items-center gap-2 block w-full px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 text-center
                          ${pathname.startsWith('/dashboard/admin')
                            ? 'bg-gradient-to-r from-purple-800 to-purple-900 text-white shadow-lg shadow-purple-900/30'
                            : 'text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-800/60'}
                        `}
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <BsShield className="text-lg" />
                        Admin Dashboard
                      </Link>
                      <Link
                        href="/dashboard/manager"
                        className={`flex items-center gap-2 block w-full px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 text-center
                          ${pathname.startsWith('/dashboard/manager')
                            ? 'bg-gradient-to-r from-purple-800 to-purple-900 text-white shadow-lg shadow-purple-900/30'
                            : 'text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-800/60'}
                        `}
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <BsGraphUp className="text-lg" />
                        Manager Dashboard
                      </Link>
                      <Link
                        href="/dashboard/employee"
                        className={`flex items-center gap-2 block w-full px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 text-center
                          ${pathname.startsWith('/dashboard/employee')
                            ? 'bg-gradient-to-r from-purple-800 to-purple-900 text-white shadow-lg shadow-purple-900/30'
                            : 'text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-800/60'}
                        `}
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <BsPerson className="text-lg" />
                        Employee Dashboard
                      </Link>
                    </div>
                  )}

                  {/* Manager: Employee Dashboard and Manager Dashboard Links */}
                  {session?.user?.role === 'MANAGER' && (
                    <div className="flex flex-col gap-2 mt-3">
                      <Link
                        href="/dashboard/employee"
                        className={`flex items-center gap-2 block w-full px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 text-center
                          ${pathname.startsWith('/dashboard/employee')
                            ? 'bg-gradient-to-r from-purple-800 to-purple-900 text-white shadow-lg shadow-purple-900/30'
                            : 'text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-800/60'}
                        `}
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <BsPerson className="text-lg" />
                        Employee Dashboard
                      </Link>
                      <Link
                        href="/dashboard/manager"
                        className={`flex items-center gap-2 block w-full px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 text-center
                          ${pathname.startsWith('/dashboard/manager')
                            ? 'bg-gradient-to-r from-purple-800 to-purple-900 text-white shadow-lg shadow-purple-900/30'
                            : 'text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-800/60'}
                        `}
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <BsGraphUp className="text-lg" />
                        Manager Dashboard
                      </Link>
                    </div>
                  )}

                  {/* Sign Out Button */}
                  <motion.button 
                    whileHover={{ x: 4 }}
                    onClick={handleSignOut}
                    className="group flex items-center w-full px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-red-500/10 hover:to-transparent hover:text-red-500 dark:hover:text-red-400 transition-all duration-300"
                  >
                    <svg className="mr-2 w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M21 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="font-medium">Sign Out</span>
                  </motion.button>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="md:pl-64 pt-16">
        <motion.div 
          key={pathname}
          className="p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {children}
        </motion.div>
        
        {/* Page Transition Loading Indicator */}
        <AnimatePresence>
          {isPageTransitioning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
            >
              <div className="flex items-center space-x-2 bg-gray-900/80 backdrop-blur-sm rounded-lg px-4 py-2">
                <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-white text-sm font-medium">Loading...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Mobile menu backdrop */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
} 
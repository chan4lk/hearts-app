'use client';

import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BsGrid, 
  BsBullseye,
  BsStar,
  BsChat,
  BsBarChart,
  BsPerson,
  BsGear,
  BsShield,
  BsGraphUp,
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

export default function DashboardLayout({ children, type }: DashboardLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    systemName: 'Performance Management System',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h'
  });
  const userMenuRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    }

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // Only fetch admin settings if user is an admin
        if (type === 'admin') {
          const response = await fetch('/api/admin/settings');
          if (!response.ok) {
            if (response.status === 401) {
              console.log('Not authorized to access admin settings');
              return;
            }
            throw new Error('Failed to fetch settings');
          }
          const data = await response.json();
          if (data && typeof data === 'object') {
            setSettings(prev => ({
              ...prev,
              ...data
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };

    if (status === 'authenticated') {
      fetchSettings();
    }
  }, [type, status]);

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

  const getNavItems = () => {
    switch (type) {
      case 'employee':
        return [
          { href: '/dashboard/employee', icon: BsGrid, label: 'Dashboard' },
          { href: '/dashboard/employee/goals/create', icon: BsBullseye, label: 'Goals Create' },
          { href: '/dashboard/employee/self-rating', icon: BsStar, label: 'Self Rating' },

        ];
      case 'manager':
        return [
          { href: '/dashboard/manager', icon: BsGrid, label: 'Dashboard' },
          { href: '/dashboard/manager/goals/approve-goals', icon: BsBullseye, label: 'Goal Approvals' },
          { href: '/dashboard/manager/goals/setgoals', icon: BsBullseye, label: 'Set Goals ' },

          { href: '/dashboard/manager/rate-employees', icon: BsStar, label: 'Manager Ratings' },
          { href: '/dashboard/manager/goals/create', icon: BsBullseye, label: 'Goals Create' },
          { href: '/dashboard/manager/goals/self-ratings', icon: BsStar, label: 'Self Rating' },
          
        ];
      case 'admin':
        return [
          { href: '/dashboard/admin', label: 'Dashboard', icon: BsGrid },
          { href: '/dashboard/admin/users', label: 'Users', icon: BsPeople },
          { href: '/dashboard/admin/goals/', icon: BsBullseye, label: 'Set Goals ' },
          { href: '/dashboard/admin/settings', label: 'Settings', icon: BsGear },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();
  const portalTitle = type.charAt(0).toUpperCase() + type.slice(1) + ' Portal';

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
            className="fixed left-0 top-0 h-full w-64 bg-[#1a1c23] z-30 md:hidden"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                    <BsPerson className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-white">
                      {portalTitle}
                    </h1>
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
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-400 hover:bg-[#2d2f36] hover:text-white'
                      }`}
                    >
                      <item.icon className="text-xl" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}

                {/* Sign Out Button */}
                <div className="pt-6 mt-6 border-t border-gray-800">
                  <button
                    onClick={handleSignOut}
                    className="group flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 text-red-400 hover:bg-red-500/10 hover:text-red-500 w-full relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/5 transition-all duration-300"></div>
                    <BsBoxArrowRight className="text-xl transform group-hover:translate-x-1 transition-transform duration-300" />
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-[#1a1c23] hidden md:block z-30">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
              <BsPerson className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                {portalTitle}
              </h1>
            </div>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:bg-[#2d2f36] hover:text-white'
                  }`}
                >
                  <item.icon className="text-xl" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* Sign Out Button */}
            <div className="pt-6 mt-6 border-t border-gray-800">
              <button
                onClick={handleSignOut}
                className="group flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 text-red-400 hover:bg-red-500/10 hover:text-red-500 w-full relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/5 transition-all duration-300"></div>
                <BsBoxArrowRight className="text-xl transform group-hover:translate-x-1 transition-transform duration-300" />
                <span className="font-medium">Sign Out</span>
              </button>
            </div>
          </nav>
        </div>
      </div>

      {/* Header */}
      <header className="fixed top-0 right-0 left-0 h-16 bg-[#1a1c23] md:pl-64 z-20">
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
            {/* Logo and System Name */}
            <div className="flex items-center space-x-2">
              {/* Logo */}
              <img
                src="/logo.png"
                alt="Bistec Global Logo"
                className="h-8 w-auto"
              />
              {/* System Name */}
              <div className="flex flex-col">
                <h1 className="text-lg font-semibold text-gray-300">
                  Performance
                </h1>
                <span className="text-xs text-gray-400">Management System</span>
              </div>
            </div>
          </div>
          {/* Right side: Notification Bell and User Menu */}
          <div className="flex items-center space-x-4">
            {/* Notification Bell */}
            <button className="text-gray-400 hover:text-white">
              <BsBell className="w-6 h-6" />
            </button>
            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button 
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-3 text-gray-400 hover:text-white focus:outline-none"
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {session?.user?.email?.[0].toUpperCase()}
                  </span>
                </div>
                <BsChevronDown className={`w-4 h-4 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-[#1a1c23] rounded-lg shadow-lg py-1 z-50 border border-gray-700">
                  <div className="px-4 py-3 border-b border-gray-700">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {session?.user?.email?.[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{session?.user?.email}</p>
                        <p className="text-xs text-gray-400">{session?.user?.role}</p>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleSignOut}
                    className="group flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-500 transition-all duration-300"
                  >
                    <BsBoxArrowRight className="mr-2 transform group-hover:translate-x-1 transition-transform duration-300" />
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="md:pl-64 pt-16">
        <div className="p-6">
          {children}
        </div>
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
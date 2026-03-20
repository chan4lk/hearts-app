'use client';

import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { IconType } from 'react-icons';
import { hasAccess } from '@/app/utils/roleAccess';

import {
  BsBullseye, BsStar, BsBarChartLine as BsBarChart, BsPerson,
  BsShieldFill as BsShield, BsGraphUpArrow as BsGraphUp,
  BsClipboardData, BsPeople, BsBoxArrowRight, BsList, BsX,
  BsCalendarCheck, BsCalendarEvent as BsCalendar,
  BsCheckCircle as BsCheckEvent
} from 'react-icons/bs';
import { useSettings } from '@/app/providers';
import NotificationsDropdown from '@/app/components/shared/NotificationsDropdown';
import ThemeToggle from '@/app/components/ui/ThemeToggle';

interface DashboardLayoutProps {
  children: ReactNode;
  type: 'employee' | 'manager' | 'admin';
}

interface NavItem {
  href: string;
  icon: IconType;
  label: string;
}

type Role = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

// ─── Sidebar Nav Item ─────────────────────────────────────────────
function NavLink({ item, isActive, onClick }: { item: NavItem; isActive: boolean; onClick?: () => void }) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 cursor-pointer ${
        isActive
          ? 'bg-indigo-600 dark:bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
          : 'text-secondary hover:text-primary hover:bg-surface-secondary'
      }`}
    >
      <item.icon className={`text-base flex-shrink-0 ${isActive ? 'text-white' : ''}`} />
      <span>{item.label}</span>
    </Link>
  );
}

// ─── User Avatar ──────────────────────────────────────────────────
function UserAvatar({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const s = size === 'sm' ? 'w-8 h-8' : 'w-9 h-9';
  return (
    <div className={`${s} rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center relative`}>
      <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" />
        <path d="M6 21V19C6 17.9391 6.42143 16.9217 7.17157 16.1716C7.92172 15.4214 8.93913 15 10 15H14C15.0609 15 16.0783 15.4214 16.8284 16.1716C17.5786 16.9217 18 17.9391 18 19V21" />
      </svg>
      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[rgb(var(--color-bg-primary))]" />
    </div>
  );
}

export default function DashboardLayout({ children, type }: DashboardLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname() || '';
  const { settings } = useSettings();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setIsMobileMenuOpen(false); }, [pathname]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) setIsMobileMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setIsUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') sessionStorage.setItem('dashboardContext', type);
  }, [type]);

  const getNavItems = (): NavItem[] => {
    const adminItems: NavItem[] = [
      { href: '/dashboard/admin', label: 'Overview', icon: BsShield },
      { href: '/dashboard/admin/users', label: 'Users', icon: BsPeople },
      { href: '/dashboard/admin/all-goals', label: 'All Goals', icon: BsBullseye },
      { href: '/dashboard/admin/review-cycles', label: 'Reviews', icon: BsCalendarCheck },
      { href: '/dashboard/admin/events', label: 'Events', icon: BsCalendar },
      { href: '/dashboard/analytics?context=admin', label: 'Analytics', icon: BsBarChart },
    ];
    const managerItems: NavItem[] = [
      { href: '/dashboard/manager', label: 'Overview', icon: BsGraphUp },
      { href: '/dashboard/manager/goals/approve-goals', label: 'Approvals', icon: BsClipboardData },
      { href: '/dashboard/manager/goals/setgoals', label: 'Set Goals', icon: BsBullseye },
      { href: '/dashboard/manager/rate-employees', label: 'Rate Team', icon: BsStar },
      { href: '/dashboard/analytics?context=manager', label: 'Analytics', icon: BsBarChart },
    ];
    const employeeItems: NavItem[] = [
      { href: '/dashboard/employee', label: 'Overview', icon: BsPerson },
      { href: '/dashboard/employee/goals/create', label: 'My Goals', icon: BsBullseye },
      { href: '/dashboard/employee/self-rating', label: 'Self Rating', icon: BsStar },
      { href: '/dashboard/employee/events', label: 'My Events', icon: BsCheckEvent },
      { href: '/dashboard/employee/events/browse', label: 'Browse Events', icon: BsCalendar },
      { href: '/dashboard/analytics?context=employee', label: 'Analytics', icon: BsBarChart },
    ];
    switch (type) {
      case 'admin': return adminItems;
      case 'manager': return managerItems;
      default: return employeeItems;
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      const userRole = session?.user?.role as Role | undefined;
      if (userRole === 'ADMIN') return;
      const currentPath = pathname || '';
      if (userRole && !hasAccess(userRole, currentPath)) {
        router.push(userRole === 'MANAGER' ? '/dashboard/manager' : '/dashboard/employee');
      }
    }
  }, [status, pathname, session]);

  const navItems = getNavItems();
  const portalLabel = type.charAt(0).toUpperCase() + type.slice(1);

  const isPathActive = (href: string) => {
    const hrefPath = href.split('?')[0].split('#')[0].replace(/\/$/, '');
    return pathname.replace(/\/$/, '') === hrefPath;
  };

  const handleSignOut = async () => {
    try {
      await signOut({ callbackUrl: '/login', redirect: true });
    } catch {
      router.push('/login');
    }
  };

  // ─── Sidebar content (shared between mobile & desktop) ──────────
  const SidebarContent = ({ onNavClick }: { onNavClick?: () => void }) => (
    <>
      {/* Logo */}
      <div className="px-4 py-5 mb-2">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="Bistec Global" width={100} height={36} className="h-9 w-auto object-contain" />
          <div className="flex flex-col">
            <span className="text-sm font-bold text-primary leading-tight">AspireHub</span>
            <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 leading-tight">Bistec Global</span>
          </div>
        </Link>
      </div>

      {/* Portal badge */}
      <div className="px-4 mb-4">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/15">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 tracking-wide">{portalLabel} Portal</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="px-3 space-y-0.5 flex-1">
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} isActive={isPathActive(item.href)} onClick={onNavClick} />
        ))}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 mt-auto border-t border-theme">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-[13px] font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors duration-200 cursor-pointer"
        >
          <BsBoxArrowRight className="text-base" />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-surface-primary">
      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-20 md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              ref={sidebarRef}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 h-full w-64 bg-surface-sidebar border-r border-theme z-30 md:hidden flex flex-col"
            >
              <div className="flex items-center justify-end p-3">
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-surface-secondary" aria-label="Close">
                  <BsX className="w-5 h-5" />
                </button>
              </div>
              <SidebarContent onNavClick={() => setIsMobileMenuOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className="fixed left-0 top-0 h-full w-60 bg-surface-sidebar border-r border-theme hidden md:flex flex-col z-30">
        <SidebarContent />
      </div>

      {/* Header */}
      <header className="fixed top-0 right-0 left-0 h-14 bg-surface-header/80 backdrop-blur-xl border-b border-theme md:pl-60 z-20">
        <div className="flex items-center justify-between h-full px-4">
          {/* Left */}
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="text-secondary hover:text-primary md:hidden" aria-label="Open menu">
              <BsList className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 md:hidden">
              <Image src="/logo.png" alt="Logo" width={80} height={28} className="h-7 w-auto object-contain" />
              <span className="text-sm font-semibold text-primary">AspireHub</span>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {session?.user?.id && <NotificationsDropdown userId={session.user.id} />}

            {/* User menu */}
            <div className="relative" ref={userMenuRef}>
              <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="cursor-pointer" aria-label="User menu">
                <UserAvatar />
              </button>

              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-56 bg-surface-elevated rounded-xl border border-theme shadow-theme-lg z-50 overflow-hidden"
                  >
                    {/* User info */}
                    <div className="px-3 py-3 border-b border-theme">
                      <p className="text-sm font-medium text-primary truncate">{session?.user?.email}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-500/15">
                          {session?.user?.role}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Online
                        </span>
                      </div>
                    </div>

                    {/* Dashboard links for admin/manager */}
                    {(session?.user?.role === 'ADMIN' || session?.user?.role === 'MANAGER') && (
                      <div className="p-2 border-b border-theme space-y-0.5">
                        {session?.user?.role === 'ADMIN' && (
                          <>
                            <Link href="/dashboard/admin" onClick={() => setIsUserMenuOpen(false)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${pathname.startsWith('/dashboard/admin') ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300' : 'text-secondary hover:text-primary hover:bg-surface-secondary'}`}>
                              <BsShield className="text-sm" /> Admin
                            </Link>
                            <Link href="/dashboard/manager" onClick={() => setIsUserMenuOpen(false)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${pathname.startsWith('/dashboard/manager') ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300' : 'text-secondary hover:text-primary hover:bg-surface-secondary'}`}>
                              <BsGraphUp className="text-sm" /> Manager
                            </Link>
                            <Link href="/dashboard/employee" onClick={() => setIsUserMenuOpen(false)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${pathname.startsWith('/dashboard/employee') ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300' : 'text-secondary hover:text-primary hover:bg-surface-secondary'}`}>
                              <BsPerson className="text-sm" /> Employee
                            </Link>
                          </>
                        )}
                        {session?.user?.role === 'MANAGER' && (
                          <>
                            <Link href="/dashboard/manager" onClick={() => setIsUserMenuOpen(false)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${pathname.startsWith('/dashboard/manager') ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300' : 'text-secondary hover:text-primary hover:bg-surface-secondary'}`}>
                              <BsGraphUp className="text-sm" /> Manager
                            </Link>
                            <Link href="/dashboard/employee" onClick={() => setIsUserMenuOpen(false)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${pathname.startsWith('/dashboard/employee') ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300' : 'text-secondary hover:text-primary hover:bg-surface-secondary'}`}>
                              <BsPerson className="text-sm" /> Employee
                            </Link>
                          </>
                        )}
                      </div>
                    )}

                    {/* Sign out */}
                    <div className="p-2">
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-[13px] font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
                      >
                        <BsBoxArrowRight className="text-sm" />
                        Sign out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="md:pl-60 pt-14">
        <div className="p-5 sm:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

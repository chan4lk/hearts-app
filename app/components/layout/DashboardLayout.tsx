'use client';

import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { IconType } from 'react-icons';
// Role-based access will be reimplemented with new feature pages

import {
  BsBullseye, BsStar, BsBarChartLine as BsBarChart, BsPerson,
  BsShieldFill as BsShield, BsGraphUpArrow as BsGraphUp,
  BsClipboardData, BsPeople, BsBoxArrowRight, BsList, BsX,
  BsCalendarCheck, BsCalendarEvent as BsCalendar,
  BsCheckCircle as BsCheckEvent,
  BsChevronLeft, BsChevronRight,
  BsHeart, BsJournalCheck, BsEnvelope
} from 'react-icons/bs';
import { useSettings } from '@/app/providers';
import ThemeToggle from '@/app/components/ui/ThemeToggle';
import NotificationBell from '@/app/components/layout/NotificationBell';

interface DashboardLayoutProps {
  children: ReactNode;
  type: 'employee' | 'manager' | 'admin';
}

interface NavItem {
  href: string;
  icon: IconType;
  label: string;
  isSub?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
  defaultOpen?: boolean;
}

type Role = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

// ─── Nav Link with animated active indicator ─────────────────────
function NavLink({ item, isActive, onClick, collapsed }: { item: NavItem; isActive: boolean; onClick?: () => void; collapsed?: boolean }) {
  const isSub = item.isSub;
  // Determine icon color based on nav item
  const iconColorMap: Record<string, string> = {
    Feed: 'rgb(var(--color-heart))',
    Goals: 'rgb(var(--color-goal-active))',
    Reviews: 'rgb(var(--color-review))',
    Events: 'rgb(var(--color-accent))',
    Team: 'rgb(var(--color-accent))',
    Admin: 'rgb(var(--color-error))',
  };
  const iconColor = isActive ? (iconColorMap[item.label] || 'rgb(var(--color-accent))') : undefined;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={`relative flex items-center ${collapsed ? 'justify-center px-2' : isSub ? 'gap-2.5 pl-8 pr-3' : 'gap-3 px-3.5'} ${isSub ? 'py-1.5' : 'py-2.5'} rounded-xl ${isSub ? 'text-xs' : 'text-sm'} font-medium transition-all duration-200 focus-ring group ${
        isActive
          ? isSub ? 'bg-accent-muted text-accent' : 'bg-surface-elevated text-primary shadow-theme-sm border border-theme'
          : 'text-secondary hover:text-primary hover:bg-surface-tertiary'
      }`}
    >
      <item.icon
        className={`${isSub ? 'text-xs' : 'text-base'} flex-shrink-0 transition-all duration-200 ${isActive ? '' : 'group-hover:scale-110'}`}
        style={iconColor ? { color: iconColor } : undefined}
      />
      {!collapsed && <span>{item.label}</span>}
      {isActive && !isSub && (
        <motion.div
          layoutId="nav-active"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-accent rounded-r-full"
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        />
      )}
    </Link>
  );
}

// ─── Collapsible Nav Group ───────────────────────────────────────
function NavGroup({ section, isPathActive, onClick, collapsed: sidebarCollapsed }: {
  section: NavSection; isPathActive: (href: string, isSub?: boolean) => boolean; onClick?: () => void; collapsed?: boolean;
}) {
  const hasActiveItem = section.items.some(item => isPathActive(item.href, item.isSub));
  const [open, setOpen] = useState(section.defaultOpen || hasActiveItem);

  return (
    <div className="mt-1">
      {!sidebarCollapsed && (
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between px-3.5 py-1.5 text-2xs font-semibold text-tertiary uppercase tracking-wider hover:text-secondary transition-colors"
        >
          {section.title}
          <motion.span animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.15 }} className="text-xs">›</motion.span>
        </button>
      )}
      <AnimatePresence initial={false}>
        {(open || sidebarCollapsed) && (
          <motion.div
            initial={sidebarCollapsed ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden space-y-0.5"
          >
            {section.items.map(item => (
              <NavLink key={item.href} item={item} isActive={isPathActive(item.href, item.isSub)} onClick={onClick} collapsed={sidebarCollapsed} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── User Avatar ─────────────────────────────────────────────────
function UserAvatar({ name }: { name?: string }) {
  const initials = name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '';
  return (
    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[rgb(var(--color-heart))] to-[rgb(var(--color-accent))] flex items-center justify-center relative shadow-sm">
      {initials ? (
        <span className="text-xs font-bold text-white leading-none">{initials}</span>
      ) : (
        <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" />
          <path d="M6 21V19C6 17.9391 6.42143 16.9217 7.17157 16.1716C7.92172 15.4214 8.93913 15 10 15H14C15.0609 15 16.0783 15.4214 16.8284 16.1716C17.5786 16.9217 18 17.9391 18 19V21" />
        </svg>
      )}
      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-success ring-2 ring-[rgb(var(--color-bg-sidebar))]" />
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
  const [collapsed, setCollapsed] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Persist collapsed state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sidebar-collapsed');
      if (stored === 'true') setCollapsed(true);
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sidebar-collapsed', String(next));
      return next;
    });
  };

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

  const getNavSections = (): NavSection[] => {
    const userRole = session?.user?.role as Role | undefined;
    const sections: NavSection[] = [];

    // Employee section — everyone sees this
    sections.push({
      title: 'My Work',
      defaultOpen: true,
      items: [
        { href: '/dashboard/feed', label: 'Feed', icon: BsHeart },
        { href: '/dashboard/goals', label: 'Goals', icon: BsBullseye },
        { href: '/dashboard/reviews', label: 'Reviews', icon: BsJournalCheck },
        { href: '/dashboard/events', label: 'Events', icon: BsCalendar },
      ],
    });

    // Manager section
    if (userRole === 'MANAGER' || userRole === 'ADMIN') {
      sections.push({
        title: 'Manager',
        defaultOpen: true,
        items: [
          { href: '/dashboard/team', label: 'Team', icon: BsPeople },
        ],
      });
    }

    // Admin section
    if (userRole === 'ADMIN') {
      sections.push({
        title: 'Admin',
        defaultOpen: false,
        items: [
          { href: '/dashboard/admin', label: 'Dashboard', icon: BsShield },
          { href: '/dashboard/admin/users', label: 'Users', icon: BsPeople, isSub: true },
          { href: '/dashboard/admin/values', label: 'Values', icon: BsHeart, isSub: true },
          { href: '/dashboard/admin/cycles', label: 'Cycles', icon: BsCalendar, isSub: true },
          { href: '/dashboard/admin/templates', label: 'Templates', icon: BsBullseye, isSub: true },
          { href: '/dashboard/admin/notifications', label: 'Emails', icon: BsEnvelope, isSub: true },
        ],
      });
    }

    return sections;
  };

  // Flat list for header active item detection
  const getNavItems = (): NavItem[] => getNavSections().flatMap(s => s.items);

  useEffect(() => {
    if (status === 'authenticated') {
      const userRole = session?.user?.role as Role | undefined;
      if (userRole === 'ADMIN') return;
      const currentPath = pathname || '';
      // Basic role routing — will be expanded with feature pages
      if (false) { // Disabled until features are rebuilt
        router.push(userRole === 'MANAGER' ? '/dashboard/manager' : '/dashboard/employee');
      }
    }
  }, [status, pathname, session]);

  const navSections = getNavSections();
  const navItems = getNavItems();
  const userRole = session?.user?.role as Role | undefined;
  const portalLabel = userRole || 'Employee';

  const portalColors: Record<string, string> = {
    ADMIN: 'from-[rgb(var(--color-error))] to-[rgb(var(--color-cat-kpi))]',
    MANAGER: 'from-[rgb(var(--color-info))] to-[rgb(var(--color-accent))]',
    EMPLOYEE: 'from-[rgb(var(--color-success))] to-[rgb(var(--color-cat-personal))]',
  };

  const isPathActive = (href: string, isSub?: boolean) => {
    const hrefPath = href.split('?')[0].split('#')[0].replace(/\/$/, '');
    const currentPath = pathname.replace(/\/$/, '');
    if (isSub) {
      // Sub-items: exact match only
      return currentPath === hrefPath || currentPath.startsWith(hrefPath + '/');
    }
    // Main items: exact match or nested (but NOT if a sub-item would match better)
    if (hrefPath === '/dashboard/admin' && currentPath.startsWith('/dashboard/admin/')) {
      return false; // Let sub-items handle /admin/users, /admin/values, /admin/cycles
    }
    return currentPath === hrefPath || currentPath.startsWith(hrefPath + '/');
  };

  const handleSignOut = async () => {
    try {
      await signOut({ callbackUrl: '/login', redirect: true });
    } catch {
      router.push('/login');
    }
  };

  const dashLink = (href: string, icon: IconType, label: string) => {
    const Icon = icon;
    const active = pathname.startsWith(href.split('/').slice(0, 4).join('/'));
    return (
      <Link
        href={href}
        onClick={() => setIsUserMenuOpen(false)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus-ring ${
          active ? 'bg-accent-muted text-accent' : 'text-secondary hover:text-primary hover:bg-surface-secondary'
        }`}
      >
        <Icon className="text-sm" /> {label}
      </Link>
    );
  };

  // ─── Sidebar content (for mobile drawer — always expanded) ─────
  const MobileSidebarContent = ({ onNavClick }: { onNavClick?: () => void }) => (
    <>
      {/* Logo section */}
      <div className="px-5 py-5 mb-1">
        <Link href="/" className="flex items-center gap-2.5 group">
          <Image src="/logo.png" alt="Bistec Global" width={100} height={36} className="h-9 w-auto object-contain transition-transform duration-300 group-hover:scale-105" />
          <div className="flex flex-col">
            <span className="text-sm font-bold text-primary leading-tight">AspireHub</span>
            <span className="text-2xs font-semibold text-accent tracking-widest uppercase leading-tight">Bistec Global</span>
          </div>
        </Link>
      </div>

      {/* Portal badge */}
      <div className="px-5 mb-5">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-br from-[rgba(var(--color-accent),0.06)] to-[rgba(var(--color-accent),0.02)]">
          <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${portalColors[userRole || 'EMPLOYEE']}`} />
          <span className="text-2xs font-bold text-primary tracking-wide uppercase">{portalLabel} Portal</span>
        </div>
      </div>

      {/* Navigation — sectioned */}
      <nav className="px-3 flex-1 space-y-1">
        {navSections.map((section) => (
          <NavGroup key={section.title} section={section} isPathActive={isPathActive} onClick={onNavClick} />
        ))}
      </nav>

      {/* User info + sign out */}
      <div className="px-3 py-4 mt-auto border-t border-theme">
        {session?.user && (
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <UserAvatar name={session.user.name || undefined} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-primary truncate">{session.user.name || 'User'}</p>
              <p className="text-2xs text-tertiary truncate">{session.user.email}</p>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={handleSignOut}
          className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-error hover:bg-error-muted transition-all duration-200 cursor-pointer focus-ring"
        >
          <BsBoxArrowRight className="text-base" />
          Sign out
        </button>
      </div>
    </>
  );

  // ─── Desktop Sidebar content (supports collapsed) ──────────────
  const DesktopSidebarContent = () => (
    <>
      {/* Logo section */}
      <div className={`py-5 mb-1 ${collapsed ? 'px-2 flex justify-center' : 'px-5'}`}>
        <Link href="/" className={`flex items-center group ${collapsed ? 'justify-center' : 'gap-2.5'}`}>
          <Image src="/logo.png" alt="Bistec Global" width={100} height={36} className={`object-contain transition-transform duration-300 group-hover:scale-105 ${collapsed ? 'h-8 w-auto' : 'h-9 w-auto'}`} />
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold text-primary leading-tight">AspireHub</span>
              <span className="text-2xs font-semibold text-accent tracking-widest uppercase leading-tight">Bistec Global</span>
            </div>
          )}
        </Link>
      </div>

      {/* Portal badge */}
      <div className={`mb-5 ${collapsed ? 'px-2 flex justify-center' : 'px-5'}`}>
        {collapsed ? (
          <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${portalColors[userRole || 'EMPLOYEE']}`} title={`${portalLabel} Portal`} />
        ) : (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-br from-[rgba(var(--color-accent),0.06)] to-[rgba(var(--color-accent),0.02)]">
            <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${portalColors[userRole || 'EMPLOYEE']}`} />
            <span className="text-2xs font-bold text-primary tracking-wide uppercase">{portalLabel} Portal</span>
          </div>
        )}
      </div>

      {/* Navigation — sectioned */}
      <nav className={`flex-1 space-y-1 ${collapsed ? 'px-2' : 'px-3'}`}>
        {navSections.map((section) => (
          <NavGroup key={section.title} section={section} isPathActive={isPathActive} collapsed={collapsed} />
        ))}
      </nav>

      {/* Toggle button */}
      <div className={`px-3 py-2 ${collapsed ? 'flex justify-center' : ''}`}>
        <button
          onClick={toggleCollapsed}
          className={`flex items-center justify-center bg-surface-secondary hover:bg-surface-tertiary rounded-lg transition-all duration-200 cursor-pointer focus-ring ${collapsed ? 'w-10 h-10' : 'w-full py-2'}`}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <BsChevronRight className="text-sm text-secondary" /> : <BsChevronLeft className="text-sm text-secondary" />}
        </button>
      </div>

      {/* User info + sign out */}
      <div className={`py-4 mt-auto border-t border-theme ${collapsed ? 'px-2' : 'px-3'}`}>
        {session?.user && (
          <div className={`flex items-center py-2 mb-2 ${collapsed ? 'justify-center px-0' : 'gap-3 px-3'}`}>
            <UserAvatar name={session.user.name || undefined} />
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-primary truncate">{session.user.name || 'User'}</p>
                <p className="text-2xs text-tertiary truncate">{session.user.email}</p>
              </div>
            )}
          </div>
        )}
        <button
          type="button"
          onClick={handleSignOut}
          title={collapsed ? 'Sign out' : undefined}
          aria-label="Sign out"
          className={`flex items-center rounded-xl text-sm font-medium text-error hover:bg-error-muted transition-all duration-200 cursor-pointer focus-ring ${collapsed ? 'justify-center w-full py-2.5' : 'gap-2.5 w-full px-3 py-2.5'}`}
        >
          <BsBoxArrowRight className="text-base" />
          {!collapsed && 'Sign out'}
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
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-20 md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              ref={sidebarRef}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 h-full w-72 bg-surface-sidebar border-r border-theme z-30 md:hidden flex flex-col shadow-theme-xl"
            >
              <div className="flex items-center justify-end p-3">
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-surface-secondary focus-ring" aria-label="Close menu">
                  <BsX className="w-5 h-5" />
                </button>
              </div>
              <MobileSidebarContent onNavClick={() => setIsMobileMenuOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className={`fixed left-0 top-0 h-full bg-surface-sidebar border-r border-theme hidden md:flex flex-col z-30 transition-all duration-300 ease-in-out ${collapsed ? 'w-16' : 'w-56'}`}>
        <DesktopSidebarContent />
      </div>

      {/* Header */}
      <header className={`fixed top-0 right-0 left-0 h-14 bg-surface-header/70 backdrop-blur-2xl border-b border-theme z-20 transition-all duration-300 ease-in-out ${collapsed ? 'md:pl-16' : 'md:pl-56'}`}>
        <div className="flex items-center justify-between h-full px-4 sm:px-6">
          {/* Left */}
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="text-secondary hover:text-primary md:hidden focus-ring rounded-lg p-1.5" aria-label="Open menu">
              <BsList className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 md:hidden">
              <Image src="/logo.png" alt="Logo" width={80} height={28} className="h-7 w-auto object-contain" />
            </div>
            <div className="hidden md:flex items-center gap-2.5">
              {(() => {
                const activeItem = navItems.find(navItem => isPathActive(navItem.href, navItem.isSub));
                const ActiveIcon = activeItem?.icon;
                const iconColorMap: Record<string, string> = {
                  Feed: 'rgba(var(--color-heart),0.1)', Goals: 'rgba(var(--color-goal-active),0.1)',
                  Reviews: 'rgba(var(--color-review),0.1)', Events: 'rgba(var(--color-accent),0.1)',
                  Team: 'rgba(var(--color-accent),0.1)', Admin: 'rgba(var(--color-error),0.1)',
                };
                const iconTextMap: Record<string, string> = {
                  Feed: 'rgb(var(--color-heart))', Goals: 'rgb(var(--color-goal-active))',
                  Reviews: 'rgb(var(--color-review))', Events: 'rgb(var(--color-accent))',
                  Team: 'rgb(var(--color-accent))', Admin: 'rgb(var(--color-error))',
                };
                return activeItem ? (
                  <div className="flex items-center gap-2.5">
                    {ActiveIcon && (
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: iconColorMap[activeItem.label] || 'rgba(var(--color-accent),0.1)' }}>
                        <ActiveIcon className="w-4 h-4" style={{ color: iconTextMap[activeItem.label] || 'rgb(var(--color-accent))' }} />
                      </div>
                    )}
                    <div>
                      <h1 className="text-sm font-semibold text-primary leading-tight">{activeItem.label}</h1>
                      <p className="text-2xs text-tertiary leading-tight">AspireHub</p>
                    </div>
                  </div>
                ) : (
                  <h1 className="text-sm font-semibold text-primary">AspireHub</h1>
                );
              })()}
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NotificationBell />

            {/* User menu */}
            <div className="relative" ref={userMenuRef}>
              <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="cursor-pointer focus-ring rounded-xl" aria-label="User menu">
                <UserAvatar name={session?.user?.name || undefined} />
              </button>

              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
                    className="absolute right-0 mt-2 w-60 bg-surface-elevated rounded-2xl border border-theme shadow-theme-xl z-50 overflow-hidden"
                  >
                    {/* User info */}
                    <div className="px-4 py-4 border-b border-theme">
                      <div className="flex items-center gap-3">
                        <UserAvatar name={session?.user?.name || undefined} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-primary truncate">{session?.user?.name || session?.user?.email}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-2xs font-bold bg-accent-muted text-accent">
                              {session?.user?.role}
                            </span>
                            <span className="flex items-center gap-1 text-2xs text-success">
                              <div className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--color-success))]" /> Online
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick links */}
                    <div className="p-2 border-b border-theme space-y-0.5">
                      {dashLink('/dashboard/feed', BsHeart, 'Hearts Feed')}
                      {dashLink('/dashboard/goals', BsBullseye, 'My Goals')}
                      {session?.user?.role === 'ADMIN' && dashLink('/dashboard/admin', BsShield, 'Admin Settings')}
                    </div>

                    {/* Sign out */}
                    <div className="p-2">
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-error hover:bg-error-muted transition-colors cursor-pointer focus-ring"
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
      <main className={`pt-14 transition-all duration-300 ease-in-out ${collapsed ? 'md:pl-16' : 'md:pl-56'}`}>
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

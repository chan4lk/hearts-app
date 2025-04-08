'use client';

import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, useState } from 'react';
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
  BsPeople
} from 'react-icons/bs';

interface DashboardLayoutProps {
  children: ReactNode;
  type: 'employee' | 'manager' | 'admin';
}

export default function DashboardLayout({ children, type }: DashboardLayoutProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getNavItems = () => {
    switch (type) {
      case 'employee':
        return [
          { href: '/dashboard/employee', icon: BsGrid, label: 'Dashboard' },
          { href: '/goals', icon: BsBullseye, label: 'Goal Setting' },
          { href: '/self-rating', icon: BsStar, label: 'Self Rating' },
          { href: '/feedback', icon: BsChat, label: 'Feedback' },
          { href: '/reports', icon: BsBarChart, label: 'Reports' },
          { href: '/performance-review', icon: BsPerson, label: 'Performance Review' },
        ];
      case 'manager':
        return [
          { href: '/dashboard/manager', icon: BsGrid, label: 'Goal Approvals' },
          { href: '/manager-ratings', icon: BsStar, label: 'Manager Ratings' },
          { href: '/performance-reviews', icon: BsBarChart, label: 'Performance Reviews' },
          { href: '/feedback', icon: BsChat, label: 'Feedback' },
          { href: '/team-management', icon: BsPeople, label: 'Team Management' },
        ];
      case 'admin':
        return [
          { href: '/dashboard/admin', icon: BsGrid, label: 'Dashboard' },
          { href: '/user-management', icon: BsPeople, label: 'User Management' },
          { href: '/system-settings', icon: BsGear, label: 'System Settings' },
          { href: '/security', icon: BsShield, label: 'Security' },
          { href: '/analytics', icon: BsGraphUp, label: 'Analytics' },
          { href: '/audit-logs', icon: BsClipboardData, label: 'Audit Logs' },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();
  const portalTitle = type.charAt(0).toUpperCase() + type.slice(1) + ' Portal';

  return (
    <div className="min-h-screen bg-[#0f1117]">
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full w-64 bg-[#1a1c23] transform transition-transform duration-200 ease-in-out ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 z-30`}>
        <div className="p-6">
          <h1 className="text-xl font-bold text-white mb-8">{portalTitle}</h1>
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
          </nav>
        </div>
        <div className="absolute bottom-4 left-0 w-full px-6">
          <button
            onClick={() => signOut()}
            className="w-full px-4 py-2 text-gray-400 hover:text-white hover:bg-[#2d2f36] rounded-lg text-left flex items-center space-x-3"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="fixed top-0 right-0 left-0 h-16 bg-[#1a1c23] md:pl-64 z-20">
        <div className="flex items-center justify-between h-full px-4">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center ml-auto space-x-4">
            <button className="text-gray-400 hover:text-white">
              <BsBell className="w-6 h-6" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {session?.user?.email?.[0].toUpperCase()}
                </span>
              </div>
              <div className="hidden md:block">
                <p className="text-sm text-white">{session?.user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="md:pl-64 pt-16">
        <div className="p-6">
          {children}
        </div>
      </div>

      {/* Mobile menu backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
} 
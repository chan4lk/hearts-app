'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRole } from '../context/RoleContext';
import { Role } from '@prisma/client';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { 
  BsPersonCircle, 
  BsGrid3X3GapFill, 
  BsPeopleFill, 
  BsBullseye, 
  BsStarFill, 
  BsBoxArrowRight,
  BsBellFill, 
  BsShieldFillCheck, 
  BsCheckCircleFill, 
  BsPersonFill,
  BsChevronDown
} from 'react-icons/bs';
import { HiOutlineMenuAlt3 } from 'react-icons/hi';
import type { IconType } from 'react-icons';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
  role?: Role;
}

interface NavItem {
  href: string;
  label: string;
  icon: IconType;
}

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Admin Dashboard',
  MANAGER: 'Manager Dashboard',
  EMPLOYEE: 'Employee Dashboard',
};

const ROLE_ROUTES: Record<Role, string> = {
  ADMIN: '/dashboard/admin',
  MANAGER: '/dashboard/manager',
  EMPLOYEE: '/dashboard/employee',
};

const ROLE_DESCRIPTIONS: Record<Role, string> = {
  ADMIN: 'Full system access and control',
  MANAGER: 'Team and goal management',
  EMPLOYEE: 'Personal goals and progress',
};

const ROLE_NAV_ITEMS: Record<Role, NavItem[]> = {
  ADMIN: [
    { href: '/dashboard/admin', label: 'Dashboard', icon: BsGrid3X3GapFill },
    { href: '/dashboard/admin/users', label: 'Users', icon: BsPeopleFill },
    { href: '/dashboard/admin/goals', label: 'Goals', icon: BsBullseye },
  ],
  MANAGER: [
    { href: '/dashboard/manager', label: 'Dashboard', icon: BsGrid3X3GapFill },
    { href: '/dashboard/manager/goals/approve-goals', label: 'Goal Approvals', icon: BsBullseye },
    { href: '/dashboard/manager/goals/setgoals', label: 'Set Goals', icon: BsBullseye },
    { href: '/dashboard/manager/rate-employees', label: 'Ratings', icon: BsStarFill },
  ],
  EMPLOYEE: [
    { href: '/dashboard/employee', label: 'Dashboard', icon: BsGrid3X3GapFill },
    { href: '/dashboard/employee/goals/create', label: 'Create Goals', icon: BsBullseye },
    { href: '/dashboard/employee/self-rating', label: 'Self Rating', icon: BsStarFill },
  ],
};

export default function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const { data: session } = useSession();
  const { activeRole, availableRoles, switchToRole } = useRole();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // If role prop is provided, use it, otherwise use activeRole from context
  const currentRole = role || activeRole;

  // Handle role switching
  const handleRoleSwitch = async (newRole: Role) => {
    await switchToRole(newRole);
  };

  // Handle sign out
  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  // Get navigation items for the current role
  const getNavItems = () => {
    return ROLE_NAV_ITEMS[currentRole] || [];
  };

  const navItems = getNavItems();

  // Updated isActivePath function for more precise matching
  const isActivePath = (href: string) => {
    if (!pathname) return false;
    
    const currentPath = pathname.toLowerCase();
    const navPath = href.toLowerCase();

    // Exact match for dashboard root paths
    if (navPath === `/dashboard/${currentRole.toLowerCase()}`) {
      return currentPath === navPath;
    }

    // For goal-related paths, match the specific section
    if (navPath.includes('/goals/')) {
      const navPathParts = navPath.split('/');
      const currentPathParts = currentPath.split('/');
      return navPathParts[navPathParts.length - 1] === currentPathParts[currentPathParts.length - 1];
    }

    // For other paths, check if current path starts with nav path
    return currentPath.startsWith(navPath);
  };

  return (
    <div className="min-h-screen bg-[#0f1117]">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <div className={cn(
        "fixed left-0 top-0 h-screen w-64 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100 z-50 transition-all duration-300 ease-in-out lg:translate-x-0 shadow-xl",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo and Title Section */}
        <div className="p-4 border-b border-gray-800/60">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 relative">
              <Image src="/logo.png" alt="Logo" fill className="object-contain" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">BISTEC Global</h1>
              <p className="text-sm text-gray-400">Performance Management</p>
              <div className="flex items-center gap-2">
                <p className="text-xs text-gray-400">{ROLE_LABELS[currentRole].split(' ')[0]} Portal</p>
                {availableRoles.length > 1 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 px-2">
                        <BsChevronDown className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {availableRoles.map((role) => (
                        <DropdownMenuItem
                          key={role}
                          onClick={() => handleRoleSwitch(role)}
                          className={cn(
                            "flex items-center gap-2",
                            role === currentRole && "bg-blue-500/10 text-blue-400"
                          )}
                        >
                          <div className="flex-1">{ROLE_LABELS[role]}</div>
                          {role === currentRole && (
                            <BsCheckCircleFill className="h-3 w-3 text-blue-400" />
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="mt-6 px-4 flex flex-col h-[calc(100vh-180px)]">
          <div className="flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActivePath(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "mb-2 flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                    "relative group hover:bg-[#282d3d]",
                    isActive 
                      ? "bg-blue-600/90 text-white shadow-md before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-8 before:w-1 before:bg-blue-400 before:rounded-r-full" 
                      : "text-gray-300 hover:text-white"
                  )}
                >
                  <Icon className={cn(
                    "mr-3 h-5 w-5 transition-transform duration-200",
                    "group-hover:scale-110",
                    isActive ? "text-white" : "text-gray-400 group-hover:text-white"
                  )} />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Sign Out Button */}
          <div className="mb-6">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200 group"
            >
              <BsBoxArrowRight className="mr-3 h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
              Sign Out
            </button>
          </div>
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="lg:ml-64 min-h-screen bg-[#0f1117]">
        {/* Top Navigation Bar */}
        <nav className="fixed top-0 right-0 left-0 lg:left-64 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-b border-gray-800/60 shadow-md z-30">
          <div className="max-w-full px-4 mx-auto">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center">
                {/* Mobile Menu Button */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="text-gray-300 hover:text-white lg:hidden mr-4 p-1 hover:bg-white/10 rounded-lg transition-colors duration-200"
                >
                  <HiOutlineMenuAlt3 className="h-6 w-6" />
                </button>

                {/* Mobile Header - Only visible on mobile */}
                <div className="flex items-center space-x-3 lg:hidden">
                  <div className="w-8 h-8 relative">
                    <Image src="/logo.png" alt="Logo" fill className="object-contain" />
                  </div>
                  <h1 className="text-lg font-bold text-white">
                    BISTEC Global PEM
                  </h1>
                </div>

                {/* Desktop Welcome - Only visible on desktop */}
                
              </div>

              <div className="flex items-center space-x-4">
                {/* Notifications */}
                <button className="text-gray-300 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-all duration-200">
                  <BsBellFill className="h-5 w-5" />
                </button>

                {/* Profile/Role Switcher */}
                {session?.user && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="bg-[#282d3d] border-gray-700 text-gray-200 hover:bg-[#32374a] transition-all duration-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div className="relative w-7 h-7 bg-blue-500/10 rounded-md flex items-center justify-center">
                            <BsPersonCircle className="h-4 w-4 text-blue-400" />
                          </div>
                        </div>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                      className="w-64 bg-[#1a1d27]/95 backdrop-blur-sm border-gray-700/50 shadow-xl shadow-black/20 rounded-lg overflow-hidden"
                      align="end"
                      alignOffset={0}
                      sideOffset={8}
                    >
                      <div className="px-3 py-2 border-b border-gray-800/50">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                            <BsPersonCircle className="h-5 w-5 text-blue-400" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm text-gray-100">{session.user.name}</span>
                            <span className="text-xs text-gray-400">{session.user.email}</span>
                          </div>
                        </div>
                      </div>

                      {availableRoles.length > 1 && (
                        <div className="py-1">
                          <div className="px-3 py-1.5 text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Switch Role
                          </div>
                          {availableRoles.map((role) => (
                            <div
                              key={role}
                              onClick={() => handleRoleSwitch(role)}
                              className={cn(
                                "px-3 py-1.5 flex items-center space-x-2 cursor-pointer transition-all duration-200",
                                "text-gray-200 hover:text-white hover:bg-[#32374a]",
                                "relative",
                                currentRole === role ? "bg-[#32374a] text-white" : ""
                              )}
                            >
                              <div className={cn(
                                "w-6 h-6 rounded-md flex items-center justify-center",
                                role === 'ADMIN' && "bg-purple-500/10",
                                role === 'MANAGER' && "bg-blue-500/10",
                                role === 'EMPLOYEE' && "bg-green-500/10"
                              )}>
                                {role === 'ADMIN' && <BsShieldFillCheck className="h-3.5 w-3.5 text-purple-400" />}
                                {role === 'MANAGER' && <BsPeopleFill className="h-3.5 w-3.5 text-blue-400" />}
                                {role === 'EMPLOYEE' && <BsPersonFill className="h-3.5 w-3.5 text-green-400" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium truncate">{ROLE_LABELS[role].split(' ')[0]}</span>
                                  {currentRole === role && (
                                    <BsCheckCircleFill className="h-3.5 w-3.5 text-blue-400 ml-2" />
                                  )}
                                </div>
                                <span className="text-xs text-gray-400 truncate block">{ROLE_DESCRIPTIONS[role]}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <DropdownMenuSeparator className="bg-gray-800/50" />
                      
                      {/* Sign Out Option */}
                      <div className="py-1">
                        <button
                          onClick={handleSignOut}
                          className="w-full px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center space-x-2 transition-all duration-200"
                        >
                          <BsBoxArrowRight className="h-4 w-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Content Wrapper - Add padding-top to account for fixed header */}
        <div className="pt-16">
          {children}
        </div>
      </div>
    </div>
  );
} 
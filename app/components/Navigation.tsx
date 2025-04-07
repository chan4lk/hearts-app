'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

export default function Navigation() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isActive = (path: string) => {
    return pathname === path ? 'bg-gray-900' : '';
  };

  return (
    <nav className="bg-gray-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-white text-lg font-bold">Performance MS</span>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link
                  href="/dashboard"
                  className={`${isActive('/dashboard')} text-white rounded-md px-3 py-2 text-sm font-medium`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/goals"
                  className={`${isActive('/goals')} text-white rounded-md px-3 py-2 text-sm font-medium`}
                >
                  {session?.user.role === 'MANAGER' ? 'Goal Approvals' : 'My Goals'}
                </Link>
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              <span className="text-gray-300 text-sm mr-4">
                {session?.user.email} ({session?.user.role})
              </span>
              <button
                onClick={() => signOut()}
                className="text-gray-300 hover:bg-gray-700 hover:text-white rounded-md px-3 py-2 text-sm font-medium"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
} 
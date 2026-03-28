'use client';

import Link from 'next/link';
import Image from 'next/image';
import ThemeToggle from '@/app/components/ui/ThemeToggle';

export default function LandingHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface-primary/80 backdrop-blur-xl border-b border-theme">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="AspireHub" width={100} height={36} className="h-8 w-auto object-contain" />
          <div className="flex flex-col">
            <span className="text-sm font-bold text-primary leading-tight">AspireHub</span>
            <span className="text-2xs font-semibold text-accent tracking-widest uppercase leading-tight">Bistec Global</span>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link href="/login" className="px-4 py-2 text-sm font-medium text-secondary hover:text-primary transition-colors focus-ring rounded-xl">
            Sign In
          </Link>
        </div>
      </div>
    </header>
  );
}

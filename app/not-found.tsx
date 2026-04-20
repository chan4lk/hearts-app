import Link from 'next/link';
import { BsCompass, BsHouseDoor } from 'react-icons/bs';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface-primary flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-surface-elevated rounded-2xl border border-theme shadow-theme-lg p-8 text-center">
        <div className="w-14 h-14 bg-accent-muted rounded-2xl flex items-center justify-center mx-auto mb-5">
          <BsCompass className="w-7 h-7 text-accent" />
        </div>

        <p className="text-2xs font-bold text-tertiary tracking-widest uppercase mb-2">404</p>
        <h2 className="text-xl font-bold text-primary mb-2">Page not found</h2>
        <p className="text-sm text-secondary mb-6 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <Link
          href="/dashboard/feed"
          className="inline-flex items-center justify-center gap-2 h-10 px-6 text-sm font-semibold rounded-lg bg-accent text-[rgb(var(--color-text-inverse))] hover:opacity-90 transition-all duration-150 cursor-pointer focus-ring"
        >
          <BsHouseDoor className="w-4 h-4" />
          Back to Feed
        </Link>
      </div>
    </div>
  );
}

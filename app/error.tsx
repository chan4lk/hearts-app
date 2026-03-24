'use client';

import { useEffect } from 'react';
import { BsExclamationTriangle, BsArrowCounterclockwise } from 'react-icons/bs';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring (logger is server-only, so just track digest)
    if (error.digest) {
      // Production: error digest is safe to log client-side
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-surface-primary flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-surface-elevated rounded-2xl border border-theme shadow-theme-lg p-8 text-center">
        <div className="w-14 h-14 bg-error-muted rounded-2xl flex items-center justify-center mx-auto mb-5">
          <BsExclamationTriangle className="w-7 h-7 text-error" />
        </div>

        <h2 className="text-xl font-bold text-primary mb-2">Something went wrong</h2>
        <p className="text-sm text-secondary mb-6 leading-relaxed">
          An unexpected error occurred. Please try again or contact support if the problem persists.
        </p>

        {error.digest && (
          <p className="text-2xs text-tertiary mb-4 font-mono">
            Error ID: {error.digest}
          </p>
        )}

        <button
          onClick={reset}
          className="inline-flex items-center gap-2 h-10 px-6 text-sm font-semibold rounded-lg bg-accent text-[rgb(var(--color-text-inverse))] hover:opacity-90 transition-all duration-150 cursor-pointer focus-ring"
        >
          <BsArrowCounterclockwise className="w-4 h-4" />
          Try Again
        </button>
      </div>
    </div>
  );
}

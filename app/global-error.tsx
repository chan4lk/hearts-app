'use client';

// Rendered when an error is thrown in the root layout itself.
// global-error REPLACES the root <html>/<body>, so it must provide them
// and import globals.css directly (the root layout's import doesn't apply here).

import './globals.css';
import { useEffect } from 'react';
import { BsExclamationTriangle, BsArrowCounterclockwise, BsHouseDoor } from 'react-icons/bs';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Can't use the server logger here, but keep a structured line in the
    // browser console so it's grep-friendly in user bug reports.
    // eslint-disable-next-line no-console
    console.error(
      JSON.stringify({
        level: 'error',
        message: 'global-error',
        timestamp: new Date().toISOString(),
        digest: error?.digest,
        errorMessage: error?.message,
        stack: error?.stack,
      })
    );
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-surface-primary">
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-surface-elevated rounded-2xl border border-theme shadow-theme-lg p-8 text-center">
            <div className="w-14 h-14 bg-error-muted rounded-2xl flex items-center justify-center mx-auto mb-5">
              <BsExclamationTriangle className="w-7 h-7 text-error" />
            </div>

            <h2 className="text-xl font-bold text-primary mb-2">Something went wrong</h2>
            <p className="text-sm text-secondary mb-6 leading-relaxed">
              We hit an unexpected problem. Try reloading the page — if it keeps happening, let the
              admin know and share the error ID below.
            </p>

            {error.digest && (
              <p className="text-2xs text-tertiary mb-6 font-mono break-all">
                Error ID: {error.digest}
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center justify-center gap-2 h-10 px-5 text-sm font-semibold rounded-lg bg-accent text-[rgb(var(--color-text-inverse))] hover:opacity-90 transition-all duration-150 cursor-pointer focus-ring"
              >
                <BsArrowCounterclockwise className="w-4 h-4" />
                Try Again
              </button>
              <a
                href="/dashboard/feed"
                className="inline-flex items-center justify-center gap-2 h-10 px-5 text-sm font-semibold rounded-lg bg-surface-secondary text-primary hover:bg-surface-tertiary transition-all duration-150 cursor-pointer focus-ring"
              >
                <BsHouseDoor className="w-4 h-4" />
                Back to Feed
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import Loading from './loading';
import { motion } from 'framer-motion';

function ErrorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setMounted(true);

    const error = searchParams.get('error');

    const errorMessages: Record<string, string> = {
      AccessDenied: 'Access denied. Your account could not be created or verified. Please contact your administrator for access.',
      Verification: 'The sign in link is no longer valid. It may have been used already or it may have expired.',
      OAuthSignin: 'Error in the OAuth sign-in process. Please try again.',
      OAuthCallback: 'Error in the OAuth callback process. This may be due to a database connection issue. Please try again or contact support.',
      OAuthCreateAccount: 'Could not create your account. Please contact your administrator to set up your account.',
      EmailCreateAccount: 'Could not create email provider account. Please try again.',
      Callback: 'Error in the authentication callback. Please try again.',
      OAuthAccountNotLinked: 'This email is already associated with another account. Please sign in with the original provider.',
      EmailSignin: 'Error sending the email. Please try again.',
      CredentialsSignin: 'Invalid credentials. Please check your username and password.',
      SessionRequired: 'Authentication required. Please sign in to access this page.',
    };

    setErrorMessage(errorMessages[error || ''] || 'An unknown error occurred. Please try again.');
  }, [searchParams]);

  if (!mounted) return null;

  return (
    <main className="flex min-h-screen flex-col bg-surface-primary relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {/* Central radial glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(var(--color-error), 0.05) 0%, rgba(var(--color-accent), 0.02) 40%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
        {/* Floating decorative shapes */}
        <motion.div
          animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[15%] left-[10%] w-24 h-24 rounded-full bg-error-muted/30 blur-2xl"
        />
        <motion.div
          animate={{ y: [0, 15, 0], rotate: [0, -3, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute bottom-[20%] right-[12%] w-32 h-32 rounded-full bg-accent-muted/20 blur-2xl"
        />
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute top-[60%] left-[70%] w-16 h-16 rounded-full bg-error-muted/20 blur-xl"
        />
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(var(--color-accent), 0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(var(--color-accent), 0.5) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px',
          }}
        />
      </div>

      <div className="flex flex-1 items-center justify-center p-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.95, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md"
        >
          {/* Ambient glow behind card */}
          <div className="absolute -inset-4 rounded-[36px] bg-gradient-to-b from-[rgba(var(--color-error),0.1)] via-[rgba(var(--color-error),0.04)] to-transparent blur-2xl opacity-60" />

          <div className="relative rounded-2xl border border-theme bg-surface-elevated backdrop-blur-xl p-10 shadow-theme-lg transition-all duration-300">
            {/* Top highlight line */}
            <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-[rgba(var(--color-error),0.25)] to-transparent" />

            <div className="text-center space-y-7">
              {/* Animated error icon */}
              <div className="flex justify-center">
                <div className="relative">
                  <motion.div
                    animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -inset-4 rounded-full bg-error-muted blur-xl"
                  />
                  <motion.div
                    initial={{ scale: 0.8, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.5, delay: 0.3, type: 'spring', stiffness: 200 }}
                    className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-[rgba(var(--color-error),0.2)] to-[rgba(var(--color-error),0.08)] border border-[rgba(var(--color-error),0.2)] flex items-center justify-center"
                  >
                    <motion.svg
                      animate={{ y: [0, -2, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      className="w-8 h-8 text-error"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.8}
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </motion.svg>
                  </motion.div>
                </div>
              </div>

              <div className="space-y-3">
                <h1 className="text-2xl font-bold text-primary">
                  <span className="bg-gradient-to-r from-[rgb(var(--color-error))] to-[rgb(var(--color-accent))] bg-clip-text text-transparent">
                    Authentication Error
                  </span>
                </h1>
                <p className="text-sm text-secondary leading-relaxed max-w-sm mx-auto">{errorMessage}</p>
              </div>

              {/* Divider */}
              <div className="w-full h-px bg-gradient-to-r from-transparent via-[rgb(var(--color-border-primary))] to-transparent" />

              <div className="flex justify-center gap-3 pt-1">
                <Link
                  href="/login"
                  className="focus-ring inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[rgb(var(--color-accent))] to-[rgb(var(--color-cat-technical))] text-[rgb(var(--color-text-inverse))] text-sm font-semibold shadow-lg shadow-[rgb(var(--color-accent))]/20 hover:shadow-xl hover:shadow-[rgb(var(--color-accent))]/35 hover:-translate-y-0.5 transition-all duration-300"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                  </svg>
                  Return to Login
                </Link>
                <button
                  onClick={() => router.back()}
                  className="focus-ring px-6 py-2.5 rounded-xl border border-theme bg-surface-secondary hover:bg-surface-primary text-primary text-sm font-medium hover:-translate-y-0.5 hover:shadow-theme-md transition-all duration-300"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}

export default function ErrorPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ErrorContent />
    </Suspense>
  );
}

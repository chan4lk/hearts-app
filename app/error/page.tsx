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
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(239, 68, 68, 0.04) 0%, rgba(99, 102, 241, 0.02) 50%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(99, 102, 241, 0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(99, 102, 241, 0.5) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px',
          }}
        />
      </div>

      <div className="flex flex-1 items-center justify-center p-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md"
        >
          {/* Ambient glow */}
          <div className="absolute -inset-2 rounded-[28px] bg-gradient-to-b from-red-500/10 via-transparent to-transparent blur-xl opacity-50" />

          <div className="relative rounded-2xl border border-slate-800/60 bg-slate-900/50 backdrop-blur-xl p-8 shadow-2xl">
            {/* Top highlight */}
            <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-red-500/20 to-transparent" />

            <div className="text-center space-y-6">
              {/* Error icon */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute -inset-3 rounded-full bg-red-500/10 blur-lg animate-pulse-slow" />
                  <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/20 flex items-center justify-center">
                    <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <h1 className="text-xl font-bold text-white mb-2">Authentication Error</h1>
                <p className="text-sm text-slate-400 leading-relaxed">{errorMessage}</p>
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-medium shadow-lg shadow-indigo-500/20 transition-all duration-300"
                >
                  Return to Login
                </Link>
                <button
                  onClick={() => router.back()}
                  className="px-5 py-2.5 rounded-xl border border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/60 text-white text-sm font-medium transition-all duration-300"
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

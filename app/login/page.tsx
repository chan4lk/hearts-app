"use client";

import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense, useCallback, useMemo } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LoadingComponent from '@/app/components/LoadingPage';
import { Role } from '@prisma/client';
import { motion, AnimatePresence } from 'framer-motion';

// Map database roles to dashboard paths
const ROLE_DASHBOARD_MAP: Record<Role, string> = {
  ADMIN: '/dashboard/admin',
  MANAGER: '/dashboard/manager',
  EMPLOYEE: '/dashboard/employee'
};

// ─── Constellation Background ─────────────────────────────────────
function ConstellationBackground() {
  const stars = useMemo(() => [
    { x: 12, y: 8, size: 2, delay: 0, duration: 3.2 },
    { x: 85, y: 15, size: 1.5, delay: 0.8, duration: 4.1 },
    { x: 45, y: 5, size: 1, delay: 1.5, duration: 3.8 },
    { x: 72, y: 82, size: 2, delay: 0.3, duration: 2.9 },
    { x: 8, y: 65, size: 1.5, delay: 2.1, duration: 3.5 },
    { x: 92, y: 45, size: 1, delay: 1.2, duration: 4.3 },
    { x: 28, y: 90, size: 1.5, delay: 0.6, duration: 3.1 },
    { x: 65, y: 35, size: 2, delay: 1.8, duration: 3.7 },
    { x: 38, y: 55, size: 1, delay: 2.5, duration: 4.0 },
    { x: 78, y: 68, size: 1.5, delay: 0.4, duration: 3.3 },
    { x: 18, y: 38, size: 1, delay: 1.0, duration: 3.9 },
    { x: 55, y: 92, size: 2, delay: 2.2, duration: 2.8 },
    { x: 95, y: 22, size: 1, delay: 0.9, duration: 4.2 },
    { x: 42, y: 72, size: 1.5, delay: 1.6, duration: 3.4 },
    { x: 5, y: 88, size: 1, delay: 2.8, duration: 3.6 },
    { x: 68, y: 12, size: 2, delay: 0.2, duration: 4.5 },
    { x: 32, y: 28, size: 1, delay: 1.3, duration: 3.0 },
    { x: 88, y: 58, size: 1.5, delay: 2.0, duration: 3.2 },
  ], []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none dark:block hidden" aria-hidden="true">
      {/* Deep space gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#050a18] via-[#0B1120] to-[#1E1B4B]" />

      {/* Aurora bands */}
      <div
        className="absolute -top-1/2 -left-1/4 w-[150%] h-[60%] login-aurora"
        style={{
          background: 'radial-gradient(ellipse at 30% 50%, rgba(99, 102, 241, 0.12) 0%, transparent 60%)',
        }}
      />
      <div
        className="absolute -bottom-1/4 -right-1/4 w-[120%] h-[50%] login-aurora"
        style={{
          background: 'radial-gradient(ellipse at 70% 50%, rgba(139, 92, 246, 0.10) 0%, transparent 55%)',
          animationDelay: '4s',
          animationDirection: 'reverse',
        }}
      />

      {/* Nebula glow — center */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.06) 0%, rgba(139, 92, 246, 0.03) 40%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      {/* Stars */}
      {stars.map((star, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white login-star"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationDelay: `${star.delay}s`,
            animationDuration: `${star.duration}s`,
          }}
        />
      ))}

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(99, 102, 241, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99, 102, 241, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(5, 10, 24, 0.6) 100%)',
        }}
      />
    </div>
  );
}

// ─── Orbital Rings (decorative) ───────────────────────────────────
function OrbitalRings() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden="true">
      {/* Outer ring */}
      <div className="absolute w-[480px] h-[480px] sm:w-[560px] sm:h-[560px] login-orbit-ring">
        <div className="absolute inset-0 rounded-full border border-indigo-500/[0.06]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-indigo-400/40" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1 h-1 rounded-full bg-purple-400/30" />
      </div>
      {/* Inner ring */}
      <div className="absolute w-[380px] h-[380px] sm:w-[440px] sm:h-[440px] login-orbit-ring-reverse">
        <div className="absolute inset-0 rounded-full border border-purple-500/[0.05]" style={{ borderStyle: 'dashed' }} />
        <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-violet-400/40" />
      </div>
    </div>
  );
}

// ─── Login Form ───────────────────────────────────────────────────
function LoginForm() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status === 'loading') return;
    if (session?.user) {
      const userRole = session.user.role as Role;
      const redirectPath = ROLE_DASHBOARD_MAP[userRole] || ROLE_DASHBOARD_MAP.EMPLOYEE;
      router.push(redirectPath);
    }
  }, [session, status, router]);

  const handleAzureLogin = useCallback(async () => {
    try {
      setIsLoading(true);
      const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
      await signIn('azure-ad', { redirect: true, callbackUrl });
    } catch {
      toast.error('An error occurred during login. Please try again.');
      setIsLoading(false);
    }
  }, [searchParams]);

  if (!mounted || status === 'loading') return <LoadingComponent />;
  if (session?.user) return <LoadingComponent />;

  // Framer Motion stagger variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 18, filter: 'blur(4px)' },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <main className="relative flex flex-col min-h-screen overflow-hidden">
      {/* Light mode background */}
      <div className="fixed inset-0 bg-gradient-to-br from-[rgba(var(--color-accent-muted),1)] via-[rgb(var(--color-bg-elevated))] to-[rgba(var(--color-accent-subtle),0.3)] dark:hidden" />
      <ConstellationBackground />

      <div className="relative flex-1 flex items-center justify-center px-4 py-12 sm:py-16">
        <OrbitalRings />

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.95, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[380px] relative z-10"
        >
          {/* Ambient glow behind card */}
          <div className="absolute -inset-4 rounded-[32px] bg-gradient-to-b from-indigo-500/15 via-purple-500/8 to-transparent blur-2xl opacity-70" />

          <div className="login-glass-card rounded-[24px] p-8 sm:p-10 relative overflow-hidden">
            {/* Shimmer overlay */}
            <div className="absolute inset-0 login-shimmer rounded-[24px] pointer-events-none" />

            {/* Inner top highlight */}
            <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-indigo-400/25 to-transparent" />

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="relative space-y-8"
            >
              {/* ─── Branding ─── */}
              <motion.div variants={itemVariants} className="text-center space-y-5">
                {/* Logo mark */}
                <div className="flex justify-center">
                  <div className="relative">
                    {/* Outer glow pulse */}
                    <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 blur-xl animate-pulse-slow" />
                    {/* Logo container */}
                    <motion.div
                      whileHover={{ scale: 1.05, rotate: 2 }}
                      transition={{ type: 'spring', stiffness: 400 }}
                      className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 flex items-center justify-center shadow-xl shadow-indigo-500/30"
                    >
                      {/* Inner shine */}
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/15 to-transparent" />
                      <svg className="w-8 h-8 text-white relative" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                      </svg>
                    </motion.div>
                  </div>
                </div>

                {/* Status badge */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent-muted border border-[rgba(var(--color-accent),0.12)]">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                  </span>
                  <span className="text-accent text-2xs font-semibold tracking-[0.15em] uppercase">
                    AspireHub Portal
                  </span>
                </div>

                <div className="space-y-2">
                  <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-primary leading-none">
                    Welcome back
                  </h1>
                  <p className="text-sm text-secondary leading-relaxed max-w-[260px] mx-auto">
                    Sign in to track and elevate your performance journey
                  </p>
                </div>
              </motion.div>

              {/* ─── Divider line ─── */}
              <motion.div variants={itemVariants}>
                <div className="w-full h-px bg-gradient-to-r from-transparent via-[rgb(var(--color-border-primary))] to-transparent" />
              </motion.div>

              {/* ─── Microsoft SSO Button ─── */}
              <motion.div variants={itemVariants}>
                <motion.button
                  onClick={handleAzureLogin}
                  disabled={isLoading}
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className="login-btn-primary group w-full relative flex items-center justify-center gap-3 h-[52px] px-6 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:via-indigo-400 hover:to-purple-500 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <AnimatePresence mode="wait">
                    {isLoading ? (
                      <motion.span
                        key="loading"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center gap-2.5"
                      >
                        <svg className="animate-spin h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span className="text-sm">Connecting to Microsoft...</span>
                      </motion.span>
                    ) : (
                      <motion.span
                        key="idle"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center gap-3"
                      >
                        {/* Microsoft logo */}
                        <svg className="w-[18px] h-[18px] group-hover:scale-110 transition-transform duration-300" viewBox="0 0 21 21" fill="none">
                          <rect x="1" y="1" width="9" height="9" fill="#F25022" />
                          <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
                          <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
                          <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
                        </svg>
                        <span className="text-sm">Sign in with Microsoft</span>
                        <svg className="w-4 h-4 opacity-60 group-hover:translate-x-0.5 transition-transform duration-300" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </motion.div>

              {/* ─── Footer info ─── */}
              <motion.div variants={itemVariants} className="text-center space-y-3 pt-1">
                <p className="text-xs text-tertiary leading-relaxed">
                  Access your dashboard securely with your <br className="sm:hidden" />
                  organization&apos;s Microsoft account
                </p>
                <div className="flex items-center justify-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <svg className="w-3 h-3 text-emerald-500/60" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                    <span className="text-2xs text-tertiary font-medium tracking-wide">
                      SSO Protected
                    </span>
                  </div>
                  <div className="w-px h-3 bg-slate-700/30" />
                  <div className="flex items-center gap-1.5">
                    <svg className="w-3 h-3 text-indigo-400/50" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                    <span className="text-2xs text-tertiary font-medium tracking-wide">
                      Enterprise Grade
                    </span>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      <ToastContainer
        position="bottom-right"
        theme="dark"
        toastStyle={{
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(99, 102, 241, 0.15)',
          borderRadius: '12px',
        }}
      />
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingComponent />}>
      <LoginForm />
    </Suspense>
  );
}

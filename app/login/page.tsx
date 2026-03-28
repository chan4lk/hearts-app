"use client";

import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import LoadingComponent from '@/app/components/LoadingPage';

function LoginForm() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (status === 'loading') return;
    if (session?.user) router.push('/dashboard/feed');
  }, [session, status, router]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Please enter both email and password'); return; }
    setIsLoading(true); setError('');
    try {
      const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
      const result = await signIn('credentials', { email: email.trim(), password, redirect: false, callbackUrl });
      if (result?.error) { setError('Invalid email or password'); setIsLoading(false); }
      else if (result?.ok) router.refresh();
    } catch { setError('Login failed. Please try again.'); setIsLoading(false); }
  };

  const handleAzureLogin = async () => {
    setIsLoading(true);
    const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
    await signIn('azure-ad', { redirect: true, callbackUrl });
  };

  if (!mounted || status === 'loading' || session?.user) return <LoadingComponent />;

  return (
    <div className="min-h-screen bg-surface-primary flex">
      {/* Left — Branding panel (desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[rgba(var(--color-accent),0.08)] via-surface-primary to-[rgba(var(--color-heart),0.06)] items-center justify-center p-12">
        <div className="max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <Image src="/logo.png" alt="AspireHub" width={120} height={44} className="h-10 w-auto object-contain" />
            <div>
              <span className="text-lg font-bold text-primary">AspireHub</span>
              <span className="block text-2xs font-semibold text-accent tracking-widest uppercase">Bistec Global</span>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-primary mb-4 leading-tight">
            Where peer recognition<br />
            <span className="bg-gradient-to-r from-[rgb(var(--color-heart))] to-[rgb(var(--color-accent))] bg-clip-text text-transparent">
              drives performance
            </span>
          </h2>

          <p className="text-secondary mb-8 leading-relaxed">
            Give hearts, track goals, and receive evidence-based reviews. AspireHub makes performance management feel human.
          </p>

          <div className="space-y-3">
            {[
              { icon: Heart, text: 'Recognition that flows into reviews', color: '--color-heart' },
              { icon: ArrowRight, text: 'Goals with collaborative approval', color: '--color-goal-active' },
              { icon: ArrowRight, text: 'Reviews pre-populated with evidence', color: '--color-review' },
            ].map(({ icon: Icon, text, color }, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `rgba(var(${color}),0.1)` }}>
                  <Icon className="w-4 h-4" style={{ color: `rgb(var(${color}))` }} />
                </div>
                <span className="text-sm text-secondary">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative hearts */}
        <div className="absolute top-20 right-20 opacity-5">
          <Heart className="w-40 h-40 text-[rgb(var(--color-heart))]" fill="currentColor" />
        </div>
        <div className="absolute bottom-20 left-20 opacity-5">
          <Heart className="w-24 h-24 text-[rgb(var(--color-accent))]" fill="currentColor" />
        </div>
      </div>

      {/* Right — Login form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-2 mb-8 lg:hidden">
            <Image src="/logo.png" alt="AspireHub" width={100} height={36} className="h-9 w-auto object-contain" />
            <div>
              <span className="text-sm font-bold text-primary">AspireHub</span>
              <span className="block text-2xs font-semibold text-accent tracking-widest uppercase">Bistec Global</span>
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-primary mb-2">Welcome back</h1>
            <p className="text-sm text-secondary">Sign in to your performance dashboard</p>
          </div>

          {/* Azure AD — Primary */}
          <button
            onClick={handleAzureLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 h-12 px-6 bg-surface-elevated border border-theme rounded-xl text-sm font-semibold text-primary hover:bg-surface-secondary focus-ring transition-all disabled:opacity-50 shadow-theme-sm mb-6"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 48 48" fill="none"><path d="M11 4h12v12H11V4z" fill="#F25022"/><path d="M25 4h12v12H25V4z" fill="#7FBA00"/><path d="M11 18h12v12H11V18z" fill="#00A4EF"/><path d="M25 18h12v12H25V18z" fill="#FFB900"/></svg>
                Sign in with Microsoft
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-theme" /></div>
            <div className="relative flex justify-center"><span className="px-3 bg-surface-primary text-xs text-tertiary">or sign in with email</span></div>
          </div>

          {/* Email/Password form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="text-sm font-medium text-secondary mb-1.5 block">Email</label>
              <input
                id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com" disabled={isLoading} required
                className="w-full px-3.5 py-2.5 bg-surface-primary border border-theme rounded-xl text-sm text-primary placeholder:text-tertiary focus-ring"
              />
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-medium text-secondary mb-1.5 block">Password</label>
              <div className="relative">
                <input
                  id="password" type={showPassword ? "text" : "password"} value={password}
                  onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password"
                  disabled={isLoading} required
                  className="w-full px-3.5 py-2.5 pr-10 bg-surface-primary border border-theme rounded-xl text-sm text-primary placeholder:text-tertiary focus-ring"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-tertiary hover:text-secondary focus-ring rounded" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-error bg-error-muted rounded-lg px-3 py-2">{error}</p>
            )}

            <button type="submit" disabled={isLoading}
              className="w-full h-12 bg-accent text-[rgb(var(--color-text-inverse))] font-semibold rounded-xl hover:opacity-90 focus-ring transition-all disabled:opacity-50 shadow-sm shadow-[rgba(var(--color-accent),0.2)]">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-xs text-tertiary mt-6">
            Powered by BISTEC Global
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingComponent />}>
      <LoginForm />
    </Suspense>
  );
}

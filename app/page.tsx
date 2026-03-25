import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import { Features } from '@/app/components/features';
import { AzureIntegration } from '@/app/components/azure';
import Link from 'next/link';

const stats = [
  { value: '10x', label: 'Faster reviews', icon: '⚡' },
  { value: '98%', label: 'User satisfaction', icon: '✦' },
  { value: '3K+', label: 'Goals tracked', icon: '◎' },
  { value: '50+', label: 'Organizations', icon: '▣' },
];

export default async function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-surface-primary">
      <Header userName="" />

      <main className="flex-grow flex flex-col">
        {/* ═══ Hero Section — Editorial/Magazine Style ═══ */}
        <section className="relative min-h-[100vh] flex items-center px-5 sm:px-8 lg:px-12 pt-20 pb-12 overflow-hidden">
          {/* Background — Layered depth */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Grid pattern */}
            <div
              className="absolute inset-0 bg-grid opacity-40 dark:opacity-100"
              style={{
                maskImage: 'radial-gradient(ellipse 80% 60% at 50% 35%, black, transparent)',
                WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 35%, black, transparent)',
              }}
            />
            {/* Primary glow — top left */}
            <div className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-gradient-to-br from-[rgb(var(--color-accent))]/[0.08] via-[rgb(var(--color-cat-technical))]/[0.04] to-transparent rounded-full blur-3xl" />
            {/* Secondary glow — bottom right */}
            <div className="absolute -bottom-48 -right-48 w-[500px] h-[500px] bg-gradient-to-tl from-[rgb(var(--color-cat-kpi))]/[0.06] via-[rgb(var(--color-success))]/[0.03] to-transparent rounded-full blur-3xl" />
            {/* Floating geometric shapes */}
            <div className="absolute top-1/4 right-[15%] w-32 h-32 border border-[rgba(var(--color-accent),0.08)] rounded-2xl rotate-12 animate-float-slow" />
            <div className="absolute bottom-1/3 left-[10%] w-20 h-20 border border-[rgba(var(--color-cat-technical),0.1)] rounded-full animate-float-medium" />
            <div className="absolute top-[60%] right-[8%] w-16 h-16 bg-gradient-to-br from-[rgb(var(--color-accent))]/[0.04] to-transparent rounded-lg rotate-45" />
          </div>

          <div className="max-w-7xl mx-auto w-full relative z-10">
            <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-16 items-center">
              {/* Left — Content */}
              <div>
                {/* Eyebrow badge */}
                <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[rgba(var(--color-accent),0.06)] border border-[rgba(var(--color-accent),0.1)] mb-8">
                  <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-60" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
                  </div>
                  <span className="text-accent text-xs font-semibold tracking-wide">
                    Performance Management Platform
                  </span>
                </div>

                {/* Headline — bold editorial */}
                <h1 className="text-[clamp(2.25rem,5.5vw,4.5rem)] font-bold text-primary tracking-tight leading-[1.05] mb-6">
                  <span className="block">Align goals.</span>
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[rgb(var(--color-accent))] via-[rgb(var(--color-cat-technical))] to-[rgb(var(--color-info))]">
                    Track progress.
                  </span>
                  <span className="block">Grow your team.</span>
                </h1>

                {/* Subhead */}
                <p className="text-base sm:text-lg text-secondary max-w-lg leading-relaxed mb-10">
                  AspireHub gives managers and employees a shared space to set goals,
                  run reviews, and track performance — with AI-powered insights built in.
                </p>

                {/* CTA buttons */}
                <div className="flex flex-col sm:flex-row items-start gap-3 mb-12">
                  <Link
                    href="/login"
                    className="w-full sm:w-auto group inline-flex items-center justify-center gap-2.5 px-7 py-3.5 text-sm font-semibold text-[rgb(var(--color-text-inverse))] bg-accent rounded-xl shadow-lg shadow-[rgb(var(--color-accent))]/25 hover:shadow-xl hover:shadow-[rgb(var(--color-accent))]/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
                  >
                    Start for free
                    <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </Link>
                  <a
                    href="#features"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm font-medium text-primary bg-surface-secondary hover:bg-surface-tertiary border border-theme rounded-xl transition-all duration-200 hover:-translate-y-0.5"
                  >
                    See how it works
                  </a>
                </div>

                {/* Stats — inline */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {stats.map(({ value, label, icon }) => (
                    <div key={label} className="group">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xs text-accent opacity-60">{icon}</span>
                        <span className="text-xl sm:text-2xl font-bold text-primary tracking-tight">{value}</span>
                      </div>
                      <div className="text-xs text-tertiary font-medium mt-0.5">{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right — Floating UI Preview Cards */}
              <div className="hidden lg:block relative">
                <div className="relative w-full aspect-square max-w-md mx-auto">
                  {/* Background glow */}
                  <div className="absolute inset-8 bg-gradient-to-br from-[rgb(var(--color-accent))]/[0.06] via-[rgb(var(--color-cat-technical))]/[0.04] to-transparent rounded-3xl blur-2xl" />

                  {/* Card 1 — Goal Progress */}
                  <div className="absolute top-8 left-4 right-12 p-5 bg-surface-elevated rounded-2xl border border-theme shadow-theme-lg animate-float-slow">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-primary">Goal Progress</span>
                      <span className="text-2xs font-medium text-success px-2 py-0.5 bg-success-muted rounded-full">On Track</span>
                    </div>
                    <div className="space-y-2.5">
                      {[
                        { name: 'Q1 Objectives', pct: 85 },
                        { name: 'Team KPIs', pct: 72 },
                        { name: 'Training', pct: 95 },
                      ].map(({ name, pct }) => (
                        <div key={name}>
                          <div className="flex justify-between text-2xs mb-1">
                            <span className="text-secondary">{name}</span>
                            <span className="text-primary font-semibold">{pct}%</span>
                          </div>
                          <div className="h-1.5 bg-surface-secondary rounded-full overflow-hidden">
                            <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card 2 — Rating Summary */}
                  <div className="absolute bottom-16 left-0 w-48 p-4 bg-surface-elevated rounded-2xl border border-theme shadow-theme-lg animate-float-medium">
                    <span className="text-xs font-semibold text-primary block mb-2">Rating</span>
                    <div className="flex items-end gap-1">
                      <span className="text-3xl font-bold text-accent leading-none">4.8</span>
                      <span className="text-2xs text-tertiary mb-1">/5.0</span>
                    </div>
                    <div className="flex gap-0.5 mt-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg key={star} className={`w-3.5 h-3.5 ${star <= 4 ? 'text-[rgb(var(--color-warning))]' : 'text-[rgb(var(--color-warning))]/40'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>

                  {/* Card 3 — Activity */}
                  <div className="absolute bottom-4 right-0 w-52 p-4 bg-surface-elevated rounded-2xl border border-theme shadow-theme-lg" style={{ animationDelay: '1s' }}>
                    <span className="text-xs font-semibold text-primary block mb-3">Recent Activity</span>
                    <div className="space-y-2">
                      {[
                        { label: 'Goal approved', time: '2m ago', dot: 'bg-[rgb(var(--color-success))]' },
                        { label: 'Review completed', time: '1h ago', dot: 'bg-accent' },
                        { label: 'Feedback received', time: '3h ago', dot: 'bg-[rgb(var(--color-warning))]' },
                      ].map(({ label, time, dot }) => (
                        <div key={label} className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
                          <span className="text-2xs text-secondary flex-1">{label}</span>
                          <span className="text-2xs text-tertiary">{time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ Features ═══ */}
        <Features />

        {/* ═══ Integration ═══ */}
        <AzureIntegration />

        {/* ═══ CTA Section — Bold closing ═══ */}
        <section id="security" className="py-24 md:py-32 bg-surface-primary relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[rgb(var(--color-border-primary))] to-transparent" />
          {/* Background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-r from-[rgb(var(--color-accent))]/[0.04] via-[rgb(var(--color-cat-technical))]/[0.03] to-transparent rounded-full blur-3xl" />

          <div className="max-w-3xl mx-auto px-5 sm:px-8 text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(var(--color-success),0.08)] border border-[rgba(var(--color-success),0.12)] mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--color-success))]" />
              <span className="text-success text-xs font-semibold tracking-wide">Ready to start</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary tracking-tight leading-tight mb-5">
              Ready to transform your{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[rgb(var(--color-accent))] to-[rgb(var(--color-cat-technical))]">
                team&apos;s performance
              </span>
              ?
            </h2>
            <p className="text-base sm:text-lg text-secondary mb-10 max-w-xl mx-auto leading-relaxed">
              Join organizations already using AspireHub to align goals, run better reviews, and grow their people.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2.5 px-8 py-4 text-sm font-semibold text-[rgb(var(--color-text-inverse))] bg-accent rounded-xl shadow-lg shadow-[rgb(var(--color-accent))]/25 hover:shadow-xl hover:shadow-[rgb(var(--color-accent))]/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
              >
                Get started free
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

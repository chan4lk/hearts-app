import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import { Features } from '@/app/components/features';
import { AzureIntegration } from '@/app/components/azure';
import Link from 'next/link';

const stats = [
  { value: '10x', label: 'Faster reviews' },
  { value: '98%', label: 'User satisfaction' },
  { value: '3K+', label: 'Goals tracked' },
  { value: '50+', label: 'Organizations' },
];

export default async function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-surface-primary">
      <Header userName="" />

      <main className="flex-grow flex flex-col">
        {/* ═══ Hero Section ═══ */}
        <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center px-5 sm:px-8 pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Grid */}
            <div className="absolute inset-0 bg-grid opacity-30 dark:opacity-100" style={{ maskImage: 'radial-gradient(ellipse 70% 50% at 50% 40%, black, transparent)', WebkitMaskImage: 'radial-gradient(ellipse 70% 50% at 50% 40%, black, transparent)' }} />
            {/* Accent glow */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-r from-indigo-500/[0.07] via-purple-500/[0.05] to-pink-500/[0.03] rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[200px] bg-indigo-500/[0.04] rounded-full blur-3xl" />
          </div>

          <div className="max-w-4xl mx-auto text-center relative z-10">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[rgba(var(--color-accent),0.06)] border border-[rgba(var(--color-accent),0.1)] mb-7">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-500 opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
              </div>
              <span className="text-accent text-xs sm:text-xs font-semibold tracking-wide">
                Performance Management Platform
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-[clamp(2rem,5vw,3.75rem)] font-bold text-primary tracking-tight leading-[1.1] mb-5">
              Align goals.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-400">
                Track progress.
              </span>
              <br />
              Grow your team.
            </h1>

            {/* Subhead */}
            <p className="text-base sm:text-lg text-secondary max-w-xl mx-auto leading-relaxed mb-9">
              AspireHub gives managers and employees a shared space to set goals,
              run reviews, and track performance — with AI-powered insights built in.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
              <Link
                href="/login"
                className="w-full sm:w-auto group inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-[rgb(var(--color-text-inverse))] bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 rounded-lg shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-200 hover:-translate-y-px"
              >
                Start for free
                <svg className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              <a
                href="#features"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-primary bg-surface-secondary hover:bg-surface-tertiary border border-theme rounded-lg transition-all duration-200"
              >
                See how it works
              </a>
            </div>
          </div>

          {/* Stats bar */}
          <div className="absolute bottom-0 inset-x-0">
            <div className="max-w-4xl mx-auto px-5 sm:px-8 pb-8 md:pb-12">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8">
                {stats.map(({ value, label }) => (
                  <div key={label} className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-primary tracking-tight">{value}</div>
                    <div className="text-xs sm:text-xs text-tertiary font-medium mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══ Features ═══ */}
        <Features />

        {/* ═══ Integration ═══ */}
        <AzureIntegration />

        {/* ═══ CTA Section ═══ */}
        <section id="security" className="py-20 md:py-28 bg-surface-primary relative">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[rgb(var(--color-border-primary))] to-transparent" />
          <div className="max-w-3xl mx-auto px-5 sm:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-primary tracking-tight mb-4">
              Ready to transform your team&apos;s performance?
            </h2>
            <p className="text-base sm:text-lg text-secondary mb-8 max-w-xl mx-auto">
              Join organizations already using AspireHub to align goals, run better reviews, and grow their people.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm font-semibold text-[rgb(var(--color-text-inverse))] bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-lg shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-200 hover:-translate-y-px"
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

import Link from 'next/link';
import Image from 'next/image';
import { Heart, Target, ClipboardCheck, Calendar, BarChart3, Shield, ArrowRight, CheckCircle, Sparkles } from 'lucide-react';
import LandingHeader from '@/app/components/LandingHeader';

const features = [
  { icon: Heart, title: 'Hearts Recognition', description: 'Give hearts to colleagues for living company values. Recognition that flows into performance reviews.', color: '--color-heart' },
  { icon: Target, title: 'Goal Management', description: 'Set goals, get manager approval, track progress. Collaborative goal-setting with real-time updates.', color: '--color-goal-active' },
  { icon: ClipboardCheck, title: 'Review Cycles', description: 'Evidence-based reviews pre-populated with hearts and goals. No more blank forms.', color: '--color-review' },
  { icon: Calendar, title: 'Company Events', description: 'Plan events, send invitations, track attendance. One-click RSVP from email.', color: '--color-accent' },
  { icon: BarChart3, title: 'Analytics', description: 'Role-scoped dashboards. See team performance, recognition patterns, and goal completion.', color: '--color-goal-completed' },
  { icon: Shield, title: 'Admin Control', description: 'Manage users, roles, company values. Azure AD auto-provisioning. Full audit trail.', color: '--color-error' },
];

const benefits = [
  'Reviews pre-populated with evidence — not blank forms',
  'Hearts recognition feeds directly into performance reviews',
  'Collaborative goal approval — not bureaucratic gatekeeping',
  '6-state goal workflow with inline progress tracking',
  'Role-progressive interface — one app, three depths',
  'Azure AD auto-provisioning — zero manual user setup',
];

export default function Home() {
  return (
    <div className="min-h-screen bg-surface-primary">
      <LandingHeader />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[rgba(var(--color-heart),0.08)] text-[rgb(var(--color-heart))] text-sm font-semibold mb-8">
            <Sparkles className="w-4 h-4" />
            Where peer recognition drives performance intelligence
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-primary leading-[1.1] tracking-tight mb-6">
            Performance reviews<br />
            <span className="bg-gradient-to-r from-[rgb(var(--color-heart))] via-[rgb(var(--color-accent))] to-[rgb(var(--color-review))] bg-clip-text text-transparent">
              people actually trust
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
            AspireHub replaces blank review forms with evidence-based performance management.
            Every heart given, every goal tracked, every review pre-populated with real data.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/login" className="px-8 py-3.5 bg-accent text-[rgb(var(--color-text-inverse))] text-base font-semibold rounded-xl hover:opacity-90 focus-ring shadow-md shadow-[rgba(var(--color-accent),0.25)] transition-all flex items-center gap-2">
              Start Using AspireHub <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { value: '<30 min', label: 'Review time', sub: 'vs 3+ hours' },
              { value: '6', label: 'Goal states', sub: 'Full workflow' },
              { value: '100%', label: 'Evidence-based', sub: 'Hearts + Goals' },
              { value: '3 roles', label: 'One interface', sub: 'Progressive depth' },
            ].map(({ value, label, sub }) => (
              <div key={label} className="bg-surface-elevated rounded-2xl border border-theme p-4 shadow-theme-sm">
                <p className="text-2xl font-bold text-primary">{value}</p>
                <p className="text-xs font-semibold text-secondary">{label}</p>
                <p className="text-2xs text-tertiary">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 bg-surface-secondary">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-3">Everything you need</h2>
            <p className="text-lg text-secondary max-w-xl mx-auto">A complete performance management platform built around peer recognition</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, description, color }) => (
              <div key={title} className="bg-surface-elevated rounded-2xl border border-theme p-6 shadow-theme-sm hover:shadow-theme-md transition-all group">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform" style={{ backgroundColor: `rgba(var(${color}),0.1)` }}>
                  <Icon className="w-6 h-6" style={{ color: `rgb(var(${color}))` }} />
                </div>
                <h3 className="text-base font-semibold text-primary mb-2">{title}</h3>
                <p className="text-sm text-secondary leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-3">Why AspireHub is different</h2>
            <p className="text-lg text-secondary">Built from real-world research of how Google, Microsoft, Adobe, and Netflix do performance management</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-start gap-3 bg-surface-elevated rounded-xl border border-theme p-4 shadow-theme-sm">
                <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                <p className="text-sm text-primary font-medium">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-br from-[rgba(var(--color-accent),0.05)] to-[rgba(var(--color-heart),0.05)]">
        <div className="max-w-3xl mx-auto text-center">
          <Heart className="w-12 h-12 text-[rgb(var(--color-heart))] mx-auto mb-6" fill="currentColor" />
          <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-4">Ready to build a culture of recognition?</h2>
          <p className="text-lg text-secondary mb-8">Sign in with your Microsoft account to get started instantly.</p>
          <Link href="/login" className="inline-flex items-center gap-2 px-8 py-3.5 bg-accent text-[rgb(var(--color-text-inverse))] text-base font-semibold rounded-xl hover:opacity-90 focus-ring shadow-md shadow-[rgba(var(--color-accent),0.25)]">
            Sign in with Azure AD <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-theme">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="AspireHub" width={80} height={28} className="h-6 w-auto object-contain" />
            <span className="text-sm font-semibold text-primary">AspireHub</span>
            <span className="text-xs text-tertiary">by Bistec Global</span>
          </div>
          <p className="text-xs text-tertiary">&copy; {new Date().getFullYear()} Bistec Global. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
